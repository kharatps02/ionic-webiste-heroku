import { UserService, IUser } from '../../../providers/user-service';
import { PubNubService, PubNubEvent, IGetPushNotificationMessageRequest } from '../../../providers/pubnub-service';
import { ChatService, IConversation, IArchive, IMessage, IUpdateConversationStatusRequestParams } from '../chat-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { ElementRef } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";


export class BaseChatBox {
    public userData: IUser;
    public selectedUser: IConversation;
    public messageModel: string;
    public pictureModel: string;
    public videoPath: string;
    public messages: Array<IMessage> = [];
    public contactIdDetailMap: Map<string, any>;
    public usertype = CONSTANTS.USER_TYPE;
    public pageState: {
        messages: Array<any>,
        startTimeToken: number,
        endTimeToken: number
    };
    public chatBoxInfiniteScrollEnabled: boolean = false;
    public chatBoxInfiniteScrollShow: boolean = true;

    constructor(public pubNubService: PubNubService,
        public userService: UserService, public chatService: ChatService, public loaderService: LoaderService,
        public translateService: TranslateService, public events, public element: ElementRef) {
        this.userData = this.userService.getUser();
        this.messageModel = '';
        this.contactIdDetailMap = new Map<string, any>();
        this.contactIdDetailMap[this.userData.user_id] = { user_name: this.userData.user_name, profile_pic: this.userData.profile.profile_pic };
    }

    setContactIdDetailMap(userList: Array<any>) {
        userList.forEach(element => {
            this.contactIdDetailMap[element.user_id] = { profile_pic: element.profile_pic, user_name: element.user_name };
        });
    }
    loadMoreMessage(infiniteScroll) {
        this.loadSelectedUserHistory(this.selectedUser.shared_channel, (error, isAllMessageLoaded = true) => {
            infiniteScroll.complete();
            this.chatBoxInfiniteScrollEnabled = !isAllMessageLoaded;
            if (!this.chatBoxInfiniteScrollEnabled) {
                this.chatBoxInfiniteScrollShow = false;
            }
            //s console.log('chatBoxInfiniteScrollEnabled', this.chatBoxInfiniteScrollEnabled);
        });
    }
    loadSelectedUserHistory(shared_channel: string, callback?) {
        let that = this;
        let startTimeToken = null, endTimeToken = that.selectedUser.joining_time_token;

        if (!this.pageState) {
            startTimeToken = new Date().getTime() * 10000;
            if (that.selectedUser.leaving_time_token !== undefined && that.selectedUser.leaving_time_token > 0) {
                startTimeToken = that.selectedUser.leaving_time_token;
            }
            this.pageState = {
                messages: [],
                startTimeToken: startTimeToken,
                endTimeToken: endTimeToken
            }
        }

        that.pubNubService.loadChathistory(shared_channel, true, CONSTANTS.CONVERSATION_MAX_UNREAD_COUNT, this.pageState.startTimeToken, endTimeToken, true, (error, response) => {
            if (!error) {
                that.pageState['messages'] = that.formatMessages(response.messages).concat(that.pageState.messages);
                that.pageState['endTimeToken'] = response.endTimeToken;
                that.pageState['startTimeToken'] = response.startTimeToken;
                that.messages = that.pageState.messages || [];
                if (response.messages.length < CONSTANTS.CONVERSATION_MAX_UNREAD_COUNT) {
                    console.log('End of the messages!');
                    if (callback) {
                        callback(null, true);
                    }
                } else {
                    if (callback) {
                        callback(null, false);
                    }
                }
            }
        });
    }

    formatMessages(messages) {
        let tempmessages = [];
        messages = messages || [];
        messages.forEach(element => {
            if (element.entry) {
                tempmessages.push(this.createMessage(element.entry));
            }
        });
        return tempmessages;
    }

