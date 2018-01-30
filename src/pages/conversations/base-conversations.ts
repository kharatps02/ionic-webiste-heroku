import { ConnectionList } from './connection-list';
import { UserService } from '../../providers/user-service';
import { PubNubService, PubNubEvent } from '../../providers/pubnub-service';
import { ChatService, IConversation, IGetUserConversationRequest, IUpdateConversationStatusRequestParams, IGroupRemoveRequest, IMessage } from './chat-service';
import { LoaderService } from '../../providers/loader-service'
import { CONSTANTS } from '../../shared/config';
import { formatDate } from '../../shared/util/date';
import { TranslateService } from "@ngx-translate/core";

export class BaseConversations {
    public sharedChannelConversationIdMap: Map<string, IConversation>;
    public sharedChannelIdConversationIndexMap: Map<string, number>;
    public conversations: Array<IConversation>;
    public isConversationsAPICall: boolean = false;
    private connectionList: ConnectionList;
    public usertypeConstant = CONSTANTS.USER_TYPE;
    public userType: string;
    
    constructor(public userService: UserService, public pubNubService: PubNubService,
        public translateService: TranslateService,
        public chatService: ChatService, public loaderService: LoaderService) {
        this.connectionList = new ConnectionList(chatService, pubNubService, translateService, loaderService);
        //this.userData = this.userService.getUser();
        //// console.log("Conversations - constructor",this.userData );
        this.sharedChannelConversationIdMap = new Map<string, IConversation>();
        this.sharedChannelIdConversationIndexMap = new Map<string, number>();
        this.conversations = [];
        this.userType = this.userService.userObj.user_type;

    }

    refreshConversationDone(): void {
        //// console.log('In refreshConversationDone')
        this.loaderService.dismissLoader();
        setTimeout(() => {
            this.isConversationsAPICall = true;
        }, 500);
    }

    refreshConversation(refreshConversationCB?: Function, showLoader = true): void {
        let params: IGetUserConversationRequest = {
            user_id: this.userService.userObj.user_id,
            is_group_data_needed: true
        };
        this.isConversationsAPICall = false;
        this.conversations = [];
        this.sharedChannelConversationIdMap = new Map<string, IConversation>();
        this.sharedChannelIdConversationIndexMap = new Map<string, number>();
        if (showLoader) {
            this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
        }
        this.connectionList.getUserList(params, (error, response) => {
            if (response) {
                let connections = response.connected || [];
                let invitation_sent = response.invitation_sent.filter((self) => {
                    return (self.status === CONSTANTS.CONVERSATION_STATUS.OPEN) ? true : false;
                });
                connections = connections.concat(response.invitation_received);
                connections = connections.concat(invitation_sent);
                this.getLastConversationFromPubNub(connections, (sharedChannelConversationIdMap) => {
                    this.updateLastConversation(connections, sharedChannelConversationIdMap, (conversations1) => {
                        this.sortConversation(conversations1, (conversations2) => {
                            this.conversations = conversations2;
                            this.updatePresenceStatus();
                            if (refreshConversationCB) {
                                refreshConversationCB.call(this);
                            }
                        });
                    });
                });
            } else {
                if (refreshConversationCB) {
                    refreshConversationCB.call(this);
                }
            }
        });
    }

    updateSubscribeChannels() {
        let newChnnelsForSubscibe = [];
        this.pubNubService.getSubscribedChannelsByUUID(this.userService.userObj.user_id).then((response: any) => {
            //// console.log('In getSubscribedChannels response', response);
            if (response && response.channels) {
                this.conversations.forEach((conversation) => {
                    if (conversation.type === CONSTANTS.CONVERSATION_TYPE.GROUP && !conversation.leaving_time_token && response.channels.indexOf(conversation.shared_channel) === -1) {
                        newChnnelsForSubscibe.push(conversation.shared_channel);
                    }
                });
                // console.log('In updateSubscribeChannels newChnnelsForSubscibe', newChnnelsForSubscibe);
                if (newChnnelsForSubscibe && newChnnelsForSubscibe.length > 0) {
                    //this.pubNubService.subscribe(newChnnelsForSubscibe, true);
                    this.pubNubService.addChanneltoMyGroup(newChnnelsForSubscibe, this.userService.userObj.user_id + '_group');
                    this.pubNubService.setPushNotificationChannels(newChnnelsForSubscibe);
                }
            }
        });
    }

