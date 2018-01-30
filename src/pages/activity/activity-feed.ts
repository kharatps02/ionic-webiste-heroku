import { Component, NgZone, ViewChild, OnDestroy } from '@angular/core';
import { NavController, Platform, Events, Content, FabContainer, NavParams } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';
import { TextToSpeech, TTSOptions } from '@ionic-native/text-to-speech';
import { ChatBox } from '../conversations/chat-box/chat-box';
import { UserService, IUser } from '../../providers/user-service';
import { ActivityService, IPageState, IActivityFeed, IActivityFeedOption, IGetActivityFeedsParams, IGetActivityFeedsResponse, ISubmitPollParams, IUpdateActionTakenCountParams, ILikeFeedParams, ILikeFeedResponse } from './activity-service';
import { ChatService } from '../conversations/chat-service';
import { CONSTANTS } from '../../shared/config';
import { PubNubService } from '../../providers/pubnub-service';
import { AnalyticsService } from '../../providers/analytics-service';
import { LoaderService } from '../../providers/loader-service';
import { IConversation } from '../conversations/chat-service';
import { CallNumber } from "@ionic-native/call-number";
import { TranslateService } from "@ngx-translate/core";
import { SocialSharing } from '@ionic-native/social-sharing';
import { ProviderDetails } from "../aroundme/provider-details/provider-details";
import { ContactListPage } from "./contact-list/contact-list";
import { CreateFeedPage } from './create-feed/create-feed';

declare let cordova;

@Component({
    selector: 'activity-feed',
    templateUrl: 'activity-feed.html',
    providers: [ActivityService]
})

export class ActivityPage implements OnDestroy {
    private userInfo: IUser;
    private zone: NgZone;
    private activityPageState: IPageState;
    private isCordovaPlatform: boolean;
    private isFavorites: boolean = false;
    public activityFeeds: Array<IActivityFeed>;
    public expandFeedCollection: Map<string, boolean> = new Map();
    public activityTemplates: Array<string>;
    public isActivityAPICall: boolean = false;
    public activityInfiniteScrollEnabled: boolean = true;
    private notificationID: number = 0;
    private favoriteFeedChanges: Map<string, IActivityFeed> = new Map<string, IActivityFeed>();
    public usertype = CONSTANTS.USER_TYPE;
    private feedPosition: number;


    @ViewChild(Content) activityFeedContent: Content;

    constructor(private activityService: ActivityService, private navCtrl: NavController, public navParams: NavParams, private userService: UserService,
        private platform: Platform, public events: Events, private pubNubService: PubNubService,
        private analyticsService: AnalyticsService, private translateService: TranslateService,
        private callNumber: CallNumber, private socialSharing: SocialSharing, private tts: TextToSpeech,
        private loaderService: LoaderService, private chatService: ChatService, private keyboard: Keyboard) {

        this.activityService = activityService;
        this.navCtrl = navCtrl;
        this.activityFeeds = [];
        this.activityPageState = {
            pageNumber: 0,
            pageSize: CONSTANTS.DEFAULT_PAGE_SIZE.FEED,
            total: 0
        };
        this.userInfo = userService.getUser();
        this.zone = new NgZone({ enableLongStackTrace: false });
        this.activityTemplates = ['Alert', 'Advertisement', 'Crime Alert', 'Article/Blog/Info', 'System Announcement', 'Property Manager Announcement', 'Poll', 'Incident', "Profile", "Placement", "Residency Connect", "Residency Deny", "Residency Accept","Explor Rezility"];
        this.isCordovaPlatform = this.platform.is('cordova');
        this.isFavorites = this.navParams.get('favorites');
        if (!this.isFavorites) {
            this.initReLoadActivityFeedEvent();
            this.initUpdateFavoriteFeedEvent();
        }
        this.initTextToSpeechEvent();
        // TODO - Need to move from here once Keyboard issue fixed 
        this.keyboard.close();
    }

    ionViewDidLoad() {
        if (this.isFavorites) {
            this.favoriteFeedChanges = new Map<string, IActivityFeed>();
        }
        this.loadActivityFeed(null, this.loadActivityFeedCallback);
    }

