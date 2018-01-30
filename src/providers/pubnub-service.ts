import { Injectable, EventEmitter } from '@angular/core';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from "rxjs/observable/forkJoin";
import { Http } from '@angular/http';
import { CONSTANTS } from '../shared/config';
import { ENVIRONMENT } from '../shared/environment';

declare let PubNub;
export enum PubNubEventType {
    MESSAGE,
    PRESENCE,
    CONNECT,
    DISCONNECT,
    RECONNECT,
    PUBLISHED,
    HISTORY,
    GROUPADDCHANNEL,
    CHANNELLIST
}

export class PubNubEvent {
    constructor(public type: PubNubEventType, channel: any, public value: any) { }
}

@Injectable()
export class PubNubService {
    pubnub: any;
    events: any;
    userConversationsMap: any = {};
    conversationCountMap: Map<string, { timestamp: string, count: number }> = new Map();
    globalBadgeCount: string = '';
    feedBadgeCount: string = '';
    isCurrentUserTyping: boolean = false;
    isConversationVist: boolean = false;
    userId: string;
    userLang: string;
    lastMessageTimeToken: number;
    pushNotificationChannels: Array<string>;
    pushNotificationGroups: Array<string>;
    historyEventEmitter: EventEmitter<PubNubEvent>;
    historyresponse: any;

    constructor(events: Events, private http: Http) {
        this.events = events;
    }

    initializePubnub(uuid: string) {
        let that = this;
        that.clearInstanceVar();
        that.userId = uuid;
        that.pubnub = new PubNub({
            uuid: uuid,
            subscribeKey: ENVIRONMENT.PUBNUB_KEYS.SUBSCRIBE_KEY,
            publishKey: ENVIRONMENT.PUBNUB_KEYS.PUBLISH_KEY,
            ssl: true,            
            presenceTimeout: 120
        });

        that.pubnub.addListener({
            status: function (statusEvent) {
                // // console.log('In addListener status', statusEvent);
                if (statusEvent.category === "PNConnectedCategory") {
                    // that.pubnub.setState({ state: { new: 'state' } },
                    //     function (status) {
                    //         //  // console.log('In addListener status 22========', status);
                    //     });
                }
                // Following is working code but commented for DAY 1
                // else if (statusEvent.error && statusEvent.category === "PNNetworkIssuesCategory") {
                //     // console.log('In PubNubService:PNNetworkIssuesCategory -', statusEvent);
                //     that.pushNotificationChannels = statusEvent.affectedChannels;
                //     that.pushNotificationGroups = statusEvent.affectedChannelGroups;
                // } else if (statusEvent.category === "PNNetworkUpCategory") {
                //     // console.log('In PubNubService:PNNetworkUpCategory -', that.lastMessageTimeToken, that.pushNotificationChannels, that.pushNotificationGroups)
                //     that.pubnub.subscribe({ channels: that.pushNotificationChannels, channelGroups: that.pushNotificationGroups, timetoken: that.lastMessageTimeToken, withPresence: true });
                // }
            },
            message: function (message) {
                //console.log("New message received - ", message);
                that.lastMessageTimeToken = message.timetoken;
                if (!(message.message.content_type_id && message.message.content_type_id === CONSTANTS.MESSAGE_CONTENT_TYPE_ID.SERVICE_REQUEST)) {
                    //TODO - The message object also give time in millisecs , this can be used for timestamp directly 
                    that.events.publish(CONSTANTS.APP_EVENTS.NEW_MESSAGE, message.message, message.timetoken, "From New Message");
                    that.events.publish(CONSTANTS.APP_EVENTS.UPDATE_CONVERSATION, message.message, message.timetoken);
                    // that.events.publish(APP_CONFIG.APP_EVENTS.UPDATE_BADGE, message.message);
                    //   eventEmitter.emit(new PubNubEvent(PubNubEventType.MESSAGE, channels, message));
                    if (!that.isConversationVist) {
                        let shared_channel = message.message.shared_channel || message.shared_channel
                        let msgCount = that.getConversationBadgeCount(shared_channel) + 1;
                        that.setConversationLastState(shared_channel, msgCount);
                    }
                } else {
                    // This is for service request message
                    that.events.publish(CONSTANTS.APP_EVENTS.SERVICE_REQUEST_MESSAGE, message.message, message.timetoken);
                }
            },
            presence: function (presenceEvent) {
                //console.log("presenceEvent - ", presenceEvent);
                if (presenceEvent.action === 'state-change' && presenceEvent.channel === that.userId) {
                    if (presenceEvent.state.action == CONSTANTS.USER_STATES.GROUP_ADD || presenceEvent.state.action == CONSTANTS.USER_STATES.GROUP_REMOVE
                        || presenceEvent.state.action == CONSTANTS.USER_STATES.VERIFICATION_REQUEST || presenceEvent.state.action == CONSTANTS.USER_STATES.VERIFICATION_CANCEL) {
                        that.events.publish(CONSTANTS.APP_EVENTS.GROUP_EVENTS, presenceEvent);
                    } else if (presenceEvent.state.action == CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED) {
                        that.events.publish(CONSTANTS.APP_EVENTS.CONNECTION_STATUS_CHANGED, presenceEvent);
                        that.events.publish(CONSTANTS.APP_EVENTS.CHAT_BOX_CONNECTION_STATUS_CHANGED, presenceEvent);
                        that.events.publish(CONSTANTS.APP_EVENTS.PROVIDER_PRESENCE_EVENT, presenceEvent);
                    }
                }
                that.events.publish(CONSTANTS.APP_EVENTS.NEW_MSG_PRESENCE_EVENT, presenceEvent);
                that.events.publish(CONSTANTS.APP_EVENTS.CHAT_BOX_PRESENCE_EVENT, presenceEvent);
                that.events.publish(CONSTANTS.APP_EVENTS.CONV_PRESENCE_EVENT, presenceEvent);
                that.events.publish(CONSTANTS.APP_EVENTS.GROUP_SETTING_PRESENCE_EVENT, presenceEvent);
            }
        });
        let conversationCountMap = that.getConversationCountMap();
        if (conversationCountMap) {
            // console.log("b4 reloadGlobalBadgeCount");
            that.conversationCountMap = conversationCountMap;
            that.reloadGlobalBadgeCount();
        }

        // set lastMessageTimeToken
        // that.getTimeToken((timetoken) => {
        //     that.lastMessageTimeToken = timetoken;
        // });
    }