    sortConversation(conversations: Array<IConversation>, sortConversationCallback): void {
        let _conversations = JSON.parse(JSON.stringify(conversations));
        _conversations.sort(function (a: IConversation, b: IConversation) {
            if (a.timetoken == undefined) {
                return 1;
            } else if (b.timetoken == undefined) {
                return -1;
            } else {
                return b.timetoken - a.timetoken;
            }
        });

        // Update sharedChannelIdConversationIndexMap as per index value
        _conversations.forEach((self, index) => {
            this.sharedChannelIdConversationIndexMap[self.shared_channel] = index;
        });
        if (sortConversationCallback) {
            sortConversationCallback(_conversations);
        }
    }

    getLastConversationFromPubNub(conversations, callback?): void {
        let that = this, lastObject = null, conversationIndex: number = 0, endTimeToken = null, startTimeToken = null, historyLimit;
        if (conversations && conversations.length > 0) {
            conversations.forEach((conversation: IConversation) => {
                endTimeToken = null;
                startTimeToken = null;
                endTimeToken = this.pubNubService.getConversationLastReadTimetoken(conversation.shared_channel);
                //// console.log('[Before Calling history api]', conversation.shared_channel, endTimeToken);

                // TODO 
                // In case of edit group if user added some oneone
                // They shouldn't be see the last conversation message which was there before adding to them            
                if (conversation.joining_time_token && endTimeToken && conversation.joining_time_token > endTimeToken) {
                    endTimeToken = conversation.joining_time_token;
                    //// console.log('Case#1');
                    //// console.log('In case of edit group if user added some oneone They should not be see the last conversation message which was there before adding to them');
                }
                if (conversation.leaving_time_token !== undefined && conversation.leaving_time_token > 0) {
                    startTimeToken = endTimeToken;
                    endTimeToken = conversation.leaving_time_token
                    //// console.log('Case#2');
                }
                // If last read timestamp is null then  get only single record otherwise get as per timestamp             
                historyLimit = (endTimeToken) ? CONSTANTS.CONVERSATION_MAX_UNREAD_COUNT : 1;

                //// console.log('[Calling history api joining_time_token, historyLimit,endTimeToken]', historyLimit, conversation.shared_channel, conversation.joining_time_token, conversation.leaving_time_token, startTimeToken, endTimeToken);
                that.pubNubService.history(conversation.shared_channel, false, historyLimit, startTimeToken, endTimeToken).subscribe((event: PubNubEvent) => {
                    ++conversationIndex;

                    if (event.value && event.value.messages && event.value.messages.length > 0) {
                        let lastMsgIndex = event.value.messages.length - 1, shared_channel = null;

                        lastObject = event.value.messages[lastMsgIndex].entry;
                        lastObject.content = this.chatService.getMessageContent(lastObject.content);
                        lastObject['timetoken'] = event.value.messages[lastMsgIndex].timetoken;
                        shared_channel = lastObject.shared_channel || lastObject.shared_channel_id;
                        that.sharedChannelConversationIdMap[shared_channel] = lastObject;
                        // Increase lastMsgIndex by 1 only when user received message on new conversation or group
                        if (lastMsgIndex === 0 && that.pubNubService.getConversationLastReadTimetoken(shared_channel) < lastObject.timetoken
                            && this.userService.userObj.user_id != lastObject.sender_uuid) {
                            lastMsgIndex += 1;
                        }
                        // Reset badgecount as per conversation metadata
                        that.pubNubService.setConversationLastState(conversation.shared_channel, lastMsgIndex);
                    }
                    if ((conversations.length === conversationIndex) && callback) {
                        callback(that.sharedChannelConversationIdMap);
                    }
                }, (error) => {
                    // console.log(JSON.stringify(error));
                    callback(that.sharedChannelConversationIdMap);
                });
            });
        } else {
            callback([]);
        }
    }