    createMessage(message: IMessage): any {
        let messageObj, contactObj = {}, senderObj = this.contactIdDetailMap[message.sender_uuid];
        if (senderObj) {
            contactObj = { user_name: senderObj.user_name, profile_pic: senderObj.profile_pic };
        }
        //console.log(contactObj);
        messageObj = {
            content: this.chatService.getMessageContent(message.content),
            shared_channel: message.shared_channel,
            image: message.image,
            sender_uuid: message.sender_uuid,
            receiver_uuid: message.receiver_uuid,
            video: message.video,
            timetoken: message.timetoken / 10000
        };
        if (message.content_type_id) {
            messageObj['content_type_id'] = message.content_type_id;
        }

        Object.assign(messageObj, contactObj);
        return messageObj;

    }

    sendMessage(messageStr) {
        this.messageModel = '';
        if (this.selectedUser.leaving_time_token !== undefined && this.selectedUser.leaving_time_token > 0) {
            this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.GRP_SEND_ERROR_MSG'), 'center');
            // console.log(this.translateService.instant('ERROR_MESSAGES.GRP_SEND_ERROR_MSG'));
        } else {
            this.pubNubService.getTimeToken((pubnubtimestoken) => {
                if (this.selectedUser.shared_channel) {
                    this.pubNubService.getSupportedLanguageMsg(messageStr, this.selectedUser.languages, false).subscribe((msgContent) => {
                        let coreMessageObj: IMessage = {
                            content: msgContent,
                            sender_uuid: this.userData.user_id,
                            image: this.pictureModel,
                            receiver_uuid: this.selectedUser.receiver_id,
                            shared_channel: this.selectedUser.shared_channel,
                            timetoken: pubnubtimestoken,
                            tags_array: [],
                            video: this.videoPath,
                            is_group: false
                        };
                        this.sendMessageToPubnub(coreMessageObj);
                    }, error => {
                        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
                    });
                }
            });
        }
        this.resetFocus();
    }

    getPushNotificationTitle(): string {
        let title = '';
        if (this.userService.userName != '') {
            title = this.userService.userName;
        } else {
            title = this.userData.profile.first_name + ' ' + this.userData.profile.last_name;
        }
        //Update title to include group name 
        if (this.selectedUser.type && this.selectedUser.type === CONSTANTS.CONVERSATION_TYPE.GROUP) {
            title = title + '@' + this.selectedUser.user_name;
        }
        return title;
    }

    getMessageTagsArray(message: string): Array<string> {
        let tagslistArray = [], tags_array: Array<string> = [];
        tagslistArray = message.split(' ');
        for (let i = 0; i < tagslistArray.length; i++) {
            if (tagslistArray[i].indexOf('#') == 0) {
                tags_array.push(tagslistArray[i]);
            }
        }
        return tags_array;
    }