    clearInstanceVar() {
        this.pushNotificationChannels = [];
        this.pushNotificationGroups = [];
        this.conversationCountMap = new Map<string, { timestamp: string, count: number }>();
        this.userConversationsMap = {};
        this.globalBadgeCount = '';
        this.feedBadgeCount = '';
        this.isCurrentUserTyping = false;
        this.isConversationVist = false;
        this.historyEventEmitter = new EventEmitter<PubNubEvent>();
        this.historyresponse = null;
    }

    setPushNotificationChannels(channels: Array<string>) {
        this.pushNotificationChannels = this.pushNotificationChannels.concat(channels);
    }

    removePushNotifcationChannel(channel: string) {
        let index = this.pushNotificationChannels.indexOf(channel);
        this.pushNotificationChannels.splice(index, 1);
    }

    getPushNotificationChannels(): Array<string> {
        return this.pushNotificationChannels;
    }

    subscribe(channels: Array<string>, withPresence: boolean = true) {
        let that = this;
        // // console.log("subscribe", channels)
        that.pubnub.subscribe({
            channels: channels,
            withPresence: withPresence
        });
    }

    subscribeGroup(channels: Array<string>, withPresence: boolean = false) {
        let that = this;
        // // console.log("subscribe", channels)
        that.pubnub.subscribe({
            channelGroups: channels,
            withPresence: withPresence
        });
    }

    unsubscribe() {
        if (this.pubnub) {
            this.pubnub.unsubscribeAll();
        }
    }

    unsubscribeChannels(channels: Array<string>) {
        // console.log("unsubscribeChannels", channels)
        if (this.pubnub) {
            this.pubnub.unsubscribe({
                channels: channels
            },
                function (status) {
                    if (status.error) {
                        // console.log("unsubscribeChannels failed w/ error:", status);
                    } else {
                        // console.log("unsubscribeChannels operation done!", channels);
                    }
                });
        }
    }

    unRegisterAllChannels(device: string, pushGateway: string) {
        this.pubnub.push.deleteDevice(
            {
                device: device,
                pushGateway: pushGateway // apns, gcm, mpns
            },
            function (status) {
                if (status.error) {
                    // console.log("operation failed w/ error:", status);
                } else {
                    // console.log("unRegisterAllChannels operation done!")
                }
            }
        );
    }

