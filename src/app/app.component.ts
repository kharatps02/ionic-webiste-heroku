import { Platform, Events, Nav, AlertController } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Push, PushObject, PushOptions } from '@ionic-native/push';
import { Keyboard } from '@ionic-native/keyboard';
import { Deeplinks } from '@ionic-native/deeplinks';
import { Network } from '@ionic-native/network';
import { Device } from '@ionic-native/device';

import { Component, ViewChild, OnInit, enableProdMode } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { HomeTabs } from '../pages/home-tabs/home-tabs';
import { LoginPage } from '../pages/login/login';
import { UserService } from '../providers/user-service';
import { GetStarted } from '../pages/get-started/get-started';
import { ConnectionList } from '../pages/conversations/connection-list';
import { AnalyticsService } from '../providers/analytics-service';
import { ChatService, IConversation, IGetUserConversationRequest } from '../pages/conversations/chat-service';
import { PubNubService, PubNubEvent, IConnectionStatusChangeState } from '../providers/pubnub-service';
import { HttpService } from '../providers/http-service';
import { LoaderService } from '../providers/loader-service';
import { CONSTANTS } from '../shared/config';
import { ENVIRONMENT } from '../shared/environment';
import { ImageCacheService } from "../providers/image-cache-service";

enableProdMode();

declare let cordova, ga, fabric;
@Component({
    templateUrl: 'app.html'
})
export class RezApp implements OnInit {
    private events: Events;
    private connectSubscription: any;
    private dissconnectSubscription: any;
    private isRootPageSet: boolean = false;
    public rootPage: Component;
    public pages: Array<{ title: string, component: any, index: number }>;

    @ViewChild(Nav) nav: Nav;

    constructor(private platform: Platform, events: Events, private userService: UserService, private httpService: HttpService,
        private analyticsService: AnalyticsService, private translateService: TranslateService, private alertCtrl: AlertController,
        private pubNubService: PubNubService, private chatService: ChatService, private loaderService: LoaderService, private imageCacheService: ImageCacheService,
        private splashScreen: SplashScreen, private statusBar: StatusBar, private push: Push, private keyboard: Keyboard, private device: Device,
        private deeplinks: Deeplinks, private network: Network) {
        this.events = events;
        this.initPages();
        this.initializeApp();
        this.listenToLoginEvents();

        if (!this.platform.is('cordova')) {
            this.initializeTranslateServiceConfig();
        }
    }

    ngOnInit() {
        this.inItAppState();
    }

    initPages(): void {
        this.pages = [
            { title: 'Find', component: HomeTabs, index: 0 },
            { title: 'Conversations', component: HomeTabs, index: 1 },
            { title: 'Connect', component: HomeTabs, index: 2 },
            { title: 'My Stuff', component: HomeTabs, index: 3 }
        ];
    }

