import { Component } from '@angular/core';
import { NavController, Events, AlertController } from 'ionic-angular';
import { LoaderService } from "../../../../providers/loader-service";
import { UserService, IBlockedUser } from "../../../../providers/user-service";
import { IUpdateConnectionStatusRequestParams, ChatService } from "../../../conversations/chat-service";
import { CONSTANTS } from "../../../../shared/config";
import { IConnectionStatusChangeState, PubNubService } from "../../../../providers/pubnub-service";
import { AnalyticsService } from "../../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";


@Component({
  selector: 'page-blocked-users',
  templateUrl: 'blocked-users.html'
})
export class BlockedUsers {
  public blockedUsers: Array<IBlockedUser>;
  public user_id: string;

  constructor(public navCtrl: NavController, public userService: UserService, public chatService: ChatService, private pubNubService: PubNubService,
    private analyticsService: AnalyticsService, private events: Events, public loaderService: LoaderService, 
    private translateService: TranslateService, public alertCtrl: AlertController) {
    this.user_id = this.userService.userProfile.user_id;
    this.loadBlockedUsers();
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.MY_STUFF_BLOCKED_USERS);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.MY_STUFF_BLOCKED_USERS);
  }

  loadBlockedUsers() {
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.userService.getBlockedUsers(this.user_id).subscribe((result: any) => {
      if (result) {
        this.blockedUsers = result.blocked_users || [];
      }
      this.loaderService.dismissLoader();
    });
  }

  unBlockUser(user: IBlockedUser, index: number) {
    let params: IUpdateConnectionStatusRequestParams = {
      user_id: this.user_id,
      shared_channel: user.shared_channel,
      connection_status: CONSTANTS.CONNECTION_STATUS.UNBLOCKED,
      receiver_id: user.user_id,
      receiver_username: user.user_name,
      is_advocate: false      
    };

    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.chatService.updateConnectionStatus(params).subscribe((result) => {
      if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        this.blockedUsers.splice(index, 1);
        this.loaderService.dismissLoader();
        let alertControl = this.alertCtrl.create({
          title: this.translateService.instant('ERROR_MESSAGES.UNBLOCK_SUCCESS'),
          buttons: [{
            text: this.translateService.instant('MISC.OK')
          }],
          enableBackdropDismiss: false,
          cssClass: 'alert-single'
        });
        alertControl.present();
        this.notifyBlockedUser(user);
        this.events.publish(CONSTANTS.APP_EVENTS.REFRESH_CONVERSATION);
      } else {
        this.loaderService.dismissLoader();
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
      }
      // Do not dismiss loader as we will be doint in conversation screen 
      // this.loaderService.dismissLoader();

    });
  }

  notifyBlockedUser(user: IBlockedUser) {
    let stateObj: IConnectionStatusChangeState = {
      _id: user.shared_channel,
      name: user.first_name,
      connection_status: CONSTANTS.CONNECTION_STATUS.CONNECTED,
      action: CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED,
      connection_action: CONSTANTS.CONNECTION_STATUS.UNBLOCKED,
      connection_type: CONSTANTS.CONVERSATION_TYPE.SINGLE
    };
    this.pubNubService.setConnectionStatusChangeState(stateObj, [user.user_id]);
  }

}