    publish(channel: string, message: any, storeInHistory: boolean = true): EventEmitter<PubNubEvent> {
        let eventEmitter: EventEmitter<PubNubEvent> = new EventEmitter<PubNubEvent>();
        this.pubnub.publish({
            channel: channel,
            // The message may be any valid JSON type including objects, arrays, strings, and numbers.       
            message: message,
            // If true the messages are stored in history, default true.
            storeInHistory: storeInHistory
        }, (status, response) => {
            if (!status.error) {
                eventEmitter.emit(new PubNubEvent(PubNubEventType.PUBLISHED, channel, response));
            } else {
                eventEmitter.error(response);
            }
        });
        return eventEmitter;
    }

    chathistory(channel: string, reverse: boolean = false, count: number, start: number = null, end: number = null, stringifiedTimeToken: boolean = true): EventEmitter<PubNubEvent> {
        this.pubnub.history({
            channel: channel,
            count: count,
            start: start,
            end: end,
            reverse: reverse,
            stringifiedTimeToken: stringifiedTimeToken
        }, (status, response) => {
            if (!status.error) {
                //console.log("History", response);

                if (response.messages.length < 100) {
                    // push this conversation in to an array and emit that array
                    if (!this.historyresponse) {
                        this.historyresponse = response;
                    } else {
                        this.historyresponse.messages = this.historyresponse.messages.concat(response.messages);
                        this.historyresponse.endTimeToken = response.endTimeToken;
                        this.historyresponse.startTimeToken = response.startTimeToken;
                    }
                    this.historyEventEmitter.emit(new PubNubEvent(PubNubEventType.HISTORY, channel, this.historyresponse));
                } else {
                    // push conversations in an array
                    //console.log("More records there");
                    if (!this.historyresponse) {
                        this.historyresponse = response;
                    } else {
                        this.historyresponse.messages = this.historyresponse.messages.concat(response.messages);
                        this.historyresponse.endTimeToken = response.endTimeToken;
                        this.historyresponse.startTimeToken = response.startTimeToken;
                    }
                    this.chathistory(channel, reverse, count, response.endTimeToken);
                }
            } else {
                this.historyEventEmitter.error(response);

            }
        });
        return this.historyEventEmitter;
    }

    loadChathistory(channel: string, reverse: boolean = false, count: number, start: number = null, end: number = null, stringifiedTimeToken: boolean = true, callback) {
        this.pubnub.history({
            channel: channel,
            count: count,
            start: start,
            end: end,
            reverse: reverse,
            stringifiedTimeToken: stringifiedTimeToken
        }, (status, response) => {
            console.log("History", start, '-', end, '-', response.startTimeToken, '-', response.endTimeToken, '-', response.messages);
            if (callback) {
                callback(status.error, response);
            }
        });
    }

    history(channel: string, reverse: boolean = false, count: number, start: number = null, end: number = null, stringifiedTimeToken: boolean = true): EventEmitter<PubNubEvent> {
        let eventEmitter: EventEmitter<PubNubEvent> = new EventEmitter<PubNubEvent>();
        this.pubnub.history({
            channel: channel,
            count: count,
            start: start,
            end: end,
            reverse: reverse,
            stringifiedTimeToken: stringifiedTimeToken
        }, (status, response) => {
            if (!status.error) {
                // console.log("History", response);
                eventEmitter.emit(new PubNubEvent(PubNubEventType.HISTORY, channel, response));
            } else {
                eventEmitter.error(response);
            }
        });
        return eventEmitter;
    }

    registerDevice(channels: Array<string>, device: string, pushGateway: string) {
        // // console.log("ChannelList", channels, "===", device, pushGateway);
        this.pubnub.push.addChannels({
            device: device, // Reg ID you got on your device
            channels: channels,
            pushGateway: pushGateway
        }, (status, response) => {
            if (!status.error) {
                // console.log("In registerDevice Done", response);
            } else {
                // console.log("registerDevice Error", response);
            }
        });
    }