    updateLastConversation(conversations, sharedChannelConversationIdMap?, callback?): void {
        let lastObject = null;
        conversations.map((conversation: IConversation, index: number) => {
            // set user_name on outer object from receiver_data            
            lastObject = {};
            if (sharedChannelConversationIdMap[conversation.shared_channel] !== undefined) {
                lastObject = sharedChannelConversationIdMap[conversation.shared_channel];
                conversation['latestMessage'] = lastObject.content;
                conversation['timetoken'] = lastObject.timetoken;
                conversation['latestMessageTimestamp'] = formatDate(this.pubNubService.getDateTime(lastObject.timetoken), this.translateService);
                //conversation['channel_id'] = conversation.shared_channel;
                // get existing badgeCount count
                conversation['badgeCount'] = this.pubNubService.getConversationBadgeCount(conversation.shared_channel);
            }
            // This block is to handle group addition and removal of user             
            if (conversation['leaving_time_token']) {
                conversation['latestMessage'] = this.translateService.instant('ERROR_MESSAGES.GRP_REMOVED');
                conversation['timetoken'] = conversation['leaving_time_token'];
                conversation['latestMessageTimestamp'] = formatDate(this.pubNubService.getDateTime(conversation['leaving_time_token']), this.translateService);
            } else if (!conversation['latestMessage'] && !conversation['leaving_time_token'] && conversation['joining_time_token']) {
                let latestMessage = '';
                if (conversation.type === CONSTANTS.CONVERSATION_TYPE.SINGLE && (conversation.connection_status === CONSTANTS.CONNECTION_STATUS.CONNECTED || conversation.connection_status === CONSTANTS.CONNECTION_STATUS.CONNECTED_BLOCKED)) {
                    latestMessage = this.translateService.instant('ERROR_MESSAGES.INVITATION_ACCEPTED_PREFIX') + conversation.user_name + "."
                } else if (conversation.type === CONSTANTS.CONVERSATION_TYPE.GROUP) {
                    if (conversation.group_type === CONSTANTS.GROUP_TYPE.NORMAL) {
                        latestMessage = this.translateService.instant('ERROR_MESSAGES.GRP_JOINED');
                    } else if (conversation.group_type === CONSTANTS.GROUP_TYPE.SERVICE_PROVIDER) {
                        latestMessage = this.translateService.instant('ERROR_MESSAGES.INVITATION_ACCEPTED_PREFIX') + conversation.user_name + "."
                    } else if (conversation.group_type === CONSTANTS.GROUP_TYPE.HOUSING_PROVIDER) {
                        latestMessage = this.translateService.instant('ERROR_MESSAGES.INVITATION_ACCEPTED_PREFIX') + conversation.user_name + "."
                    }
                }
                conversation['latestMessage'] = latestMessage;
                conversation['timetoken'] = conversation['joining_time_token'];
                conversation['latestMessageTimestamp'] = formatDate(this.pubNubService.getDateTime(conversation['joining_time_token']), this.translateService);

                // Added conversation object in sharedChannelConversationIdMap of those conversation which doesn't has message
                if (!this.sharedChannelConversationIdMap[conversation.shared_channel]) {
                    this.sharedChannelConversationIdMap[conversation.shared_channel] = conversation;
                }
            }
            // // console.log('updateLastConversation', conversation);
            if (conversation.status === CONSTANTS.CONVERSATION_STATUS.ARCHIVE && conversation.badgeCount > 0) {
                conversation.status = CONSTANTS.CONVERSATION_STATUS.OPEN;
                this.updateConversationStatus(conversation);
            }
            return conversation;
        });
        if (callback) {
            callback(conversations);
        }
    }

