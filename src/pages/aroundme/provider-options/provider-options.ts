import { Component, Input } from '@angular/core';
import { NavController } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { CallNumber } from '@ionic-native/call-number';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { ChatBox } from '../../conversations/chat-box/chat-box';
import { UserService, IUser } from '../../../providers/user-service';
import { ChatService, IConversation, IGroup } from '../../conversations/chat-service';
import { PubNubService } from '../../../providers/pubnub-service';
import { IProviderDetails } from "../provider-service";
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'provider-options',
  templateUrl: 'provider-options.html'
})
export class ProviderOptions {
  public userData: IUser;
  @Input() providerDetails: IProviderDetails; NavParams
  constructor(private inAppBrowser: InAppBrowser, private callNumber: CallNumber, private analyticsService: AnalyticsService,
    private loaderService: LoaderService, private navCtrl: NavController, private userService: UserService,
    private translateService: TranslateService, public chatService: ChatService, public pubNubService: PubNubService) {
    this.userData = this.userService.getUser();
  }

  ionViewDidLoad() {
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.PROVIDER_OPTIONS);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.PROVIDER_OPTIONS);
  }

  sendMessageToProvider(providerDetails: IProviderDetails) {
    if (providerDetails.conversation !== undefined) {
      providerDetails.conversation.user_name = providerDetails.conversation.name;
      this.navCtrl.push(ChatBox, { user: providerDetails.conversation })
    } else {
      this.openGroupChatBox(providerDetails);
    }
  }

  openGroupChatBox(providerDetails: IProviderDetails) {
    let that = this, groupObject: IGroup, conversationObj: IConversation, memberIds: Array<string> = [];
    that.loaderService.createLoader(that.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    that.pubNubService.getTimeToken((timestamp) => {

      if (providerDetails.provider_details) {
        providerDetails.provider_details.map(self => {
          memberIds.push(self._id);
          self['user_id'] = self._id;
          return self;
        });
      }

      groupObject = {
        user_id: that.userData.user_id,
        name: providerDetails.public_name,
        shared_channel: that.userData.user_id + '_' + providerDetails._id,
        members: memberIds,
        type: CONSTANTS.CONVERSATION_TYPE.GROUP,
        joining_time_token: timestamp,
        leaving_time_token: null,
        group_type: CONSTANTS.USER_TYPE.SERVICE_PROVIDER,
        user_name: that.userData.user_name,
        created_by: that.userData.user_id,
        profile_pic: providerDetails.profile_pic,
        resident_profile_pic: that.userData.profile.profile_pic,
        location_id : providerDetails._id
      };

      that.chatService.createOrEditConversation(groupObject, false).subscribe((result) => {
        if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
          conversationObj = {
            name: groupObject.name,
            user_name: groupObject.name,
            user_id: groupObject.shared_channel,
            shared_channel: groupObject.shared_channel,
            receiver_id: groupObject.shared_channel,
            members: providerDetails.provider_details,
            type: groupObject.type,
            timetoken: timestamp,
            group_type: groupObject.group_type,
            connection_status: CONSTANTS.CONNECTION_STATUS.CONNECTED
          };

          if (that.pubNubService.pushNotificationChannels.indexOf(groupObject.shared_channel) === -1) {
            if (groupObject.members && groupObject.members.length > 0) {
              that.pubNubService.addChanneltoGroup(groupObject.members, groupObject.shared_channel, groupObject.name, that.userService.userObj.user_id,that.userService.deviceToken, that.userService.pushPlatform);
            }
            that.pubNubService.setPushNotificationChannels([groupObject.shared_channel]);
            if (!!that.userService.userObj.notification_enabled) {
              that.pubNubService.registerDevice([groupObject.shared_channel], that.userService.deviceToken, that.userService.pushPlatform);
            }
          }
          conversationObj['joining_time_token'] = result.chat[0].joining_time_token;

          that.navCtrl.push(ChatBox, { user: conversationObj }).then(() => {
            that.loaderService.dismissLoader();
          });
        } else {
          that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
          that.loaderService.dismissLoader();
        }
      }, error => {
        that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
        that.loaderService.dismissLoader();
      });
    });
  }

  makeCall(providerDetails: IProviderDetails) {
    if (providerDetails.contacts && providerDetails.contacts.phone_number !== '') {
      this.callNumber.callNumber(providerDetails.contacts.phone_number, true).then(() => {
      }).catch((error) => {
        //console.log('Error launching dialer', error);
      })
    }
  }

  openWebsite(providerDetails: IProviderDetails) {
    //console.log('3 providerDetails=>', providerDetails);
    if (providerDetails.website) {
      this.inAppBrowser.create(providerDetails.website, "_blank", { location: 'no' });
    }
  }
}