    unRegisterDevice(channels: Array<string>, device: string, pushGateway: string) {
        this.pubnub.push.removeChannels({
            channels: channels,
            device: device,
            pushGateway: pushGateway
        }, function (status) {
            if (status.error) {
                // console.log("In unRegisterDevice operation failed w/ error:", status);
            } else {
                // console.log("In unRegisterDevice operation done!");
            }
        });
    }

    addChanneltoGroup(channelsList: string[], channelGroupName: string, displayName: string, user_id: string, deviceToken?: string, pushPlatform?: string, action: string = CONSTANTS.USER_STATES.GROUP_ADD) {
        let that = this;
        // console.log("addChanneltoGroup", channelsList, "-", channelGroupName);
        that.pubnub.channelGroups.addChannels(
            {
                channels: channelsList,
                channelGroup: channelGroupName
            },
            function (status) {
                if (status.error) {
                    // console.log("addChanneltoGroup operation failed w/ status: ", status);
                } else {
                    // console.log("addChanneltoGroup operation done!", status);
                    that.setUserStateGroup(channelsList, action, channelGroupName, displayName);
                    //that.subscribe([channelGroupName], true);
                    that.addChanneltoMyGroup([channelGroupName], user_id + '_group')
                    if (deviceToken !== undefined && pushPlatform !== undefined) {
                        that.registerDevice([channelGroupName], deviceToken, pushPlatform);
                    }
                }
            });
    }

    listChannels(channelGroup: string) {
        // console.log('In listChannels', channelGroup);
        this.pubnub.channelGroups.listChannels({ channelGroup: channelGroup },
            function (status, response) {
                if (status.error) {
                    // console.log("In listChannels operation failed w/ error:", status);
                    return;
                }
                console.log("In listChannels listing push channel for device", response.channels)
                // response.channels.forEach(function (channel) {
                //     // console.log(channel)
                // })
            }
        );
    }
    removeChannelFromGroup(channelsList: string[], channelGroupName: string, displayName: string, timestamp: number) {
        let that = this;
        // console.log("removeChannelFromGroup", channelsList, "-", channelGroupName);
        this.pubnub.channelGroups.removeChannels(
            {
                channels: channelsList,
                channelGroup: channelGroupName
            },
            function (status) {
                if (status.error) {
                    // console.log("removeChannelFromGroup operation failed w/ error:", status);
                } else {
                    // console.log("removeChannelFromGroup operation done!", status)
                    that.setUserStateGroup(channelsList, CONSTANTS.USER_STATES.GROUP_REMOVE, channelGroupName, displayName, timestamp);
                }
            }
        );
    }

    deleteGroup(channelGroupName: string) {
        this.pubnub.channelGroups.deleteGroup(
            {
                channelGroup: channelGroupName
            },
            function (status) {
                if (status.error) {
                    // console.log("deleteGroup operation failed w/ error:", status);
                } else {
                    // console.log("deleteGroup operation done!")
                }
            }
        );
    }

    getUsersState(channels: Array<string>) {
        return new Promise((resolve, reject) => {
            this.pubnub.hereNow(
                {
                    includeUUIDs: true,
                    channels: channels
                },
                function (status, response) {
                    // handle status, response
                    // console.log("hereNow Status ", response);
                    resolve(response);
                });
        });
    }

    getSubscribedChannelsByUUID(uuid: string) {
        return new Promise((resolve, reject) => {
            this.pubnub.whereNow({ uuid: uuid }, function (status, response) {
                //// console.log("In getSubscribedChannels hereNow Status ", status, response);
                if (!status.error) {
                    resolve(response);
                }
            });
        });
    }

    sendPushNotification(coreMessageObj: ISendPushNotificationRequest, callback?) {
        let pushObj = this.getPushNotificationMessage(coreMessageObj);
        this.publish(coreMessageObj.receiver_uuid, pushObj).subscribe((event: PubNubEvent) => {
            console.log('In sendPushNotification', event);
            if (callback) {
                callback(event);
            }
        });
    }

    getPushNotificationMessage(pushObj: IGetPushNotificationMessageRequest) {

        let pushNotificationObj = {
            "pn_gcm": {
                "data": {
                    "title": pushObj.title,
                    "message": pushObj.message,
                    "icon": CONSTANTS.NOTIFICATION_ICON,
                    "color": CONSTANTS.NOTIFICATION_COLOR
                }
            },
            "pn_apns": {
                "aps": {
                    "alert": pushObj.title + "\r" + pushObj.message,
                    "sound": "melody",
                    "content-available": 1
                },
                "sender": pushObj.sender

            },
            "pn_debug": true,
            'lasttimetoken': new Date().getTime()
        };
        return pushNotificationObj;
    }

