import { Component } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';

import { GroupChat } from '../group-chat/group-chat';
import { PubNubService } from '../../../providers/pubnub-service';
import { UserService, IUser } from '../../../providers/user-service';
import { ChatService, IConversation, IGetGroupDetailsRequest } from '../chat-service';
import { CONSTANTS } from '../../../shared/config';
import { LoaderService } from '../../../providers/loader-service';
import { PublicProfile } from "../public-profile/public-profile";
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";


@Component({
  selector: 'page-conversation-setting',
  templateUrl: 'conversation-setting.html'
})
export class ConversationSetting {
  public userData: IUser;
  public selectedUser: IConversation;
  public groupType: string = CONSTANTS.CONVERSATION_TYPE.GROUP;
  public placeholderIamges = CONSTANTS.PLACEHOLDER_IMAGES;

  constructor(public navCtrl: NavController, private navParams: NavParams, private pubNubService: PubNubService, private translateService: TranslateService,
    private userService: UserService, private chatService: ChatService, public events: Events, private analyticsService: AnalyticsService,
    private loaderService: LoaderService) {
    this.selectedUser = this.navParams.get('selectedUser');
    if (this.selectedUser.type !== CONSTANTS.CONVERSATION_TYPE.SINGLE) {
      this.selectedUser = JSON.parse(JSON.stringify(this.navParams.get('selectedUser')));
      this.selectedUser.members = [];
    }
    this.userData = this.userService.getUser();
    this.initConservsationSettings(this.selectedUser);
    this.initRefreshEvent();
    this.initPresenceEvent();
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.CONVERSATION_SETTINGS);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.CONVERSATION_SETTINGS);
  }

  initRefreshEvent(): void {
    let that = this;
    that.events.subscribe(CONSTANTS.APP_EVENTS.REFRESH_GROUP_DETAILS, () => {
      //console.log('In ConversationSetting REFRESH_GROUP_DETAILS');
      that.initConservsationSettings(that.selectedUser);
    });
  }


  initConservsationSettings(user: IConversation) {
    if (user.type === this.groupType) {
      this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
      let params: IGetGroupDetailsRequest = {
        user_id: this.userData.user_id,
        shared_channel: user.shared_channel
      };
      this.chatService.getGroupDetails(params).subscribe((groupDetails) => {
        this.loaderService.dismissLoader();
        if (groupDetails.status == 'SUCCESS') {
          user = Object.assign(user, groupDetails.group_details);
          if (this.selectedUser.type === this.groupType && this.selectedUser.members.length > 0) {
            this.updatePresenceStatus();
          }
        }
      }, error => {
        this.loaderService.dismissLoader();
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
      });
    }
  }


  updatePresenceStatus(): void {
    let that = this;
    let channels: Array<string> = [];
    this.selectedUser.members.forEach((member) => {
      channels.push(member.user_id);
    });
    that.pubNubService.getUsersState(channels).then((data: any) => {
      if (data.channels) {
        that.selectedUser.members.forEach((member) => {
          member.presence = data.channels[member.user_id] ? "online" : "";
        });
      }
      // console.log("---", that.selectedUser.members);
    });
  }

  openGroupChat() {
    if (this.selectedUser.leaving_time_token !== undefined && this.selectedUser.leaving_time_token > 0) {
      this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.GRP_EDIT_ERROR_MSG'));
      // console.log(this.translateService.instant('ERROR_MESSAGES.GRP_EDIT_ERROR_MSG'));
    } else {
      this.navCtrl.push(GroupChat, { selectedGroup: this.selectedUser });
    }
  }

  changeNotitficationStatus() {
    let params = { _id: this.selectedUser._id, notification: this.selectedUser.notification };
    let that = this;
    this.chatService.changePushNotificationSetting(params).subscribe((response) => {
      //// console.log('In changeNotitficationStatus', response);
      if (that.selectedUser.notification) {
        that.pubNubService.removePushNotifcationChannel(that.selectedUser.shared_channel);
        that.pubNubService.unRegisterDevice([that.selectedUser.shared_channel], that.userService.deviceToken, that.userService.pushPlatform)
      } else {
        that.pubNubService.setPushNotificationChannels([that.selectedUser.shared_channel]);
        that.pubNubService.registerDevice([that.selectedUser.shared_channel], that.userService.deviceToken, that.userService.pushPlatform)
      }
    }, error => {
      this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
    });
  }

  initPresenceEvent(): void {
    let that = this;
    that.events.subscribe(CONSTANTS.APP_EVENTS.GROUP_SETTING_PRESENCE_EVENT, (presence) => {
      //Set user online status.
      //let presenceObj = presence[0];
      // console.log('In subscribePresenceEvent[ action - ' + presenceObj.action + ']', presenceObj);
      if (that.selectedUser.members && that.selectedUser.members.length > 0) {
        that.selectedUser.members.forEach((member) => {
          if (presence.uuid === member.user_id && presence.actualChannel === member.user_id + CONSTANTS.PRESENCE_POSTFIX) {
            if (presence.action == "join") {
              member.presence = "online";
            }
            else if (presence.action == "leave") {
              member.presence = "";
            }
          }
        });
      }
    });
  }

  ionViewWillUnload() {
    // console.log("conversation-setting- Looks like I'm about to ionViewWillUnload :(");
    this.events.unsubscribe(CONSTANTS.APP_EVENTS.GROUP_SETTING_PRESENCE_EVENT);
    this.events.unsubscribe(CONSTANTS.APP_EVENTS.REFRESH_GROUP_DETAILS);

  }

  openProfile(member: IConversation, position: number) {
    if (this.selectedUser.type === CONSTANTS.CONVERSATION_TYPE.SINGLE) {
      this.navCtrl.push(PublicProfile, { user: member });
    } else {
      this.navCtrl.push(PublicProfile, { user: member, groupDetails: this.selectedUser, memberIndex: position });
    }
  }
}