    ionViewDidEnter() {
        this.userInfo = this.userService.getUser();
        this.userService.setCurrentPage(CONSTANTS.PAGES.ACTIVITY_FEED);

        // Scroll to top on user tap on feed 
        if (this.pubNubService.feedBadgeCount !== "") {
            this.activityFeedContent.scrollToTop(CONSTANTS.ACTIVITY_FEED_SCROLL_TO_TOP_DURATION);
        }
        this.analyticsService.trackScreenView(CONSTANTS.PAGES.ACTIVITY_FEED);
        this.pubNubService.feedBadgeCount = "";
        // console.log("In ActivityPage:ionViewDidEnter Current page is ", this.userService.getCurrentPage().currentPage);
    }


    initTextToSpeechEvent(): void {
        this.events.subscribe(CONSTANTS.APP_EVENTS.STOP_TTS, () => {
            this.stopSpeech();
        });
    }

    stopSpeech() {
        if (this.feedPosition !== undefined) {
            this.activityFeeds[this.feedPosition].isReading = false;
            this.tts.stop();
            this.feedPosition = undefined;
        }
    }
    initReLoadActivityFeedEvent(): void {
        this.events.subscribe('reLoadActivityFeed', (userEventData) => {
            this.reLoadNewActivityFeed(userEventData);
        });
    }

    initUpdateFavoriteFeedEvent(): void {
        this.events.subscribe('updateFavoriteFeedEvent', (favoriteFeedUpdates: Map<string, IActivityFeed>) => {
            let isProfileUpdated: boolean = false;
            this.activityFeeds.forEach(function (activity) {
                if (favoriteFeedUpdates[activity._id]) {
                    Object.assign(activity, favoriteFeedUpdates[activity._id]);
                    if (activity.template === "Profile") {
                        isProfileUpdated = true;
                    }
                }
            });
            //Remove profile update feeds. 
            if (isProfileUpdated) {
                this.activityFeeds = this.activityFeeds.filter(function (activity) {
                    if (favoriteFeedUpdates[activity._id]) {
                        return (activity.template !== "Profile");
                    }
                });
            }


        });

    }


    ngOnDestroy() {
        // console.log("Activity Feed page is destroyed!!");
    }

    reLoadNewActivityFeed(userEventData): void {
        // console.log('In Event reLoadActivityFeed subscribe', userEventData, '----', this.notificationID);
        let feedId: number = userEventData.additionalData['notificationId'];
        if (this.notificationID !== feedId) {
            this.notificationID = feedId;
            if (this.userService.getCurrentPage().currentPage != CONSTANTS.PAGES.ACTIVITY_FEED) {
                // console.log('In Event reLoadActivityFeed subscribe', userEventData);
                this.pubNubService.feedBadgeCount = "1";
                this.activityPageState.pageNumber = 0;
                this.activityFeeds = [];
                // console.log('In IF reLoadNewActivityFeed on different page');
                this.loadActivityFeed(null, this.loadActivityFeedCallback);
            } else {
                // TODO 
                // TBD, What should happen if user scrolled more than one page            
                //// console.log('In reLoadNewActivityFeed on same page');
                // console.log('In else reLoadNewActivityFeed on different page');
                this.getLatestFeed();
            }
        }
    }

