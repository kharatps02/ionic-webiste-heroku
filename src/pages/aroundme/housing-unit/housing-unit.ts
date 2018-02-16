import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { LoaderService } from '../../../providers/loader-service';
import { PendingConfirmation } from '../pending-confirmation/pending-confirmation';
import { CONSTANTS } from "../../../shared/config";
import { PubNubService } from "../../../providers/pubnub-service";
import { ChatService, IGroup } from "../../conversations/chat-service";
import { IUser, UserService } from "../../../providers/user-service";
import { ProviderService, IConnectPMRequest, IProviderDetails } from "../provider-service";
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";


@Component({
  selector: 'page-housing-unit',
  templateUrl: 'housing-unit.html'
})
export class HousingUnit {
  isAdvocate: boolean;
  providerDetails: IProviderDetails;
  buildingId: string;
  buildingAddress: string;
  buildingName: string;
  unit: string;
  units: Array<string>;
  unfilteredUnits: Array<string>;
  public userData: IUser;

  constructor(private loaderService: LoaderService, private navCtrl: NavController, private navParams: NavParams, public chatService: ChatService,
    private providerService: ProviderService, private translateService: TranslateService,
    private userService: UserService, private analyticsService: AnalyticsService, public pubNubService: PubNubService) {
    this.buildingId = this.navParams.get('buildingId');
    this.buildingAddress = this.navParams.get('buildingAddress');
    this.providerDetails = this.navParams.get('providerDetails');
    this.unfilteredUnits = this.navParams.get('units');
    this.isAdvocate = this.navParams.get('isAdvocate') || false;

    this.buildingName = this.providerDetails.location.street_address1
    this.userData = this.userService.getUser();
    //this.units = this.unfilteredUnits;
    this.unit = '';
    //console.log("HousingUnit", this.providerDetails);
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.HOUSING_UNIT);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.HOUSING_UNIT);
  }

  autoCompleteUnitSearch() {
    let unit = this.unit.trim();
    let units = [];
    if (unit && unit.length > 0 && this.unfilteredUnits !== undefined) {
      units = JSON.parse(JSON.stringify(this.unfilteredUnits));
      units = units.filter((unit) => {
        return (unit.indexOf(this.unit) !== -1);
      });
    }
    this.units = units.sort(this.sortAlphaNum);
    //this.units = units.sort();
    // console.log(this.unit);
    // console.log(this.units);
  }

  onUnitSelect(unit) {
    this.unit = unit;
    this.units = [];
  }

  sortAlphaNum(a, b) {
    var reA = '/[^a-zA-Z]/g';
    var reN = '/[^0-9]/g';
    var AInt = parseInt(a, 10);
    var BInt = parseInt(b, 10);

    if (isNaN(AInt) && isNaN(BInt)) {
      var aA = a.replace(reA, "");
      var bA = b.replace(reA, "");
      if (aA === bA) {
        var aN = parseInt(a.replace(reN, ""), 10);
        var bN = parseInt(b.replace(reN, ""), 10);
        return aN === bN ? 0 : aN > bN ? 1 : -1;
      } else {
        return aA > bA ? 1 : -1;
      }
    } else if (isNaN(AInt)) {//A is not an Int
      return 1;//to make alphanumeric sort first return -1 here
    } else if (isNaN(BInt)) {//B is not an Int
      return -1;//to make alphanumeric sort first return 1 here
    } else {
      return AInt > BInt ? 1 : -1;
    }
  }
  verifyHomeAddress() {
    let that = this;
    if (this.unfilteredUnits.indexOf(this.unit) !== -1) {
      this.providerDetails.verification_status = CONSTANTS.VERIFICATION_STATUS.UNVERIFIED;
      this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
      this.openGroupChatBox(this.providerDetails, () => {
        let request: IConnectPMRequest;
        request = {
          user_id: that.userData.user_id,
          provider_location_id: that.providerDetails._id,
          building_id: that.buildingId,
          building_address: this.buildingAddress,
          unit: that.unit,
          first_name: that.userData.profile.first_name,
          last_name: that.userData.profile.last_name,
          is_advocate: this.isAdvocate
        }
        that.providerService.connectToPropertyManager(request).subscribe((response) => {
          if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
            that.loaderService.dismissLoader();
            that.navCtrl.push(PendingConfirmation);
          } else {
            that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
          }
        });
      });
    } else {
      that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.INVALID_UNIT_MESSAGE'), CONSTANTS.TOASTER.POSITION_CENTER);
    }

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
          let messagePrefixStr = CONSTANTS.MESSAGES.VERIFICATION_PREFIX;
          let addressStr = that.providerDetails.location.street_address1;
          if (this.isAdvocate) {
            messagePrefixStr = CONSTANTS.MESSAGES.ADVOCATE_VERIFICATION_PREFIX;
          }
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