    getTimeToken(callback: Function) {
        let isTimeCalled = false;
        this.pubnub.time(function (status, response) {
            let timetoken = null;
            if (status.error) {
                timetoken = new Date().getTime() * 10000;
            } else {
                timetoken = response.timetoken;
            }
            if (!isTimeCalled && callback) {
                isTimeCalled = true;
                callback(timetoken);
            }
        });
    }

    getDateTime(timetoken: number) {
        return Math.round(timetoken / 10000);
    }
    setConversationLastState(shared_channel: string, count: number, timetoken?: number): void {
        let currentState = { count: count };
        if (timetoken) {
            currentState['timestamp'] = timetoken;
        } else {
            currentState['timestamp'] = this.getConversationLastReadTimetoken(shared_channel)
        }

        let oldCount = this.getConversationBadgeCount(shared_channel);
        if (shared_channel !== undefined && shared_channel !== '') {
            this.conversationCountMap[shared_channel] = currentState;
            let conversationCountMapStr = JSON.stringify(this.conversationCountMap);
            //// console.log('In setConversationLastState ', shared_channel, conversationCountMapStr);
            localStorage.setItem(CONSTANTS.LOCAL_CONVERSATION_COUNT_MAP + '-' + this.userId, conversationCountMapStr);
            // If current count and existing count is different then reload globalBadgeCount            
            if (count !== oldCount) {
                this.reloadGlobalBadgeCount();
            }
        }
    }

    getConversationBadgeCount(shared_channel: string) {
        let badgeCount = 0;
        if (this.conversationCountMap[shared_channel]) {
            badgeCount = this.conversationCountMap[shared_channel].count;
        }
        // // console.log('In getConversationBadgeCount', shared_channel, badgeCount);
        return badgeCount;
    }

    getConversationLastReadTimetoken(shared_channel: string) {
        let timestamp = null;
        if (this.conversationCountMap[shared_channel]) {
            timestamp = this.conversationCountMap[shared_channel].timestamp;
        }
        // // console.log('In getConversationLastReadTimestamp', shared_channel, badgeCount);
        return timestamp;
    }

    reloadGlobalBadgeCount() {
        let badgeCount = 0;
        if (this.conversationCountMap) {
            for (let key in this.conversationCountMap) {
                if (this.conversationCountMap[key]) {
                    if (this.conversationCountMap[key] && this.conversationCountMap[key].count) {
                        badgeCount += this.conversationCountMap[key].count;
                    }
                }
            }
        }
        if (badgeCount > 0) {
            this.globalBadgeCount = badgeCount.toString();
        } else {
            this.globalBadgeCount = '';
        }
    }

    getConversationCountMap() {
        let conversationCountMap = new Map(), conversationCountMapStr;
        conversationCountMapStr = localStorage.getItem(CONSTANTS.LOCAL_CONVERSATION_COUNT_MAP + '-' + this.userId);
        if (conversationCountMapStr && conversationCountMapStr.length > 0) {
            conversationCountMap = JSON.parse(conversationCountMapStr);
        }
        return conversationCountMap;
    }


    setUserState(channelsList: string[]) {
        this.pubnub.setState({
            channels: channelsList,
            state: { isTyping: this.isCurrentUserTyping },
            function(status, response) {
                // handle status, response
                // console.log("Status---", status, "Response", response);
            }
        });
    }

    setConnectionStatusChangeState(newState: IConnectionStatusChangeState, channels: Array<string>) {
        channels = channels || [];
        //console.log("In setConnectionStatusChangeState", channels, newState);
        newState['timetoken'] = new Date().getTime();
        this.pubnub.setState({ state: newState, channels: channels },
            function (status, response) {
                //console.log('>>', status, response);
            });
    }

    setUserStateGroup(channelsList: string[], action: string, groupName: string, displayName: string, timestamp?: number) {
        let stateParams = { action: action, groupName: groupName, displayName: displayName };
        if (timestamp) {
            stateParams['leaving_time_token'] = timestamp;
        }
        stateParams['timetoken'] = new Date().getTime();
        this.pubnub.setState({
            channels: channelsList,
            state: stateParams,
            function(status, response) {
                // handle status, response
                //  // console.log("Status---", status, "Response", response);
            }
        });
    }