    loadActivityFeed(showLoader: boolean = true, loadActivityCB?): void {
        // console.log('In ActivityPage:loadActivityFeed');
        let that = this, activityParams: IGetActivityFeedsParams;
        that.isActivityAPICall = false;

        if (this.userService.getCurrentPage().currentPage === CONSTANTS.PAGES.ACTIVITY_FEED && showLoader || this.isFavorites) {
            this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));

        }
        if (that.activityPageState.pageNumber === 0 ||
            (that.activityPageState.pageNumber * that.activityPageState.pageSize) < that.activityPageState.total) {
            that.activityPageState.pageNumber += 1;

            activityParams = {
                user_id: that.userInfo.user_id,
                per_page: CONSTANTS.DEFAULT_PAGE_SIZE.FEED,
                page_number: that.activityPageState.pageNumber
            };
            if (this.isFavorites) {
                activityParams["is_favorite"] = true;
            }
            that.activityService.getActivityFeeds(activityParams).subscribe((responseObj: IGetActivityFeedsResponse) => {
                //// console.log('data getActivityFeeds', responseObj);
                that.zone.run(() => {
                    that.activityFeeds = that.activityFeeds.concat(responseObj.activityfeed);
                    that.activityPageState.total = responseObj.total;
                });
                that.loaderService.dismissLoader();
                if (loadActivityCB) {
                    loadActivityCB.call(that);
                }
            }, error => {
                that.loaderService.showToaster(error);
                that.loaderService.dismissLoader();
                if (loadActivityCB) {
                    loadActivityCB.call(that);
                }
            });
        } else {

            that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.NO_MORE_DATA_TO_LOAD'));
            that.loaderService.dismissLoader();
            if (loadActivityCB) {
                loadActivityCB.call(that, true);
            }
        }
    }

    getLatestFeed(): void {
        let that = this, activityParams: IGetActivityFeedsParams;
        activityParams = { user_id: that.userInfo.user_id, per_page: 1, page_number: 1 };
        that.isActivityAPICall = false;
        this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
        that.activityService.getActivityFeeds(activityParams).subscribe((response: IGetActivityFeedsResponse) => {
            if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
                let duplicateFeeds = that.activityFeeds.filter((feed) => {
                    return feed._id == response.activityfeed[0]._id;
                });
                if (duplicateFeeds && duplicateFeeds.length === 0) {
                    // console.log('There is no dupliate feed');
                    that.activityFeeds.splice(0, 0, response.activityfeed[0]);
                    that.activityPageState.total = response.total;
                } else {
                    // console.log('There is duplicate feed');
                }
            }
            that.isActivityAPICall = true;
            this.loaderService.dismissLoader();
        });
    }

    trackActivityFeed(index: number, activity: IActivityFeed) {
        //// console.log('In trackActivityFeed',activity._id);
        return activity ? activity._id : undefined;
    }

    isTemplateNo1345(activity: IActivityFeed): boolean {
        return (activity.template === this.activityTemplates[1] || activity.template === this.activityTemplates[3] || activity.template === this.activityTemplates[4] || activity.template === this.activityTemplates[5]);
    }

    loadActivityFeedCallback(): void {
        let that = this;
        setTimeout(() => {
            that.isActivityAPICall = true;
        }, 500);
    }

    doRefresh(refresher): void {
        this.isActivityAPICall = false;
        this.activityPageState.pageNumber = 0;
        this.activityInfiniteScrollEnabled = true;
        this.activityFeeds = [];
        this.loadActivityFeed(false, () => {
            refresher.complete();
            this.loadActivityFeedCallback();
        });
    }

    setAnswerOption(pollObj: IActivityFeed, option: IActivityFeedOption, isCheckBox: boolean): void {
        if (!pollObj.body.temp_answer) {
            pollObj.body.temp_answer = [];
        }
        if (isCheckBox) {
            option.selected = !option.selected;
        } else {
            pollObj.body.temp_answer = [];
            pollObj.body.options.forEach((obj) => {
                if (obj.name === option.name) {
                    option.selected = !option.selected;
                } else {
                    obj.selected = false;
                }
            });
        }

        if (option.selected) {
            if (pollObj.template === this.activityTemplates[8] || pollObj.template === this.activityTemplates[6]) {
                pollObj.body.temp_answer.push(option.id);
            } else {
                pollObj.body.temp_answer.push(option.name);
            }
        } else {
            if (pollObj.template === this.activityTemplates[8] || pollObj.template === this.activityTemplates[6]) {
                pollObj.body.temp_answer.splice(pollObj.body.temp_answer.indexOf(option.id), 1);
            } else {
                pollObj.body.temp_answer.splice(pollObj.body.temp_answer.indexOf(option.name), 1);
            }
        }
    }

    submitPoll(pollObj: IActivityFeed, cardIndex: number): void {
        let that = this, voteTotal: number = 0, submitPollParams: ISubmitPollParams;

        pollObj.body.options.forEach((option) => {
            if (option.selected) {
                option.vote += 1;
            }
            if (option.vote) {
                voteTotal += option.vote;
            }
        });

        pollObj.body.options.map((option) => {
            let voteInPer = 0;
            if (option.vote) {
                voteInPer = Math.round((option.vote / voteTotal) * 100);
            }
            option['voteInPer'] = voteInPer + '%';
            return option;
        });

        pollObj.body.answer = pollObj.body.temp_answer;
        submitPollParams = {
            _id: pollObj._id,
            user_id: that.userInfo.user_id,
            answer_option: pollObj.body.answer,
            template: pollObj.template,
            profile_attributes: pollObj.profile_attributes,
            action_type: (pollObj.profile_attributes) ? CONSTANTS.FEED_ACTIONS.PROFILE : CONSTANTS.FEED_ACTIONS.POLL,
            feed_title: pollObj.body.question
        };

        that.activityService.submitPoll(submitPollParams).subscribe(function (data) {
            pollObj.body.temp_answer = [];
            if (that.isFavorites) {
                that.favoriteFeedChanges[pollObj._id] = pollObj;
            }
            if (pollObj.template === that.activityTemplates[8]) {
                that.activityFeeds.splice(cardIndex, 1);
                that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.PROFILE_SAVE_DONE'));
            } else {
                that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.POLL_SAVE_DONE'));
            }
            if (pollObj.profile_attributes) {
                that.userService.isProfileUpdate = true;
            }
        }, error => {
            that.loaderService.showToaster(error);
        });

        that.analyticsService.trackEvent(CONSTANTS.ANALYTICS_EVENT.SUBMIT_POLL_ANSWER, CONSTANTS.ANALYTICS_EVENT.EVENT_ACTION, pollObj._id);
    }

    openInAppBrowser(activity: IActivityFeed): void {
        //this.shareVia(activity);
        // console.log('In openInAppBrowser opening url in InAppBrowser', activity.openInUrl);
        let updateActionTakenCountParams: IUpdateActionTakenCountParams;

        updateActionTakenCountParams = {
            rezfeed_id: activity.rezfeed_id,
            user_id: this.userInfo.user_id,
            action_type: CONSTANTS.FEED_ACTIONS.MORE_INFO,
            feed_title: activity.header.title
        };
        if (this.userInfo.user_type === CONSTANTS.USER_TYPE.RESIDENT) {
            this.activityService.updateActionTakenCount(updateActionTakenCountParams).subscribe((res) => {
                // console.log('In updateActionTakenCount success', res);
            }, (error) => {
                // console.log('In updateActionTakenCount error', error);
            });

        }
        if (activity.openInUrl !== '' && this.isCordovaPlatform) {
            this.analyticsService.trackEvent(CONSTANTS.ANALYTICS_EVENT.EVENT_CATEGORY_LINK, CONSTANTS.ANALYTICS_EVENT.EVENT_ACTION, activity.openInUrl);
            this.platform.ready().then(() => {
                cordova.InAppBrowser.open(activity.openInUrl, "_blank", "location=no");
            });
        } else {
            // console.log('Open me in mobile app', activity.openInUrl);
        }
    }

    startConversation(activity: IActivityFeed): void {
        let receiverObj: IConversation, sender_ref_id: string;
        let that = this;
        if (activity.sender_ref_id) {
            sender_ref_id = activity.sender_ref_id;
            this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
            let requestObj = { user_id: this.userInfo.user_id, receiver_id: sender_ref_id };
            this.chatService.checkForSharedChannel(requestObj).subscribe((response: any) => {
                if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
                    let userObj = response.user;
                    if (response.is_blocked === true) {
                        this.loaderService.showToaster(userObj.user_name + " " + this.translateService.instant('ERROR_MESSAGES.BLOCKED_USER_POSTFIX'));
                        //console.log(userObj.user_name + " " + this.translateService.instant('ERROR_MESSAGES.BLOCKED_USER_POSTFIX'));
                        this.loaderService.dismissLoader();
                    } else {
                        // Prepare receiverObj for start chat 
                        receiverObj = {
                            connection_status: CONSTANTS.CONNECTION_STATUS.CONNECTED,
                            receiver_id: sender_ref_id,
                            user_id: sender_ref_id,
                            user_name: userObj.user_name,
                            first_name: userObj.first_name,
                            last_name: userObj.last_name,
                            presence: '',
                            timetoken: null,
                            joining_time_token: null,
                            user_type: userObj.user_type
                        };
                        if (!response.shared_channel) {
                            this.pubNubService.getTimeToken((pubnubtimestoken) => {
                                let obj = {
                                    user_id: this.userInfo.user_id,
                                    created_by: this.userInfo.user_id,
                                    receiver_id: activity.sender_ref_id,
                                    joining_time_token: pubnubtimestoken,
                                    connection_status: CONSTANTS.CONNECTION_STATUS.CONNECTED
                                };

                                this.chatService.createOrEditConversation(obj).subscribe((result) => {
                                    //console.log('Inside changeConnectionStatus callback', result);
                                    if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS
                                        && result.chat[0] && result.chat[0].shared_channel) {
                                        receiverObj['timetoken'] = receiverObj['joining_time_token'] = obj.joining_time_token;
                                        receiverObj.shared_channel = result.chat[0].shared_channel;
                                        openChatbox(receiverObj);
                                    }
                                });
                            });
                        } else {
                            receiverObj.shared_channel = response.shared_channel;
                            receiverObj['joining_time_token'] = response.joining_time_token;
                            receiverObj['type'] = response.type
                            receiverObj['group_type'] = response.group_type

                            openChatbox(receiverObj);
                        }
                    }
                } else {
                    this.loaderService.showToaster(response.message);
                    this.loaderService.dismissLoader();
                }
                this.analyticsService.trackEvent(CONSTANTS.ANALYTICS_EVENT.EVENT_CATEGORY_START_CONVERSATION, CONSTANTS.ANALYTICS_EVENT.EVENT_ACTION, activity.rezfeed_id);
            });
        }
        if (this.userInfo.user_type === CONSTANTS.USER_TYPE.RESIDENT) {
            this.activityService.updateActionTakenCount({ rezfeed_id: activity.rezfeed_id, user_id: this.userInfo.user_id, action_type: CONSTANTS.FEED_ACTIONS.CHAT, feed_title: activity.header.title }).subscribe((res) => {
                // console.log('In updateActionTakenCount success', res);
            }, (error) => {
                // console.log('In updateActionTakenCount error', error);
            });
        }

        function openChatbox(conversationObj: IConversation) {
            that.pubNubService.getUsersState([conversationObj.receiver_id]).then((data: any) => {
                if (data.channels) {
                    if (data.channels[conversationObj.receiver_id]) {
                        conversationObj.presence = "online";
                    } else {
                        conversationObj.presence = "";
                    }
                }
                that.navCtrl.push(ChatBox, { user: conversationObj });
                that.loaderService.dismissLoader();
            });
        }
    }

    loadMore(infiniteScroll): void {
        // console.log('Begin async operation');
        this.loadActivityFeed(null, (isMoreDataNotFound) => {
            // console.log('isMoreDataFound', isMoreDataNotFound);
            infiniteScroll.complete();
            if (!!isMoreDataNotFound) {
                this.activityInfiniteScrollEnabled = false;
            }
        });
    }

    navigateToAroundMe(activity: IActivityFeed): void {
        this.navCtrl.parent.select(2);
    }

    callToPM(activity: IActivityFeed): void {
        if (activity.sender_contact && activity.sender_contact !== '') {
            this.callNumber.callNumber(activity.sender_contact, true).then(() => {
            }).catch((error) => {
                //console.log('Error launching dialer', error);
            })
        }
    }

    shareVia(activity: IActivityFeed) {
        let options: any = {
            message: activity.body.detailText,
            subject: activity.body.headLineText,
            file: activity.body.imageUrl
            //url: activity.openInUrl
        }
        this.socialSharing.shareWithOptions(options);
        //this.socialSharing.shareViaFacebookWithPasteMessageHint(activity.body.detailText,activity.body.imageUrl,"","Say something about this post......");
    }

    shareOnFacebook(activity: IActivityFeed, fab: FabContainer) {
        // this.socialSharing.shareViaFacebookWithPasteMessageHint(activity.body.detailText, "", activity.openInUrl, "Say something about this post......");
        fab.close();
        //Temp fix for existing data 
        if (!activity.openInUrl.includes("http")) {
            activity.openInUrl = activity.openInUrl.concat("http://");
        }
        this.userService.shareOnFacebook(activity.openInUrl, activity.header.title, activity.header.bgImageUrl, (success) => {
            if (success) {
                if (this.userInfo.user_type === CONSTANTS.USER_TYPE.RESIDENT) {
                    this.activityService.updateActionTakenCount({ rezfeed_id: activity.rezfeed_id, user_id: this.userInfo.user_id, action_type: CONSTANTS.FEED_ACTIONS.FB_SHARE, feed_title: activity.header.title }).subscribe((res) => {
                    }, (error) => {
                    });
                }
            }
        });
    }

    shareOnTwitter(activity: IActivityFeed, fab: FabContainer) {
        fab.close();
        let title: string;
        let that = this;
        if (this.platform.is('android')) {
            title = "#Rezility " + activity.header.title;
        } else {
            title = activity.header.title;
        }
        this.socialSharing.shareViaTwitter(title, activity.header.bgImageUrl, activity.openInUrl).then(() => {
            //Save the twitter share action
            if (this.userInfo.user_type === CONSTANTS.USER_TYPE.RESIDENT) {
                this.activityService.updateActionTakenCount({ rezfeed_id: activity.rezfeed_id, user_id: this.userInfo.user_id, action_type: CONSTANTS.FEED_ACTIONS.TWITTER_SHARE, feed_title: activity.header.title }).subscribe((res) => {
                }, (error) => {
                });
            }
        }).catch(() => {
            that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.TWITTER_ERROR'));
        });

    }

    toggleLike(activity: IActivityFeed, position: number) {

        let request: ILikeFeedParams = {
            user_id: this.userService.userObj.user_id,
            rezfeed_id: activity.rezfeed_id,
            is_like: !activity.is_like,
            action_type: '', // Temp set blank
            feed_title: ''
        }
        if (activity.template === CONSTANTS.TEMPLATE.POLL || activity.template === CONSTANTS.TEMPLATE.PROFILE) {
            request.feed_title = activity.body.question;
        } else {
            request.feed_title = activity.header.title;
        }

        if (request.is_like) {
            activity.total_likes = activity.total_likes + 1;
        } else {
            activity.total_likes = activity.total_likes - 1;
        }

        if (this.isFavorites) {
            this.favoriteFeedChanges[activity._id] = activity;
            this.activityFeeds.splice(position, 1);
        }
        activity.is_like = !activity.is_like;
        //this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
        this.activityService.updateFeedLike(request).subscribe((response: ILikeFeedResponse) => {
            if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
                activity.total_likes = response.total_likes;
            } else if (response.status === CONSTANTS.RESPONSE_STATUS.ERROR) {
                activity.is_like = !activity.is_like;
            }
            //this.loaderService.dismissLoader();
        });
    }

    ionViewWillUnload() {
        this.stopSpeech();
        if (Object.keys(this.favoriteFeedChanges).length > 0) {
            this.events.publish('updateFavoriteFeedEvent', this.favoriteFeedChanges);
        }
    }

    navigateToProviderDetails(activity: IActivityFeed) {
        //this.navCtrl.push(ProviderDetails, { providerId: "59705ed675372e327c92984f", buildingId: "59831d0b48ee58001106b3bb" });
        this.navCtrl.push(ProviderDetails, { providerId: activity.branch_id, buildingId: activity.building_id || '', showConnect: false });

        //Save the provider action
        if (activity.rezfeed_id && this.userInfo.user_type === CONSTANTS.USER_TYPE.RESIDENT) {
            this.activityService.updateActionTakenCount({ rezfeed_id: activity.rezfeed_id, user_id: this.userInfo.user_id, action_type: CONSTANTS.FEED_ACTIONS.PROVIDER, feed_title: activity.header.title }).subscribe((res) => {
            }, (error) => {
            });
        }
    }

    readFeed(activity: IActivityFeed, position: number) {

        if (this.feedPosition !== undefined) {
            this.activityFeeds[this.feedPosition].isReading = false;
        }
        this.feedPosition = position;
        this.tts.stop();
        if (activity.isReading == undefined || (activity.isReading !== undefined && activity.isReading == false)) {
            activity.isReading = true;
            if (this.userService.currentLang.indexOf("-") == -1) {
                this.userService.currentLang = this.userService.currentLang.concat("-us");
            }
            let speechText = '';
            if (activity.template === this.activityTemplates[6] || activity.template === this.activityTemplates[8]) {
                speechText = activity.body.question;
                for (let i = 0; i < activity.body.options.length; i++) {
                    speechText = speechText.concat("    ");
                    speechText = speechText.concat(activity.body.options[i].name);
                };
            } else {
                speechText = activity.header.title + " " + activity.body.detailText;
            }
            let options: TTSOptions = {
                text: speechText,
                locale: this.userService.currentLang,
                rate: 0.75
            }
            // console.log(options);
            this.tts.speak(options)
                .then(() => {
                    activity.isReading = false;
                })
                .catch((reason: any) => console.log(reason));
        } else {
            activity.isReading = false;
        }
    }

    muteFeed(activity: IActivityFeed) {
        activity.isReading = false;
        this.tts.stop();
        this.feedPosition = undefined;
    }

    downloadImage(activity: IActivityFeed) {
        console.log(this.userInfo.low_data);
        activity.lowData = false;
    }

    shareUser(activity: IActivityFeed, fab: FabContainer) {
        fab.close();
        this.navCtrl.push(ContactListPage, { rezfeed_id: activity.rezfeed_id, feed_title: activity.header.title });
    }

    navigateToCreateFeedPage(){
        this.navCtrl.push(CreateFeedPage);
    }
}
