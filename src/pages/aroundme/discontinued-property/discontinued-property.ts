import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { IProviderDetails, ProviderService, IDisconnectPropertyRequest } from "../provider-service";
import { CONSTANTS } from "../../../shared/config";
import { IUpdateProviderConnectionRequestParams, ChatService } from "../../conversations/chat-service";
import { LoaderService } from "../../../providers/loader-service";
import { UserService } from "../../../providers/user-service";
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";
import { PubNubService } from "../../../providers/pubnub-service";


@Component({
  selector: 'page-discontinued-property',
  templateUrl: 'discontinued-property.html'
})
export class DiscontinuedProperty {
  buildingId: string;
  buildingAddress: string;
  providerDetails: IProviderDetails;
  constructor(public navCtrl: NavController, private navParams: NavParams, private chatService: ChatService,
    private analyticsService: AnalyticsService, private translateService: TranslateService, public pubNubService: PubNubService,
    private loaderService: LoaderService, private providerService: ProviderService, private userService: UserService) {
    this.buildingId = this.navParams.get('buildingId');
    this.buildingAddress = this.navParams.get('buildingAddress');
    this.providerDetails = this.navParams.get('providerDetails');
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.DISCONTINUE_PROPERTY);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.DISCONTINUE_PROPERTY);
  }

  disconnect() {
    let that = this;
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    if (that.providerDetails.verification_status === CONSTANTS.VERIFICATION_STATUS.UNVERIFIED) {
      if (!this.providerDetails.conversation) {
        this.providerService.findPropertyById({ _id: that.providerDetails._id, user_id: this.userService.userObj.user_id, building_id: this.buildingId }).subscribe((response) => {
          if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
            //this.providerDetails = response.property[0];
            //this.providerDetails.conversation = response.property[0].conversation;
            Object.assign(this.providerDetails, { conversation: response.property[0].conversation });
            //TODO - Add event in the portal to handle this Added a temp fix for managing change in verfication state 
            if (response.property[0].verification_status === CONSTANTS.VERIFICATION_STATUS.UNVERIFIED) {
              this.disconnectUnverified();
            } else {
              this.disconnectVerified();
            }
          }
        });
      } else {
        this.disconnectUnverified();
      }
    } else {
      this.disconnectVerified();
    }
  }

  disconnectUnverified() {
    let updateGroupRequest: IUpdateProviderConnectionRequestParams;
    let disconnectRequest: IDisconnectPropertyRequest;
    let that = this;
    updateGroupRequest = {
      shared_channel: this.providerDetails.conversation.shared_channel,
      user_id: this.providerDetails.conversation.user_id,
      connection_status: CONSTANTS.CONNECTION_STATUS.IGNORE,
      is_advocate: this.providerDetails.is_advocate
    }
    this.chatService.updateProviderConnectionStatus(updateGroupRequest).subscribe((response) => {
      if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        disconnectRequest = {
          user_id: that.providerDetails.conversation.user_id,
          provider_location_id: that.providerDetails._id,
          building_id: that.buildingId,
          building_address: that.buildingAddress,
          is_address_verified: false,
          is_disconnect: true,
          is_advocate: that.providerDetails.is_advocate,
          unit: that.providerDetails.resident_unit || ''
        }
        that.notifyAdmin();
        that.providerService.updatePeopleLiveInProperty(disconnectRequest).subscribe((disconnectResponse) => {
          that.loaderService.dismissLoader();
          if (disconnectResponse.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
            that.providerDetails.verification_status = undefined;
            that.userService.isProfileUpdate = true;
            that.navCtrl.pop();            
          } else {
            that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
          }
        });
      } else {
        that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
        that.loaderService.dismissLoader();
      }
    });
  }

  notifyAdmin() {
    let membersList: Array<string>  = [];
    this.providerDetails.conversation.members.forEach((member) => {
      membersList = membersList.concat(member.user_id);
    }
    );
    this.pubNubService.setUserStateGroup(membersList, CONSTANTS.USER_STATES.VERIFICATION_CANCEL, this.providerDetails.conversation.shared_channel,
      this.providerDetails.conversation.name);
  }

  disconnectVerified() {
    let that = this;
    let disconnectRequest: IDisconnectPropertyRequest;
    disconnectRequest = {
      user_id: that.userService.userObj.user_id,
      provider_location_id: that.providerDetails._id,
      building_id: that.buildingId,
      building_address: that.buildingAddress,
      is_address_verified: false,
      is_disconnect: true,
      is_advocate: that.providerDetails.is_advocate,
      unit: that.providerDetails.resident_unit || ''
    }
    that.providerService.updatePeopleLiveInProperty(disconnectRequest).subscribe((disconnectResponse) => {
      that.loaderService.dismissLoader();
      if (disconnectResponse.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        that.providerDetails.verification_status = undefined;
        that.userService.isProfileUpdate = true;
        that.navCtrl.pop();
      } else {
        that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
      }
    });
  }

  cancelDisconnect() {
    this.navCtrl.pop();
  }

}