    sendMessageToPubnub(messageObj: IMessage) {
        let that = this, coreMessageObj: IMessage, sharedChannelObj, receiverObj;
        let pushNotificationMsg: IGetPushNotificationMessageRequest, pushNotificationObj, isMessagePublishOnPubnub = false;

        this.resizeWriteMsgTextArea();
        coreMessageObj = messageObj;

        coreMessageObj.tags_array = this.getMessageTagsArray(this.chatService.getMessageContent(coreMessageObj.content));
        coreMessageObj['is_group'] = (this.selectedUser.type && this.selectedUser.type === CONSTANTS.CONVERSATION_TYPE.GROUP) ? true : false;

        //message object for shared channel
        sharedChannelObj = coreMessageObj;
        pushNotificationMsg = {
            title: this.getPushNotificationTitle(),
            message: this.chatService.getMessageContent(coreMessageObj.content, this.chatService.getNotificationLang(this.selectedUser.languages)),
            sender: this.userData.user_name
        };
        pushNotificationObj = this.pubNubService.getPushNotificationMessage(pushNotificationMsg);
        if (this.selectedUser.type && this.selectedUser.type == CONSTANTS.CONVERSATION_TYPE.GROUP) {
            sharedChannelObj = Object.assign(sharedChannelObj, pushNotificationObj);
        }
        //message object for receiver channel         
        receiverObj = Object.assign({}, pushNotificationObj, coreMessageObj);

        //Change status to open for archived 
        if (this.selectedUser.status === CONSTANTS.CONVERSATION_STATUS.ARCHIVE) {
            this.selectedUser.status = CONSTANTS.CONVERSATION_STATUS.OPEN;
            this.events.publish(CONSTANTS.APP_EVENTS.REFRESH_CONVERSATION);
            this.updateConversationStatus(this.selectedUser);
        }
        this.pubNubService.publish(coreMessageObj.shared_channel, sharedChannelObj).subscribe((event: PubNubEvent) => {
            //console.log('Publish message to on channel', coreMessageObj.shared_channel, sharedChannelObj, event);
            if (!isMessagePublishOnPubnub) {
                isMessagePublishOnPubnub = true;
                let timetoken = event.value.timetoken;
                // update last read timestamp
                receiverObj['timetoken'] = timetoken;
                coreMessageObj['timetoken'] = timetoken;
                if (this.selectedUser.type === CONSTANTS.CONVERSATION_TYPE.GROUP) {
                    this.userService.setCurrentPage(CONSTANTS.PAGES.GROUP_CHAT, that.selectedUser.receiver_id);
                } else if (this.selectedUser.connection_status && this.selectedUser.connection_status !== CONSTANTS.CONNECTION_STATUS.CONNECTED_BLOCKED) {
                    sendToSelectedUser.call(this, receiverObj);
                } else {
                    // Do not send 1:1 message to received if they have blocked you. Just update the chat window
                    this.messages.push(this.createMessage(coreMessageObj));
                    this.events.publish(CONSTANTS.APP_EVENTS.KEYBOARD);
                }
                this.pubNubService.setConversationLastState(coreMessageObj.shared_channel, 0, timetoken);
                this.events.publish(CONSTANTS.APP_EVENTS.SENT_MESSAGE, coreMessageObj);
                this.archiveChat(coreMessageObj);
                // Reset the messageStr input
                this.resetMessageModel();
            }
        }, (error) => {
            this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
        });

        function sendToSelectedUser(receiverObj) {
            that.pubNubService.publish(coreMessageObj.receiver_uuid, receiverObj).subscribe((event: PubNubEvent) => {
                // console.log('Publish message to reciever. ', coreMessageObj.receiver_uuid, event, coreMessageObj, receiverObj);
            }, (error) => {
                that.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
            });

            that.messages.push(that.createMessage(coreMessageObj));
            that.events.publish(CONSTANTS.APP_EVENTS.KEYBOARD);
        }
    }


    resizeWriteMsgTextArea() {
        //let textareaEle = this.element.nativeElement.querySelector("textarea");
        this.element.nativeElement.querySelector("textarea").style.height = '15px';
    }

    archiveChat(coreMessageObj) {
        let archiveObj: IArchive = {
            user_id: this.userData.user_id,
            content: coreMessageObj.content,
            sender_uuid: coreMessageObj.sender_uuid,
            shared_channel: coreMessageObj.shared_channel,
            date: coreMessageObj.date,
            image: this.pictureModel,
            video: this.videoPath,
            tags: coreMessageObj.tagsArray
        };

        if (this.selectedUser.type !== CONSTANTS.CONVERSATION_TYPE.GROUP) {
            archiveObj.receiver_uuid = coreMessageObj.receiver_uuid;
        }

        this.chatService.chatArchives(archiveObj).subscribe((res) => {
            //// console.log('In chatArchives response', res);
        }, error => {
            this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
        })
    }

    resetMessageModel(): void {
        this.messageModel = '';
        this.pictureModel = '';
        this.videoPath = '';
    }

    resetFocus() {
        let textareaEle = this.element.nativeElement.querySelector("textarea");
        textareaEle.focus();
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

