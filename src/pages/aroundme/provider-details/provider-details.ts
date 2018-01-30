import { Component } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';

import { IGenericResponse } from '../aroundme-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { UserService } from "../../../providers/user-service";
import { VerifyAddress } from "../verify-address/verify-address";
import { HousingUnit } from "../housing-unit/housing-unit";
import { DiscontinuedProperty } from '../discontinued-property/discontinued-property';
import { IProviderDetails, IFollowProviderRequest, ProviderService, IFavProviderRequest } from "../provider-service";
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'page-provider-details',
  templateUrl: 'provider-details.html'
})
export class ProviderDetails {
  private providerId: string;
  private buildingId: string;
  private buildingAddress: string;
  public providerDetails: IProviderDetails;
  public isClosed: boolean = false;
  public isFollowing: boolean = false;
  public isFavorite: boolean = false;
  public showConnect: boolean = true;
  public hoursOfOperationCount: number = 0;
  public userType = CONSTANTS.USER_TYPE;
  constructor(private loaderService: LoaderService, private providerService: ProviderService,
    private analyticsService: AnalyticsService, private navCtrl: NavController, private navParams: NavParams,
    public events: Events, private translateService: TranslateService, private userService: UserService) {
    this.providerId = this.navParams.get('providerId');
    this.buildingId = this.navParams.get('buildingId');
    this.buildingAddress = this.navParams.get('buildingAddress')
    this.showConnect = this.navParams.get('showConnect');
    this.providerDetails = {
      _id: '',
      about: '',
      public_name: '',
      profile_pic: '',
      location_type: '',
      banners: null,
      location: null,
      hours_of_operation: null,
      service_interests: null,
      is_favorite: false,
      is_following: false,
      is_advocate: false,
      resident_unit: ''
    };
  }

  ionViewDidLoad() {
    //console.log('Hello ProviderDetails Page');
    if (this.providerId) {
      this.getProviderDetails(this.providerId);
    }
    this.initPresenceEvent();
  }
  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.PROVIDER_DETAIL);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.PROVIDER_DETAIL, this.providerDetails.location_type);
  }

  ionViewWillUnload() {
    this.events.unsubscribe(CONSTANTS.APP_EVENTS.PROVIDER_PRESENCE_EVENT);
  }

  initPresenceEvent(): void {
    this.events.subscribe(CONSTANTS.APP_EVENTS.PROVIDER_PRESENCE_EVENT, (presence) => {
      if (presence.state.connection_action) {
        this.handleProviderConnectionStatus(presence);
      }
    });
  }

  handleProviderConnectionStatus(presence) {
    if (presence.state.connection_action === CONSTANTS.CONNECTION_STATUS.CONNECTED) {
      this.loaderService.showToaster(this.translateService.instant("ERROR_MESSAGES.VERIFY_ADDRESS_SUCCESS"));
      this.getProviderDetails(this.providerId);
      //console.log(this.translateService.instant("ERROR_MESSAGES.VERIFY_ADDRESS_SUCCESS"));
    } else if (presence.state.connection_action === CONSTANTS.CONNECTION_STATUS.IGNORE) {
      this.loaderService.showToaster(this.translateService.instant("ERROR_MESSAGES.VERIFY_ADDRESS_DENY"));
      this.getProviderDetails(this.providerId);
      //console.log(this.translateService.instant("ERROR_MESSAGES.VERIFY_ADDRESS_DENY"));
    }
  }

  getProviderDetails(providerId: string) {
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.providerService.findPropertyById({ _id: providerId, user_id: this.userService.userObj.user_id, building_id: this.buildingId }).subscribe((response) => {
      this.loaderService.dismissLoader();
      if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        this.providerDetails = response.property[0];
        //Set default value
        this.isFavorite = this.providerDetails.is_favorite || false;
        this.isFollowing = this.providerDetails.is_following || false;
        this.updateWorkingStatus(this.providerDetails);
      }
    }, error => {
      this.loaderService.dismissLoader();
      this.loaderService.showToaster(error);
    });
  }

  updateWorkingStatus(providerDetails: IProviderDetails) {
    let hours_of_operation = providerDetails.hours_of_operation;
    let today, weekday, currentDate, statDate, endDate;
    let start_time, start_hour, start_min, start_period;
    let end_time, end_hour, end_min, end_period;

    currentDate = new Date();
    statDate = new Date();
    endDate = new Date();

    weekday = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    today = weekday[currentDate.getDay()].toLowerCase();

    if (hours_of_operation && hours_of_operation[today] !== undefined) {
      start_time = hours_of_operation[today].start_time;
      start_hour = parseInt(start_time.substring(0, 2));
      start_min = start_time.substring(3, 5);
      start_period = start_time.substring(5, 7).toUpperCase();

      end_time = hours_of_operation[today].end_time;
      end_hour = parseInt(end_time.substring(0, 2));
      end_min = end_time.substring(3, 5);
      end_period = end_time.substring(5, 7).toUpperCase();

      if (start_period === 'PM') {
        start_hour += 12;
      }

      if (end_period === 'PM') {
        end_hour += 12;
      }

      statDate.setHours(start_hour);
      statDate.setMinutes(start_min);

      endDate.setHours(end_hour);
      endDate.setMinutes(end_min);

      if (statDate.getTime() <= currentDate.getTime() && currentDate.getTime() <= endDate.getTime()) {
        this.isClosed = false;
      } else {
        this.isClosed = true;
      }
      this.hoursOfOperationCount = Object.keys(this.providerDetails.hours_of_operation).length;
    }
  }

  addressVerification(isAdvocate: boolean) {
    // case 1 - Select Building 
    if (this.providerDetails.is_single_house_owner) {
      //case 2 - Single home 
      this.navCtrl.push(VerifyAddress, { providerDetails: this.providerDetails, buildingId: this.buildingId, isAdvocate: isAdvocate, buildingAddress: this.buildingAddress });
    } else {
      //case 3 - sigle building / property multiple unit.          
      this.navCtrl.push(HousingUnit, { buildingId: this.buildingId, providerDetails: this.providerDetails, units: this.providerDetails.units, isAdvocate: isAdvocate, buildingAddress: this.buildingAddress });
    }
  }


  toggleFollow(isFollowing) {
    let request: IFollowProviderRequest = {
      user_id: this.userService.userObj.user_id,
      provider_location_id: this.providerDetails._id,
      is_following: !isFollowing,
      provider_name: this.providerDetails.public_name
    };
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.providerService.toggleFollowStatus(request).subscribe((response: IGenericResponse) => {
      if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        this.isFollowing = this.providerDetails.is_following = !isFollowing;
      } else if (response.status === CONSTANTS.RESPONSE_STATUS.ERROR) {

      }
      this.loaderService.dismissLoader();
    });
  }

  toggleFavorite() {
    if (this.isFavorite !== this.providerDetails.is_favorite) {
      let request: IFavProviderRequest = {
        user_id: this.userService.userObj.user_id,
        provider_location_id: this.providerDetails._id,
        is_favorite: this.isFavorite,
        provider_name: this.providerDetails.public_name
      }

      this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
      this.providerService.toggleFavoriteStatus(request).subscribe((response: IGenericResponse) => {
        if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {

        } else if (response.status === CONSTANTS.RESPONSE_STATUS.ERROR) {

        }
        this.loaderService.dismissLoader();
      });
    }
  }

  discontinued() {
    this.navCtrl.push(DiscontinuedProperty, { providerDetails: this.providerDetails, buildingId: this.buildingId, buildingAddress: this.buildingAddress });
  }

}


