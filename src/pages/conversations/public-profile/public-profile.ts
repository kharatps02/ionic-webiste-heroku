import { Component } from '@angular/core';
import { NavController, NavParams, Events, AlertController } from 'ionic-angular';
import { IConversation } from '../chat-service';
import { ChatBox } from '../chat-box/chat-box';
import { UserService, IUser } from '../../../providers/user-service';
import { ConnectionList } from '../connection-list';
import { ChatService, IUpdateConnectionStatusRequestParams, IGroupRemoveRequest } from '../chat-service';
import { PubNubService, IConnectionStatusChangeState, ISendPushNotificationRequest } from '../../../providers/pubnub-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'page-public-profile',
  templateUrl: 'public-profile.html'
})
export class PublicProfile {
  public selectedUser: IConversation;
  public groupDetails: IConversation;
  public userData: IUser;
  public groupChannel: string;
  public groupName: string;
  public groupOwner: string;
  public memberIndex: number;
  public connectionStatus = CONSTANTS.CONNECTION_STATUS;
  public usertype = CONSTANTS.USER_TYPE;
  private connectionList: ConnectionList;
  constructor(public navCtrl: NavController, public navParams: NavParams, private userService: UserService,
    private chatService: ChatService, private loaderService: LoaderService, private pubNubService: PubNubService,
    private translateService: TranslateService,
    private analyticsService: AnalyticsService, private events: Events, private alertCtrl: AlertController) {
    this.connectionList = new ConnectionList(chatService, pubNubService, translateService, loaderService);
    this.userData = this.userService.getUser();
    this.selectedUser = this.navParams.get('user');
    this.groupDetails = this.navParams.get('groupDetails');
    this.memberIndex = this.navParams.get('memberIndex');

    if (this.groupDetails) {
      this.groupChannel = this.groupDetails.shared_channel;
      this.groupName = this.groupDetails.name;
      this.groupOwner = this.groupDetails.created_by;
      this.selectedUser.receiver_id = this.selectedUser.user_id;
    }

    //console.log('In ViewInvite this.selectedUser ', this.selectedUser);
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.PUBLIC_PROFILE);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.PUBLIC_PROFILE);
  }


  onAcceptAndconnect() {
    this.updateConnectionStatus(CONSTANTS.CONNECTION_STATUS.CONNECTED, () => {
      this.pubNubService.getTimeToken((pubnubtimestoken) => {
        // Update Joining date as accepted date
        this.selectedUser.joining_time_token = pubnubtimestoken;
        this.navCtrl.push(ChatBox, { user: this.selectedUser }).then(() => {
          this.navCtrl.remove((this.navCtrl.length() - 2), 1);
          this.selectedUser.connection_status = CONSTANTS.CONNECTION_STATUS.CONNECTED;
          this.events.publish(CONSTANTS.APP_EVENTS.REFRESH_CONVERSATION);
          let stateObj: IConnectionStatusChangeState = {
            _id: this.selectedUser.shared_channel,
            name: this.selectedUser.user_name,
            connection_status: CONSTANTS.CONNECTION_STATUS.CONNECTED,
            action: CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED,
            connection_type: this.selectedUser.type
          };
          this.pubNubService.setConnectionStatusChangeState(stateObj, [this.selectedUser.receiver_id]);
        });
      });
    });
  }

  onIgnoreClick() {
    //console.log('In onIgnoreClick');
    this.updateConnectionStatus(CONSTANTS.CONNECTION_STATUS.IGNORE, () => {
      this.events.publish(CONSTANTS.APP_EVENTS.REFRESH_CONVERSATION);
      this.selectedUser.connection_status = CONSTANTS.CONNECTION_STATUS.IGNORE;
      let stateObj: IConnectionStatusChangeState = {
        _id: this.selectedUser.shared_channel,
        name: this.selectedUser.user_name,
        connection_status: CONSTANTS.CONNECTION_STATUS.IGNORE,
        action: CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED
      };
      this.pubNubService.setConnectionStatusChangeState(stateObj, [this.selectedUser.receiver_id]);
      this.events.publish(CONSTANTS.APP_EVENTS.REFRESH_GROUP_DETAILS);
      this.navCtrl.pop();
    });

  }

  onBlockClick() {
    //console.log('In onBlockClick');
    let that = this;
    if (that.selectedUser.user_type && that.selectedUser.user_type === CONSTANTS.USER_TYPE.ADMIN) {
      that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.ADMIN_BLOCK'));
    } else {

      that.updateConnectionStatus(CONSTANTS.CONNECTION_STATUS.BLOCKED, () => {
        let receiver_uuid;
        that.events.publish(CONSTANTS.APP_EVENTS.REFRESH_CONVERSATION);
        let alert = that.alertCtrl.create({
          title: that.translateService.instant('ERROR_MESSAGES.BLOCK_SUCCESS'),
          buttons: [{
            text: this.translateService.instant('CONVERSATIONS.OK'),
            handler: () => {
              if (that.memberIndex !== undefined) {
                receiver_uuid = that.selectedUser.user_id;
                that.navCtrl.pop();
                that.events.publish(CONSTANTS.APP_EVENTS.REFRESH_GROUP_DETAILS);
              } else {
                receiver_uuid = that.selectedUser.receiver_id
                that.navCtrl.remove(1, (that.navCtrl.length() - 1));
              }
              that.selectedUser.connection_status = CONSTANTS.CONNECTION_STATUS.BLOCKED;
              let stateObj: IConnectionStatusChangeState = {
                _id: that.selectedUser.shared_channel,
                name: that.selectedUser.user_name,
                connection_status: CONSTANTS.CONNECTION_STATUS.CONNECTED_BLOCKED,
                action: CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED,
                connection_action: CONSTANTS.CONNECTION_STATUS.BLOCKED
              };
              that.pubNubService.setConnectionStatusChangeState(stateObj, [receiver_uuid]);
              alert.dismiss();
              return false;
            }
          }],
          enableBackdropDismiss: false,
          cssClass: 'alert-single'
        });
        alert.present();
      });
    }
  }

  inviteOrCancelInvite(conversation: IConversation, hasCalledFromNewMessage = false, callback?) {
    if (conversation.connection_status === CONSTANTS.CONNECTION_STATUS.NOT_CONNECTED) {
      this.sendInvite(conversation, hasCalledFromNewMessage);
    } else if (conversation.connection_status === CONSTANTS.CONNECTION_STATUS.INVITED) {
      this.cancelInvite(conversation, hasCalledFromNewMessage, callback);
    }
  }

  viewSentInvite(conversation: IConversation) {
    this.navCtrl.push(ChatBox, { user: conversation });
  }

  cancelInvite(conversation: IConversation, hasCalledFromNewMessage: boolean, callback?) {
    //console.log('cancelInvite', conversation);
    let params: IUpdateConnectionStatusRequestParams = {
      user_id: this.userData.user_id,
      shared_channel: conversation.shared_channel,
      connection_status: CONSTANTS.CONNECTION_STATUS.IGNORE,
      receiver_id: conversation.receiver_id,
      receiver_username: conversation.user_name,
      is_advocate: conversation.is_advocate
    };
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.chatService.updateConnectionStatus(params).subscribe((result) => {
      this.loaderService.dismissLoader();
      if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        conversation.connection_status = CONSTANTS.CONNECTION_STATUS.NOT_CONNECTED;
        let stateObj: IConnectionStatusChangeState = {
          _id: conversation.shared_channel,
          name: conversation.user_name,
          connection_status: CONSTANTS.CONNECTION_STATUS.IGNORE,
          action: CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED
        };
        this.pubNubService.setConnectionStatusChangeState(stateObj, [conversation.receiver_id]);
        if (!hasCalledFromNewMessage) {
          this.navCtrl.pop();
        }
        if (callback) {
          callback();
        }
      } else {
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
      }
    });
  }

  viewReceivedInvite(conversation: IConversation) {
    this.navCtrl.push(PublicProfile, { user: conversation });
  }

  sendInvite(conversation: IConversation, hasCalledFromNewMessage: boolean) {
    this.pubNubService.getTimeToken((pubnubtimestoken) => {
      let obj = {
        user_id: this.userData.user_id,
        created_by: this.userData.user_id,
        receiver_id: conversation.receiver_id || conversation.user_id,
        receiver_username: conversation.user_name,
        joining_time_token: pubnubtimestoken
      };

      if (conversation.user_type !== CONSTANTS.USER_TYPE.RESIDENT) {
        obj['connection_status'] = CONSTANTS.CONNECTION_STATUS.CONNECTED;
      }

      this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
      this.chatService.createOrEditConversation(obj).subscribe((result) => {
        this.loaderService.dismissLoader();
        if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS
          && result.chat[0] && result.chat[0].shared_channel) {
          conversation.shared_channel = result.chat[0].shared_channel;

          if (conversation.user_type === CONSTANTS.USER_TYPE.RESIDENT) {
            conversation.connection_status = CONSTANTS.CONNECTION_STATUS.INVITED;
            conversation.joining_time_token = pubnubtimestoken;

            //  Share invite state and push notification to recevier only if receiver is not blocked. 
            if (!result.is_blocked) {
              let stateObj: IConnectionStatusChangeState = {
                _id: result.chat[0].shared_channel,
                name: this.userData.user_name,
                connection_status: CONSTANTS.CONNECTION_STATUS.INVITED,
                action: CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED
              };
              this.pubNubService.setConnectionStatusChangeState(stateObj, [conversation.receiver_id]);
              this.chatService.getConversationExtraData({ shared_channel: result.chat[0].shared_channel }).subscribe((response) => {
                if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
                  Object.assign(conversation, { languages: response.languages });
                  this.sendPushNotificationToReceiver(conversation);
                }
              });
            }
            if (!hasCalledFromNewMessage) {
              this.navCtrl.pop();
            }
          } else {
            // If invited user is other then resident then open conversation directly.
            conversation.connection_status = CONSTANTS.CONNECTION_STATUS.CONNECTED;
            this.pubNubService.getTimeToken((pubnubtimestoken) => {
              // Update Joining date as invitation sent date
              conversation['joining_time_token'] = pubnubtimestoken;
              this.connectionList.updatePresenceStatus([conversation], () => {
                this.openChatBox(conversation);
              });
              this.events.publish(CONSTANTS.APP_EVENTS.REFRESH_CONVERSATION);
            });
          }
        } else {
          this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
        }
      });
    });
  }

  openChatBox(conversation: IConversation) {
    this.navCtrl.push(ChatBox, { user: conversation }).then(() => {
      this.navCtrl.remove((this.navCtrl.length() - 2), 1);
    });
  }

  updateConnectionStatus(connectionStatus, callback) {
    let params: IUpdateConnectionStatusRequestParams = {
      user_id: this.userData.user_id,
      shared_channel: this.selectedUser.shared_channel,
      connection_status: connectionStatus,
      receiver_id: this.selectedUser.user_id,
      receiver_username: this.selectedUser.user_name,
      is_advocate: this.selectedUser.is_advocate
    };
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.chatService.updateConnectionStatus(params).subscribe((result) => {
      //console.log('Inside updateConnectionStatus callback', result);
      this.loaderService.dismissLoader();
      if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        if (callback) {
          callback();
        }
      } else {
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
      }
    });
  }


  onMessageClick() {
    let that = this;
    if (this.selectedUser.connection_status === CONSTANTS.CONNECTION_STATUS.CONNECTED || this.selectedUser.connection_status === CONSTANTS.CONNECTION_STATUS.CONNECTED_BLOCKED) {
      let params: any = {
        user_id: this.selectedUser.user_id,
        shared_channel: this.selectedUser.shared_channel
      };
      this.loaderService.createLoader(that.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
      this.chatService.getSharedChannelDetails(params).subscribe((result) => {
        if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
          that.selectedUser.joining_time_token = result.chat[0].joining_time_token
        }
        that.selectedUser.type = CONSTANTS.CONVERSATION_TYPE.SINGLE;
        that.selectedUser.receiver_id = that.selectedUser.user_id;
        that.navCtrl.remove(1, that.navCtrl.length() - 1, { animate: false, progressAnimation: false }).then(() => {
          that.navCtrl.push(ChatBox, { user: that.selectedUser }).then(() => {
            that.loaderService.dismissLoader();
          });
        });
      });
    } else {
      //console.log(CONSTANTS.ERROR_MESSAGES.UNINVITED_MESSAGE);
      this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.UNINVITED_MESSAGE'));
    }
  }

  onRemoveClick(isLeave: boolean) {
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    let that = this;
    this.pubNubService.getTimeToken((pubnubtimetoken) => {
      let removeRequest: IGroupRemoveRequest = {
        user_id: that.userData.user_id,
        shared_channel: that.groupChannel,
        name: that.groupName,
        member_id: that.selectedUser.user_id,
        leaving_time_token: pubnubtimetoken
      };
      that.chatService.removeMemberFromGroup(removeRequest).subscribe((result) => {
        if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
          //console.log(pubnubtimetoken, '---', that.groupOwner, "--", that.userData.user_id, [that.selectedUser.user_id], that.groupChannel, that.groupName);
          that.pubNubService.removeChannelFromGroup([that.selectedUser.user_id], that.groupChannel, that.groupName, pubnubtimetoken);
          that.groupDetails.members.splice(that.memberIndex, 1);
        } else {
          that.loaderService.showToaster(result.message);
          that.loaderService.dismissLoader();
        }
        if (isLeave) {
          that.navCtrl.remove(1, that.navCtrl.length() - 1);
        } else {
          that.navCtrl.pop();
        }
      }, error => {
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
        this.loaderService.dismissLoader();
      });
      //this.pubNubService.removeChannelFromGroup([this.selectedUser._id], this.group_channel,this.group_name, timestamp); 
    });
  }

  onUnBlockClick() {
    let that = this;
    let params: IUpdateConnectionStatusRequestParams = {
      user_id: that.userData.user_id,
      shared_channel: that.selectedUser.shared_channel,
      connection_status: CONSTANTS.CONNECTION_STATUS.UNBLOCKED,
      receiver_id: that.selectedUser.user_id,
      receiver_username: that.selectedUser.user_name,
      is_advocate: that.selectedUser.is_advocate
    };

    that.loaderService.createLoader(that.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    that.chatService.updateConnectionStatus(params).subscribe((result) => {
      if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {

        let alert = that.alertCtrl.create({
          title: that.translateService.instant('ERROR_MESSAGES.UNBLOCK_SUCCESS'),
          buttons: [{
            text: this.translateService.instant('CONVERSATIONS.OK'),
            handler: () => {
              let stateObj: IConnectionStatusChangeState = {
                _id: that.selectedUser.shared_channel,
                name: that.userData.profile.first_name,
                connection_status: CONSTANTS.CONNECTION_STATUS.CONNECTED,
                action: CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED,
                connection_action: CONSTANTS.CONNECTION_STATUS.UNBLOCKED
              };
              that.pubNubService.setConnectionStatusChangeState(stateObj, [that.selectedUser.user_id]);
              that.navCtrl.pop();
              that.events.publish(CONSTANTS.APP_EVENTS.REFRESH_CONVERSATION);
              that.events.publish(CONSTANTS.APP_EVENTS.REFRESH_GROUP_DETAILS);
              alert.dismiss();
              return false;
            }
          }],
          enableBackdropDismiss: false,
          cssClass: 'alert-single'
        });
        alert.present();
      } else {
        that.loaderService.dismissLoader();
        that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
      }
      that.loaderService.dismissLoader();
    });
  }

  sendPushNotificationToReceiver(conversation) {
    let pushObj: ISendPushNotificationRequest;
    pushObj = {
      title: this.userData.user_name + " " + CONSTANTS.MESSAGES.SENT_INVITE_NOT_POSTFIX,
      message: '',
      sender: this.userData.user_name,
      receiver_uuid: conversation.receiver_id,
    };
    this.pubNubService.getSupportedLanguageMsg(pushObj.title, conversation.languages, false).subscribe((msgContent) => {
      pushObj.title = this.chatService.getMessageContent(msgContent, this.chatService.getNotificationLang(conversation.languages));
      this.pubNubService.sendPushNotification(pushObj);
    });
  }

}
