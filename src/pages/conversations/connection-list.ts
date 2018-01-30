import { ChatService, IConversation, IGetUserConversationRequest, ISearchConversationRequest, IGetUserConversationResponse } from './chat-service';
import { PubNubService } from '../../providers/pubnub-service';
import { LoaderService } from '../../providers/loader-service';
import { CONSTANTS } from '../../shared/config';
import { TranslateService } from "@ngx-translate/core";

export class ConnectionList {

    constructor(public chatService: ChatService, public pubNubService: PubNubService,
        private translateService: TranslateService, public loaderService: LoaderService) {

    }

    getUserList(params: IGetUserConversationRequest, callback: (error: Error, params: IGetUserConversationResponse) => void): void {
        this.chatService.getUserConversation(params).subscribe((result: any) => {
            if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
                this.processConversationResult(result, callback);
            } else {
                this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
            }
        }, error => {
            this.loaderService.showToaster(error);
        });
    }

    searchConversation(params: ISearchConversationRequest, callback: (error: Error, params: IGetUserConversationResponse) => void): void {
        this.chatService.searchConversation(params).subscribe((result: any) => {
            if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
                this.processConversationResult(result, callback);
            } else {
                this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
            }
        }, error => {
            this.loaderService.showToaster(error);
        });
    }

    processConversationResult(result, callback) {
        let connected: Array<IConversation>, invitation_sent: Array<IConversation>, invitation_received: Array<IConversation>;
        let otherUsersList: Array<IConversation>, not_connected: Array<IConversation>;

        connected = updateDisplayName(result.connected || []);
        invitation_sent = updateDisplayName(result.invitation_sent || []);
        invitation_received = updateDisplayName(result.invitation_received || []);
        not_connected = updateDisplayName(result.not_connected || []);

        otherUsersList = result.invitation_sent || [];
        otherUsersList = otherUsersList.concat(invitation_received);
        otherUsersList = otherUsersList.concat(not_connected);

        if (callback) {
            callback(null, { otherUsersList: otherUsersList, connected: connected, invitation_sent: invitation_sent, invitation_received: invitation_received, not_connected: not_connected });
        }

        function updateDisplayName(users) {
            users.map((item) => {
                if (item.type !== CONSTANTS.CONVERSATION_TYPE.GROUP) {
                    item['user_id'] = item.receiver_id;
                } else {
                    item['user_name'] = item.name;
                    item['user_id'] = item.shared_channel;
                    item['receiver_id'] = item.shared_channel;
                }
                return item;
            });
            return users;
        }
    }

    updatePresenceStatus(connectedUsersList, callback?): void {
        let channels: Array<string> = [];
        connectedUsersList.forEach((user) => {
            if (user.type === CONSTANTS.CONVERSATION_TYPE.SINGLE) {
                channels.push(user.user_id);
            }
        });
        if (channels && channels.length > 0) {
            this.pubNubService.getUsersState(channels).then((data: any) => {
                if (data && data.channels) {
                    connectedUsersList.map((user, index) => {
                        user['presence'] = data.channels[user.user_id] ? "online" : "";
                    });
                }
                if (callback) {
                    callback();
                }
            });
        } else {
            if (callback) {
                callback();
            }
        }
    }

}