    startTyping(channelName: string) {
        //// console.log("User isTyping - ", this.isCurrentUserTyping, "---", channelName);
        this.isCurrentUserTyping = true;
        this.setUserState([channelName]);
    }
    stopTyping(channelName: string) {
        //// console.log("User isTyping - ", this.isCurrentUserTyping, "---", channelName);
        this.isCurrentUserTyping = false;
        this.setUserState([channelName]);
    }

    addChanneltoMyGroup(channelsList: string[], channelGroupName: string) {
        //console.log("addChanneltoGroup", channelsList, "-", channelGroupName);
        this.pubnub.channelGroups.addChannels(
            {
                channels: channelsList,
                channelGroup: channelGroupName
            },
            function (status) {
                if (status.error) {
                    //console.log("addChanneltoGroup operation failed w/ status: ", status);
                } else {
                    //console.log("addChanneltoGroup operation done!", status);
                }
            });
    }

    removeChannelFromMyGroup(channelsList: string[], channelGroupName: string) {
        //console.log("removeChannelFromGroup", channelsList, "-", channelGroupName);
        this.pubnub.channelGroups.removeChannels(
            {
                channels: channelsList,
                channelGroup: channelGroupName
            },
            function (status) {
                if (status.error) {
                    //console.log("removeChannelFromGroup operation failed w/ error:", status);
                } else {
                    //console.log("removeChannelFromGroup operation done!", status)
                }
            }
        );
    }
    // This is kept for refernce but we are not using 
    getSupportedLanguageMsgOLd(inputMsg: string): Observable<any> {
        const simpleObservable = new Observable((observer) => {
            let languageOb = {};
            CONSTANTS.AVAILABLE_LANGUAGE.forEach((language) => {
                languageOb[language] = inputMsg;
            });
            observer.next(languageOb);
            observer.complete()
        })
        return simpleObservable;
    }

    getSupportedLanguageMsg(inputMsg: string, inputLanguages?: Array<string>, isSysMsg: boolean = true): Observable<any> {
        const simpleObservable = new Observable((observer) => {
            inputLanguages = inputLanguages || CONSTANTS.AVAILABLE_LANGUAGE;
            let requestList = [], messageContent = {};
            let languages = JSON.parse(JSON.stringify(inputLanguages));

            // There should be English language in all conversation object.
            if (languages.indexOf(CONSTANTS.DEFAULT_LANGUAGE) === -1) {
                languages.push(CONSTANTS.DEFAULT_LANGUAGE);
            }
            if (languages.indexOf(this.userLang) !== -1 && !isSysMsg) {
                languages.splice(languages.indexOf(this.userLang), 1);
                messageContent[this.userLang] = inputMsg;
            }
            languages.forEach((target) => {
                let translateUrl = CONSTANTS.GOOGLE_TRANSLATION_BASE_URL + "&target=" + target + "&q=" + inputMsg;
                requestList.push(this.http.get(translateUrl).map((res: any) => res.json()));
            });

            if (requestList && requestList.length > 0) {
                forkJoin(requestList).subscribe((responseArray: Array<ITranslatedResponse>) => {
                    responseArray.forEach((response, index) => {
                        if (response.data && response.data.translations.length > 0) {
                            messageContent[languages[index]] = response.data.translations[0].translatedText;
                        }
                    });
                    observer.next(messageContent);
                    observer.complete();
                }, (error) => {
                    console.log('Error while google translating ', error);
                    observer.error(error);
                    observer.complete();
                });
            } else {
                observer.next(messageContent);
                observer.complete();
            }
        });
        return simpleObservable;
    }

    setUserLang(language: string) {
        this.userLang = language;
    }
}



export interface ITranslatedResponse {
    data: {
        translations: Array<{
            translatedText: string;
        }>
    }
}
export interface IGetPushNotificationMessageRequest {
    title: string,
    message: string,
    sender: string
}

export interface ISendPushNotificationRequest extends IGetPushNotificationMessageRequest {
    receiver_uuid: string;
}

export interface IConnectionStatusChangeState {
    _id: string;
    name: string;
    connection_status: number;
    action: string;
    connection_action?: number;
    connection_type?: string;
}