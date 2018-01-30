import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { IConversation } from '../chat-service';
import { ChatBox } from '../chat-box/chat-box';
import { UserService, IUser } from '../../../providers/user-service';
import { ConnectionList } from '../connection-list';
import { ChatService, IUpdateProviderConnectionRequestParams, IMessage } from '../chat-service';
import { PubNubService, IConnectionStatusChangeState } from '../../../providers/pubnub-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'page-housing-provider-options',
  templateUrl: 'housing-provider-options.html'
})
export class HousingProviderOptions {
  public selectedUser: IConversation;
  //public groupDetails: IConversation;
  public userData: IUser;
  // public groupChannel: string;
  // public groupName: string;
  // public groupOwner: string;
  // public memberIndex: number;
  public connectionStatus = CONSTANTS.CONNECTION_STATUS;
  private connectionList: ConnectionList;
  constructor(public navCtrl: NavController, public navParams: NavParams, private userService: UserService,
    private chatService: ChatService, private loaderService: LoaderService, private pubNubService: PubNubService,
    private translateService: TranslateService, private analyticsService: AnalyticsService) {
    this.connectionList = new ConnectionList(chatService, pubNubService, translateService, loaderService);
    this.userData = this.userService.getUser();
    this.selectedUser = this.navParams.get('user');
    //this.groupDetails = this.navParams.get('groupDetails');
    //this.memberIndex = this.navParams.get('memberIndex');

    // if (this.groupDetails) {
    //   this.groupChannel = this.groupDetails.shared_channel;
    //   this.groupName = this.groupDetails.name;
    //   this.groupOwner = this.groupDetails.created_by;
    //   this.selectedUser.receiver_id = this.selectedUser.created_by;
    // }

    //console.log('In ViewInvite this.selectedUser ', this.selectedUser);
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.PUBLIC_PROFILE);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.PUBLIC_PROFILE);
  }

  onAcceptAndConnect() {
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.updateProviderConnection(CONSTANTS.CONNECTION_STATUS.CONNECTED, () => {
      let params = { user_id: this.selectedUser.created_by, action: 'accept', is_advocate: this.selectedUser.is_advocate };
      this.chatService.updateVerificationRequest(params).subscribe((result) => {
        this.loaderService.dismissLoader();
        if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
          this.pubNubService.getTimeToken((pubnubtimestoken) => {
            // Update Joining date as accepted date
            //this.selectedUser.joining_time_token = pubnubtimestoken;
            this.selectedUser.connection_status = CONSTANTS.CONNECTION_STATUS.CONNECTED;
            this.selectedUser.verification_status = CONSTANTS.VERIFICATION_STATUS.VERIFIED;

            this.sendMessageOnPubnub('accept');
            let stateObj: IConnectionStatusChangeState = {
              _id: this.selectedUser.shared_channel,
              name: this.selectedUser.user_name,
              connection_status: CONSTANTS.CONNECTION_STATUS.CONNECTED,
              connection_action: CONSTANTS.CONNECTION_STATUS.CONNECTED,
              action: CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED,
              connection_type: this.selectedUser.type
            };
            this.pubNubService.setConnectionStatusChangeState(stateObj, [this.selectedUser.created_by]);
            this.openChatBox(this.selectedUser);
          });
        } else {
          this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
        }
      });
    });
  }

  sendMessageOnPubnub(type) {
    let messageStr = '';
    //TODO - Temporary fix for getting address for housing provider. 
    this.selectedUser['home_address'] = this.selectedUser.latestMessage.substring(24);
    if (type === 'accept') {
      messageStr = this.selectedUser['home_address'] + ' ' + CONSTANTS.MESSAGES.ACCEPTED_POSTFIX;
    } else if (type === 'deny') {
      messageStr = CONSTANTS.MESSAGES.DENY_PREFIX + ' ' + this.selectedUser['home_address'];
    }
    //  this.selectedUser['home_address'] + ' has been verified. You are connected to ' + this.selectedUser.first_name + ' ' + this.selectedUser.last_name + '.';
    this.pubNubService.getSupportedLanguageMsg(messageStr).subscribe((msgContent) => {
      let coreMessageObj: IMessage = {
        content: msgContent,
        sender_uuid: this.userData.user_id,
        image: '',
        receiver_uuid: this.selectedUser.shared_channel,
        shared_channel: this.selectedUser.shared_channel,
        timetoken: this.selectedUser.joining_time_token,
        tags_array: [],
        video: '',
        is_group: true,
        content_type_id: CONSTANTS.MESSAGE_CONTENT_TYPE_ID.SYSTEM_MESSAGE_TO_ALL
      };
      this.pubNubService.publish(coreMessageObj.shared_channel, coreMessageObj).subscribe((event) => {
        //console.log('In sendInvitationMessageToAdmin Publish message', coreMessageObj, event);
      });
    }, error => {
      this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
    });
  }

  onDeny() {
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.updateProviderConnection(CONSTANTS.CONNECTION_STATUS.IGNORE, () => {
      this.onDisconnectFromAddress('deny');
    });
  }

  onDisconnectFromAddress(action: string = 'disconnect') {
    let params = { user_id: this.selectedUser.created_by, action: action, is_advocate: this.selectedUser.is_advocate };
    this.chatService.updateVerificationRequest(params).subscribe((result) => {
      this.loaderService.dismissLoader();
      if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        this.pubNubService.getTimeToken((pubnubtimestoken) => {
          // Update Joining date as accepted date
          this.selectedUser.joining_time_token = pubnubtimestoken;
          this.selectedUser.connection_status = CONSTANTS.CONNECTION_STATUS.IGNORE;

          // send message on Pubnub
          if (action === 'deny') {
            this.sendMessageOnPubnub(action);
          }
          let stateObj: IConnectionStatusChangeState = {
            _id: this.selectedUser.shared_channel,
            name: this.selectedUser.user_name,
            connection_status: CONSTANTS.CONNECTION_STATUS.IGNORE,
            connection_action: CONSTANTS.CONNECTION_STATUS.IGNORE,
            action: CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED
          };
          this.pubNubService.setConnectionStatusChangeState(stateObj, [this.selectedUser.created_by]);
        });
        this.loaderService.showToaster(CONSTANTS.RESPONSE_STATUS.SUCCESS, result.message);
        this.navCtrl.pop();
      } else {
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
      }
    });
  }


  updateProviderConnection(connectionStatus, callback) {
    let params: IUpdateProviderConnectionRequestParams = {
      user_id: this.userData.user_id,
      shared_channel: this.selectedUser.shared_channel,
      connection_status: connectionStatus,
      receiver_id: this.selectedUser.created_by,
      is_advocate: this.selectedUser.is_advocate
    };
    this.chatService.updateProviderConnectionStatus(params).subscribe((result) => {
      //console.log('Inside updateConnectionStatus callback', result);
      if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        if (callback) {
          callback();
        }
      } else {
        this.loaderService.dismissLoader();
        this.loaderService.showToaster(result.message);
        //this.router.navigate(['/conversation']);
      }
    });
  }

  openChatBox(conversation: IConversation) {
    this.navCtrl.push(ChatBox, { user: conversation }).then(() => {
      this.navCtrl.remove((this.navCtrl.length() - 2), 1);
    });
  }


}