    updateConversations(message: IMessage, timetoken: number): void {
        let shared_channel = message.shared_channel || message.shared_channel_id;
        let conversation: IConversation = null, conversationIndex;

        if (this.sharedChannelIdConversationIndexMap[shared_channel] !== undefined) {
            conversationIndex = this.sharedChannelIdConversationIndexMap[shared_channel];
            conversation = this.conversations[conversationIndex];

            // Resident sent second subsequent request for address verification then don't increment/show count, refresh page so that 
            if (message.content_type_id) {
                this.refreshConversation(this.refreshConversationDone, false);
            }
            //Do not update badge count if we are in chatbox screen and chatting with same user as the message 
            else if (shared_channel !== this.userService.getCurrentPage().userid) {
                conversation.badgeCount = (conversation.badgeCount === undefined) ? 1 : conversation.badgeCount + 1;

                // Update badgeCount into localstorage
                this.pubNubService.setConversationLastState(shared_channel, conversation.badgeCount);
            } else {
                //// console.log('Updated timetoken for shared_channel,', shared_channel, message.timetoken);
                this.pubNubService.setConversationLastState(shared_channel, 0, timetoken);
            }
            conversation.latestMessage = this.chatService.getMessageContent(message.content);
            conversation.timetoken = timetoken;
            conversation.latestMessageTimestamp = formatDate(this.pubNubService.getDateTime(timetoken), this.translateService);
            if (conversation.status === CONSTANTS.CONVERSATION_STATUS.ARCHIVE) {
                conversation.status = CONSTANTS.CONVERSATION_STATUS.OPEN;
                this.updateConversationStatus(conversation);
            }
            this.sortConversation(this.conversations, (conversations) => {
                this.conversations = conversations;
            });
        } else {
            //console.log('In updateConversations, refreshConversation for new chat.', message);
            // Resident sent first request for address verification then don't increment/show count 
            if (!message.content_type_id) {
                timetoken -= 10;
                this.pubNubService.setConversationLastState(shared_channel, 1, timetoken);
                this.refreshConversation(this.refreshConversationDone, false);
            }
        }
    }

    updatePresenceStatus(): void {
        let channels: Array<string> = [];
        this.conversations.forEach((conversation) => {
            if (conversation.type === CONSTANTS.CONVERSATION_TYPE.SINGLE) {
                channels.push(conversation.user_id);
            }
        });
        this.pubNubService.getUsersState(channels).then((data: any) => {
            if (data.channels) {
                this.conversations.map((conversation, index) => {
                    conversation.presence = data.channels[conversation.user_id] ? "online" : "";
                });
            }
        });
    }

    updateSentConversations(message: any): void {
        let conversation = null, conversationIndex;
        let shared_channel = message.shared_channel || message.shared_channel_id;
        if (this.sharedChannelConversationIdMap[shared_channel] && this.sharedChannelIdConversationIndexMap[shared_channel] !== undefined) {
            conversationIndex = this.sharedChannelIdConversationIndexMap[shared_channel];
            conversation = this.conversations[conversationIndex];
            //// console.log(conversation.user_id, "-", message.receiver_uuid, "-", message)
            if (conversation.user_id == message.receiver_uuid) {
                conversation.latestMessage = this.chatService.getMessageContent(message.content);
                //conversation.channel_id = conversation.shared_channel;
                conversation.timetoken = message.timetoken;
                conversation.latestMessageTimestamp = formatDate(this.pubNubService.getDateTime(message.timetoken), this.translateService);
            }

            this.sortConversation(this.conversations, (conversations) => {
                this.conversations = conversations;
            });
        } else {
            // console.log('refreshConversation for sent  chat.');
            this.refreshConversation(this.refreshConversationDone, false);
        }
    }


    exitGroup(conversation: IConversation) {
        this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
        let that = this;
        this.pubNubService.getTimeToken((pubnubtimetoken) => {
            let userid = this.userService.userObj.user_id;
            let removeRequest: IGroupRemoveRequest = {
                user_id: userid,
                shared_channel: conversation.shared_channel,
                name: conversation.name,
                member_id: userid,
                leaving_time_token: pubnubtimetoken
            };
            that.chatService.removeMemberFromGroup(removeRequest).subscribe((result) => {
                if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
                    that.pubNubService.removeChannelFromGroup([userid], conversation.shared_channel, conversation.name, pubnubtimetoken);
                } else {
                    this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
                    this.loaderService.dismissLoader();
                }
            }, error => {
                this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
                this.loaderService.dismissLoader();
            });
        });
    }

    updateConversationStatus(conversation: IConversation) {
        let params: IUpdateConversationStatusRequestParams = {
            user_id: this.userService.userObj.user_id,
            shared_channel: conversation.shared_channel,
            status: conversation.status
        };
        this.chatService.updateConversationStatus(params).subscribe((result) => {
            //console.log('Inside updateConversationStatus', result);
            this.loaderService.dismissLoader();
            if (result.status !== CONSTANTS.RESPONSE_STATUS.SUCCESS) {
                this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
            }
        });
    }
}