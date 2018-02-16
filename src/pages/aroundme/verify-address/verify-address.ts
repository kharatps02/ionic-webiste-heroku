import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { PendingConfirmation } from "../pending-confirmation/pending-confirmation";
import { CONSTANTS } from "../../../shared/config";
import { IGroup, ChatService } from "../../conversations/chat-service";
import { LoaderService } from "../../../providers/loader-service";
import { PubNubService } from "../../../providers/pubnub-service";
import { IUser, UserService } from "../../../providers/user-service";
import { ProviderService, IProviderDetails, IConnectPMRequest } from "../provider-service";
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";


@Component({
      selector: 'page-verify-address',
      templateUrl: 'verify-address.html'
})

export class VerifyAddress implements OnInit {
      public providerDetails: IProviderDetails;
      public isAddressValid: boolean;
      public userData: IUser;
      public buildingId: string;
      public buildingAddress: string;
      public buildingName: string;
      public unit: string;
      public isAdvocate: boolean;
      constructor(private loaderService: LoaderService, private navCtrl: NavController, private navParams: NavParams, private userService: UserService,
            private providerService: ProviderService, private analyticsService: AnalyticsService, private translateService: TranslateService,
            public chatService: ChatService, public pubNubService: PubNubService) {
            this.buildingId = this.navParams.get('buildingId');
            this.buildingAddress = this.navParams.get('buildingAddress');
            this.isAdvocate = this.navParams.get('isAdvocate') || false;
            this.providerDetails = this.navParams.get('providerDetails');
            this.isAddressValid = false;
            this.userData = this.userService.getUser();
            this.unit = '';
      }

      ngOnInit() {
      }

      ionViewDidEnter() {
            this.userService.setCurrentPage(CONSTANTS.PAGES.VERIFY_ADDRESS);
            this.analyticsService.trackScreenView(CONSTANTS.PAGES.VERIFY_ADDRESS);
      }
      ionViewDidLoad() {
      }

      verifyHomeAddress() {
            this.providerDetails.verification_status = CONSTANTS.VERIFICATION_STATUS.UNVERIFIED;
            this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
            this.openGroupChatBox(this.providerDetails, () => {
                  let request: IConnectPMRequest;
                  request = {
                        user_id: this.userData.user_id,
                        provider_location_id: this.providerDetails._id,
                        building_id: this.buildingId,
                        building_address: this.buildingAddress,
                        unit: this.unit,
                        first_name: this.userData.profile.first_name,
                        last_name: this.userData.profile.last_name,
                        is_advocate: this.isAdvocate
                  }
                  this.providerService.connectToPropertyManager(request).subscribe((response) => {
                        if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
                              this.loaderService.dismissLoader();
                              this.navCtrl.push(PendingConfirmation);
                        } else {
                              this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
                        }
                  });
            });
      }

      openGroupChatBox(providerDetails: IProviderDetails, connectToPropertyManagerCallback) {
            let that = this, groupObject: IGroup, memberIds: Array<string> = [];
            that.pubNubService.getTimeToken((timestamp) => {

                  if (providerDetails.provider_details) {
                        providerDetails.provider_details.forEach(provider => {
                              memberIds.push(provider._id);
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
                        group_type: CONSTANTS.USER_TYPE.HOUSING_PROVIDER,
                        user_name: that.userData.user_name,
                        created_by: that.userData.user_id,
                        profile_pic: providerDetails.profile_pic,
                        resident_profile_pic: that.userData.profile.profile_pic,
                        is_advocate: this.isAdvocate,
                        verification_address: this.providerDetails.location.street_address1 + ' . Unit: ' + this.unit,
                        location_id: providerDetails._id
                  };
                  that.chatService.createOrEditConversation(groupObject, false).subscribe((result) => {
                        if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
                              let messagePrefixStr;
                              if (this.isAdvocate) {
                                    messagePrefixStr = CONSTANTS.MESSAGES.ADVOCATE_VERIFICATION_PREFIX;
                              } else {
                                    messagePrefixStr = CONSTANTS.MESSAGES.VERIFICATION_PREFIX;
                              }
                              let addressStr = that.providerDetails.location.street_address1;
                              if (that.unit.trim().length > 0) {
                                    addressStr += ' . Unit: ' + that.unit;
                              }

                              that.providerService.sendInvitationMessageToAdmin(groupObject, messagePrefixStr, addressStr);
                              if (groupObject.members && groupObject.members.length > 0) {
                                    that.pubNubService.setUserStateGroup(groupObject.members, CONSTANTS.USER_STATES.VERIFICATION_REQUEST,
                                          groupObject.shared_channel, groupObject.name);
                              }
                              if (that.pubNubService.pushNotificationChannels.indexOf(groupObject.shared_channel) === -1) {
                                    that.pubNubService.setPushNotificationChannels([groupObject.shared_channel]);
                                    if (!!that.userService.userObj.notification_enabled) {
                                          that.pubNubService.registerDevice([groupObject.shared_channel], that.userService.deviceToken, that.userService.pushPlatform);
                                    }
                              }
                              if (connectToPropertyManagerCallback) {
                                    connectToPropertyManagerCallback();
                              }
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

}