    initializeApp(): void {
        let that = this;
        that.platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            that.initNetwork();
            that.initPlatform();
            that.statusBar.styleDefault();
            that.initCache();
            //Splashscreen.hide();
            if (that.platform.is('cordova')) {
                that.hideSplashScreen(this.splashScreen);
                that.keyboard.disableScroll(true);
                that.keyboard.hideKeyboardAccessoryBar(true);
                that.initAnalyticsServiceConfig();
                that.initPush();
                that.inItDeeplinksRoute();
                that.initializeTranslateServiceConfig();
            }


            that.verifyForceUpdate();
            if (typeof cordova !== 'undefined' && cordova.platformId == 'android') {
                that.statusBar.styleLightContent();
            }
        });
    }

    initCache() {
        this.imageCacheService.initImageCache();
    }
    initPlatform() {
        let platform = null;
        if (this.platform.is('android')) {
            platform = "android";
        } else if (this.platform.is('ios')) {
            platform = "ios";
        } else {
            platform = "web";
        }

        // Set device type into http service .
        this.userService.http.defaultRequestParams.device_type = platform;
        this.userService.http.defaultRequestParams.device_model = this.device.model;
        this.userService.http.defaultRequestParams.os_version = this.device.version;
    }

    hideSplashScreen(splashScreen) {
        if (splashScreen) {
            // console.log('Called hideSplashScreen.............');
            setTimeout(() => {
                splashScreen.hide();
            }, 200);
        }
    }

    inItAppState(): void {
        if (!this.userService.isAppStarted()) {
            this.nav.setRoot(GetStarted);
            this.isRootPageSet = true;
        } else {
            this.userService.hasLoggedIn().then((hasLoggedIn) => {
                if (hasLoggedIn) {
                    this.userService.loadUser((isUserLoaded) => {
                        this.enableMenu(hasLoggedIn == isUserLoaded);
                    })
                } else {
                    this.enableMenu(hasLoggedIn == true);
                }
                this.isRootPageSet = true;
            });
        }
    }
    inItDeeplinksRoute(): void {
        this.deeplinks.routeWithNavController(this.nav, {
            '/onboard/:userId': GetStarted,
            '/onboard/resetpassword/:resetpassword_userId': GetStarted
        }).subscribe((match) => {
            // console.log('Successfully routed', match);
        }, (nomatch) => {
            console.warn('Unmatched Route', nomatch);
        });
        // console.log('Called inItDeeplinksRoute');

    }

    initializeTranslateServiceConfig(): void {
        let that = this;
        let userLang;
        if (this.userService.userObj && this.userService.userObj.device_lang) {
            console.log('User Language');
            userLang = this.userService.userObj.device_lang;
        } else if (navigator.language.split('-')[0] === 'zh') {
            console.log('Device Chinese');
            userLang = navigator.language;
            //this.updateUserDeviceLang();
        } else {
            console.log('Other Device Languages');
            userLang = navigator.language.split('-')[0];
            //this.updateUserDeviceLang();
        }
        console.log('In initializeTranslateServiceConfig', userLang);
        userLang = CONSTANTS.AVAILABLE_LANGUAGE.indexOf(userLang) !== -1 ? userLang : CONSTANTS.DEFAULT_LANGUAGE;
        that.translateService.use(userLang);
        that.userService.setCurrentLang(userLang);
        that.translateService.setDefaultLang(CONSTANTS.DEFAULT_LANGUAGE);
        that.pubNubService.setUserLang(userLang);

    }

    initAnalyticsServiceConfig(): void {
        if (typeof ga !== 'undefined') {
            // console.log("Calling start tracker");
            this.analyticsService.startTracker(ENVIRONMENT.GOOGLE_ANALYTICS_TRACKING_ID);
            this.analyticsService.enableExceptionReporting(true);
            this.analyticsService.enableDebugMode();
        } else {
            // console.log("Google Analytics Unavailable");
        }
    }
    listenToLoginEvents(): void {
        this.events.subscribe('user:login', () => {
            this.enableMenu(true);
        });

        this.events.subscribe('user:signup', () => {
            this.enableMenu(true);
        });

        this.events.subscribe('user:logout', () => {
            this.loaderService.dismissLoader();
            this.events.unsubscribe(CONSTANTS.APP_EVENTS.GROUP_EVENTS);
            this.imageCacheService.clearCache();
            this.enableMenu(false);
        });

        // this.events.subscribe('user:dataLoaded', (user) => {
        //     // console.log('[User dataLoaded.]', user);
        // });
    }

    enableMenu(LoggedIn): void {
        let channelGroups: Array<string> = [];
        //If user is loggged in App then set TabsPage as a home page otherwise LoginPage
        if (LoggedIn) {
            this.userService.setAppStarted();
            this.nav.setRoot(HomeTabs, { tabIndex: 0 });

            // register device
            this.userService.registerDeviceOnServer();
            if (this.platform.is('cordova')) {
                // Changed property_owner_id to user_id
                //this.analyticsService.setUserId(this.userService.userObj.user_id);
                this.analyticsService.addCustomDimension(this.userService.userObj.user_id);
            }
            //this.pubNubService.addChanneltoMyGroup([this.userService.userObj.user_id],this.userService.userObj.user_id + '_group');
            this.pubNubService.subscribe([this.userService.userObj.user_id], true);
            this.pubNubService.subscribe([this.userService.userObj.user_id + '_present'], true);

            this.pubNubService.setPushNotificationChannels([this.userService.userObj.user_id]);
            if (!!this.userService.userObj.notification_enabled) {
                this.pubNubService.registerDevice([this.userService.userObj.user_id], this.userService.deviceToken, this.userService.pushPlatform);
            }

            this.chatService.getUserGroups(this.userService.userObj.user_id).subscribe((res: any) => {
                if (res && res.incident_conversations) {
                    //this.pubNubService.subscribe(res.all_user_groups, true);
                    //this.pubNubService.addChanneltoMyGroup([res.incident_conversations], this.userService.userObj.user_id + '_group');
                    channelGroups = channelGroups.concat(res.incident_conversations);
                }
                if (res && res.groups) {
                    channelGroups = channelGroups.concat(res.groups);
                }
                if (!!this.userService.userObj.notification_enabled) {
                    this.pubNubService.registerDevice(channelGroups, this.userService.deviceToken, this.userService.pushPlatform);
                }
                this.pubNubService.setPushNotificationChannels(channelGroups);
                // We do not need mute groups in push notification.
                if (res && res.mute_groups) {
                    channelGroups = channelGroups.concat(res.mute_groups);
                }
                this.pubNubService.addChanneltoMyGroup(channelGroups, this.userService.userObj.user_id + '_group');
                this.pubNubService.subscribeGroup([this.userService.userObj.user_id + '_group'], false);
                //this.pubNubService.subscribe(res.all_user_groups,true);

            }, error => {
                this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
            });

            //this.updateUserDeviceLang();
            this.initConversationCount();
            this.initGroupEvents();
            this.setUserDataForCrashlytics();
            this.initializeTranslateServiceConfig();
        } else {
            this.nav.setRoot(LoginPage).then(() => {
                this.userService.resetUserObj();
                this.initializeTranslateServiceConfig();
            });
        }
       
    }

    setUserDataForCrashlytics() {
        if (this.platform.is('cordova')) {
            fabric.Crashlytics.setUserIdentifier(this.userService.userObj.user_id);
            fabric.Crashlytics.setUserName(this.userService.userObj.user_name);
            fabric.Crashlytics.setUserEmail(this.userService.userObj.email);
        }
    }

    initConversationCount(): void {
        let that = this, startTimeToken = null, endTimeToken = null, historyLimit, params: IGetUserConversationRequest, connectionList: ConnectionList;
        let friendsList = [];
        connectionList = new ConnectionList(this.chatService, this.pubNubService, this.translateService, this.loaderService);
        params = { user_id: this.userService.userObj.user_id, is_group_data_needed: true };
        connectionList.getUserList(params, (error, response) => {
            let conversations = [];
            conversations = conversations.concat(response.connected);
            conversations.forEach((conversation: IConversation) => {
                endTimeToken = null;
                startTimeToken = null;
                endTimeToken = that.pubNubService.getConversationLastReadTimetoken(conversation.shared_channel);
                //// console.log('[Before Calling history api]', conversation.shared_channel, endTimeToken);
                // If last read timestamp is null then  get only single record otherwise get as per timestamp                     
                if (!endTimeToken && conversation.joining_time_token) {
                    endTimeToken = conversation.joining_time_token;
                    //  // console.log('Case#1');
                }

                if (conversation.joining_time_token && endTimeToken && conversation.joining_time_token > endTimeToken) {
                    endTimeToken = conversation.joining_time_token;
                    // // console.log('Case#2');
                    //// console.log('In case of edit group if user added some oneone They should not be see the last conversation message which was there before adding to them');
                }
                if (conversation.leaving_time_token && conversation.leaving_time_token > 0) {
                    startTimeToken = endTimeToken;
                    endTimeToken = conversation.leaving_time_token;
                    // // console.log('Case#3');
                }
                if (conversation.type === CONSTANTS.CONVERSATION_TYPE.SINGLE) {
                    friendsList = friendsList.concat(conversation.receiver_id + '_present')
                }
                historyLimit = (endTimeToken) ? CONSTANTS.CONVERSATION_MAX_UNREAD_COUNT : 1;
                //// console.log('[Calling history api joining_time_token, historyLimit,endTimeToken]', conversation.shared_channel, conversation.joining_time_token, conversation.leaving_time_token, startTimeToken, endTimeToken);
                that.pubNubService.history(conversation.shared_channel, false, historyLimit, startTimeToken, endTimeToken).subscribe((event: PubNubEvent) => {
                    if (event.value && event.value.messages && event.value.messages.length > 0) {
                        let lastMsgIndex = event.value.messages.length - 1;
                        if (!that.pubNubService.getConversationLastReadTimetoken(conversation.shared_channel)) {
                            that.pubNubService.setConversationLastState(conversation.shared_channel, 0, event.value.messages[lastMsgIndex].timetoken);
                        } else {
                            that.pubNubService.setConversationLastState(conversation.shared_channel, lastMsgIndex);
                        }
                    }
                }, (error) => {
                    this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
                });
            });
            that.pubNubService.addChanneltoMyGroup(friendsList, that.userService.userObj.user_id + '_friends');
            that.pubNubService.subscribeGroup([that.userService.userObj.user_id + '_friends-pnpres'], false);

        });
    }


    initGroupEvents() {
        this.events.subscribe(CONSTANTS.APP_EVENTS.GROUP_EVENTS, (groupEvent) => {
            //let groupEvent = groupEvents[0];
            // console.log("App Component Group Event", groupEvent);

            if (groupEvent.state !== undefined && groupEvent.state.action == CONSTANTS.USER_STATES.GROUP_ADD) {
                let shared_channel = groupEvent.state.groupName;
                this.pubNubService.addChanneltoMyGroup([shared_channel], this.userService.userObj.user_id + '_group');
                this.pubNubService.setPushNotificationChannels([shared_channel]);
                if (this.platform.is('cordova')) {
                    if (!!this.userService.userObj.notification_enabled) {
                        this.pubNubService.registerDevice([shared_channel], this.userService.deviceToken, this.userService.pushPlatform);
                    }
                    this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.ADDED_GROUP') + ' ' + groupEvent.state.displayName);
                }
                if (!this.pubNubService.getConversationLastReadTimetoken(shared_channel)) {
                    this.pubNubService.getTimeToken((timetoken) => {
                        this.pubNubService.setConversationLastState(shared_channel, 0, timetoken);
                    });
                } else {
                    this.pubNubService.setConversationLastState(shared_channel, 0);
                }
                // console.log('You have been added to the group' + groupEvent.state.displayName);
            } else if (groupEvent.state !== undefined && groupEvent.state.action == CONSTANTS.USER_STATES.GROUP_REMOVE) {
                this.pubNubService.removeChannelFromMyGroup([groupEvent.state.groupName], this.userService.userObj.user_id + '_group');
                if (this.platform.is('cordova')) {
                    this.pubNubService.unRegisterDevice([groupEvent.state.groupName], this.userService.deviceToken, this.userService.pushPlatform);
                    this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.NO_LONGER_PARTICIPANT') + ' ' + groupEvent.state.displayName);
                }
                // console.log('You have been removed from the group' + groupEvent.state.displayName);
            } else if (groupEvent.state !== undefined && groupEvent.state.action == CONSTANTS.USER_STATES.VERIFICATION_REQUEST && groupEvent.channel === this.userService.userObj.user_id) {
                this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.VERIFICATION_MESSAGE'));
            } else if (groupEvent.state !== undefined && groupEvent.state.action == CONSTANTS.USER_STATES.VERIFICATION_CANCEL && groupEvent.channel === this.userService.userObj.user_id) {
                this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.VERIFICATION_CANCEL_MESSAGE'));
            } else if (groupEvent.state !== undefined && groupEvent.state.action == CONSTANTS.USER_STATES.SERVICE_REQUEST_REPORTED) {
                let shared_channel = groupEvent.state.groupName;
                this.pubNubService.addChanneltoMyGroup([shared_channel], this.userService.userObj.user_id + '_group');
                this.pubNubService.setPushNotificationChannels([shared_channel]);
                if (this.platform.is('cordova')) {
                    if (!!this.userService.userObj.notification_enabled) {
                        this.pubNubService.registerDevice([shared_channel], this.userService.deviceToken, this.userService.pushPlatform);
                    }
                }
            }
        });

        this.events.subscribe(CONSTANTS.APP_EVENTS.CONNECTION_STATUS_CHANGED, (event) => {
            //console.log('In app.component CONNECTION_STATUS_CHANGED', event);
            let stateObj: IConnectionStatusChangeState = event.state;
            if (stateObj && stateObj.action == CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED) {
                if (stateObj.connection_status === CONSTANTS.CONNECTION_STATUS.INVITED) {
                    this.loaderService.showToaster(stateObj.name + ' ' + this.translateService.instant('ERROR_MESSAGES.INVITED_YOU'));
                    //console.log(stateObj.name + ' ' + this.translateService.instant('ERROR_MESSAGES.INVITED_YOU'));
                }
                //TODO FIX-ME added temp fix for profile update on disconnect issue. 
                else if (stateObj.connection_status === CONSTANTS.CONNECTION_STATUS.IGNORE || stateObj.connection_status === CONSTANTS.CONNECTION_STATUS.CONNECTED) {
                    //console.log("Profile update", stateObj);
                    this.userService.isProfileUpdate = true;

                    // Added check on connection_type since we don't want to subscribe single conversation
                    // (When Resident click on Approve and connect request) that will be subscribe under _friends
                    if (stateObj.connection_status === CONSTANTS.CONNECTION_STATUS.CONNECTED &&
                        (!stateObj.connection_type || stateObj.connection_type && stateObj.connection_type === CONSTANTS.CONVERSATION_TYPE.GROUP)) {
                        this.pubNubService.addChanneltoMyGroup([stateObj._id], this.userService.userObj.user_id + '_group');
                        this.pubNubService.registerDevice([stateObj._id], this.userService.deviceToken, this.userService.pushPlatform);
                    }
                }
            }
        });
    }
    // Register push notification
    initPush() {
        let that = this;
        const pushOptions: PushOptions = {
            android: {
                senderID: CONSTANTS.GCM_SENDER_ID,
                icon: "icon",
                clearNotifications: "true"
            },
            ios: {
                alert: "true",
                badge: "true",
                sound: "true",
                clearBadge: "true"
            },
            windows: {}
        };
        const pushObject: PushObject = that.push.init(pushOptions);

        pushObject.on('registration').subscribe((data) => {
            // console.log('registration ---', data);
            that.userService.storeDeviceToken(data.registrationId);
        });

        pushObject.on('notification').subscribe(onNotification);

        pushObject.on('error').subscribe((e) => {
            that.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.DEVICE_REGISTRATION_FAILED'));
        });

        function onNotification(data) {
            // console.log("Push Message Data", JSON.stringify(data));
            if (data.additionalData.foreground === false) {
                if (that.platform.is('ios')) {
                    pushObject.getApplicationIconBadgeNumber().then((n) => {
                        // console.log('Current badge number', n);
                        let number = n + 1;
                        pushObject.setApplicationIconBadgeNumber(number).then(() => {
                            // console.log('setApplicationIconBadgeNumber - success', number);                        
                        });
                    }, function () {
                        // console.log('error - getApplicationIconBadgeNumber');
                    });
                }
            } else {
                pushObject.setApplicationIconBadgeNumber(0).then(() => {
                    // console.log('setApplicationIconBadgeNumber - success', number);                        
                });
            }

            if (that.platform.is('ios')) {
                if (data.additionalData['coldstart'] == false && data.additionalData["source"] === "rezility") {
                    // console.log('data.additionalData coldstart', data);
                    that.events.publish('reLoadActivityFeed', data);
                } else {
                    // console.log('Chat Notification Received');
                }
            } else { // android 
                //Push notification filter on coldstart property to handle duplicate feeds
                if (data.additionalData["source"] === "rezility") {
                    that.events.publish('reLoadActivityFeed', data);
                }
                else {
                    // console.log('Chat Notification Received');
                }
            }
        }
    }

    initNetwork() {
        this.connectSubscription = this.network.onConnect().subscribe(() => {
            // console.log('network connected!');
            // We just got a connection but we need to wait briefly
            // before we determine the connection type.  Might need to wait
            // prior to doing any api requests as well.
            this.httpService.online = true;
            setTimeout(() => {
                // console.log("Current Network is ", Network.connection);
            }, 3000);
        });

        this.dissconnectSubscription = this.network.onDisconnect().subscribe(() => {
            // console.log('network disconnected !', this.isRootPageSet);
            if (this.httpService.online) {
                this.onDisconnect();
            }
            this.httpService.online = false;
        });
    }

    onDisconnect() {
        //console.log("Current Page", this.userService.getCurrentPage().currentPage);
        if (this.userService.getCurrentPage().currentPage !== CONSTANTS.PAGES.AROUND_YOU) {
            let alert = this.alertCtrl.create({
                title: this.translateService.instant('ERROR_MESSAGES.NO_NETWORK_TITLE'),
                message: this.translateService.instant('ERROR_MESSAGES.NO_NETWORK_MSG'),
                buttons: [{
                    'text': this.translateService.instant('MISC.OK'), handler: () => {
                        if (!this.isRootPageSet) {
                            this.platform.exitApp();
                        }
                    }
                }],
                cssClass: 'alert-single'
            });
            alert.present();
        } else {
            this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.NO_NETWORK_MSG'));
        }
    }

    verifyForceUpdate() {
        let deviceType = '', appVersion = ENVIRONMENT.APP_VERSION, appUpdateURL = '';
        if (this.platform.is('android')) {
            deviceType = 'android';
            appUpdateURL = CONSTANTS.APP_UPDATE_URL.ANDROID;
        } else if (this.platform.is('ios')) {
            deviceType = 'ios';
            appUpdateURL = CONSTANTS.APP_UPDATE_URL.IOS;
        }

        let updateHandler = function () {
            window.open(appUpdateURL, "_system");
            return false;
        }
        if (appVersion && deviceType) {
            this.userService.verifyForceUpdate(appVersion, deviceType).subscribe((response) => {
                if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
                    if (response.app_status_code === CONSTANTS.APP_UPDATE_STATUS_CODE.NO_UPDATE) {
                        return;
                    }
                    let alert = this.alertCtrl.create({
                        title: response.title,
                        message: response.message,
                        buttons: [{
                            text: this.translateService.instant('ERROR_MESSAGES.OK_BTN'),
                            handler: updateHandler,
                        }],
                        enableBackdropDismiss: false
                    });
                    if (response.app_status_code === CONSTANTS.APP_UPDATE_STATUS_CODE.NORMAL_UPDATE) {
                        alert.addButton({
                            text: this.translateService.instant('ERROR_MESSAGES.CANCEL_BTN'),
                            role: 'cancel'
                        })
                    } else if (response.app_status_code === CONSTANTS.APP_UPDATE_STATUS_CODE.FORCE_UPDATE) {
                        alert.setCssClass('alert-single');
                        //TODO - Need to remove this in version 1.7 
                        if (this.userService.userObj && this.userService.userObj.user_id) {
                            this.pubNubService.deleteGroup(this.userService.userObj.user_id + '_friends');
                            this.pubNubService.deleteGroup(this.userService.userObj.user_id + '_group');
                        }
                    }
                    alert.present();
                }
            });
        }
    }

    // updateUserDeviceLang() {
    //     if (this.userService.userObj && this.userService.userObj.user_id) {
    //         this.userService.updateUserDeviceLang({ user_id: this.userService.userObj.user_id }).subscribe((res) => {
    //             console.log('updateUserDeviceLang', res);
    //         });
    //     }
    // }
}
