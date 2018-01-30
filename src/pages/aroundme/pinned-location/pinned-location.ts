import { Component } from '@angular/core';
import { Events, NavController, ItemSliding } from 'ionic-angular';
import { AroundMeService, IPinLocation } from '../aroundme-service';
import { UserService, IUser, IHomeAddress } from '../../../providers/user-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { EditLocation } from "../edit-location/edit-location";
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'page-pinned-location',
  templateUrl: 'pinned-location.html'
})

export class PinnedLocation {
  public pinedLocations: Array<IPinLocation>;
  public isPinnedLocationAPICall: boolean = false;
  private userObj: IUser;
  constructor(private userService: UserService, private aroundMeService: AroundMeService, private analyticsService: AnalyticsService, private translateService: TranslateService,
    private events: Events, public navCtrl: NavController, private loaderService: LoaderService) {
    this.pinedLocations = [];
    this.userObj = {
      _id: userService.userObj.user_id
    };
  }

  loadMapByPinedLocation(pinLocation?: IPinLocation): void {
    this.navCtrl.pop().then(() => {
      this.events.publish(CONSTANTS.APP_EVENTS.ARROUND_YOU_ACTIONS, CONSTANTS.ARROUND_YOU_ACTIONS.SELECT_SAVED_PIN, pinLocation);
    });
  }

  ionViewDidLoad() {
    // console.log('Hello PinnedLocation Page');
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.MY_PINNED_LOCATION);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.MY_PINNED_LOCATION);
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.isPinnedLocationAPICall = false;
    this.aroundMeService.getPinedLocations({ user_id: this.userService.userObj.user_id }).subscribe((results: any) => {
      if (results.pin_locations && results.pin_locations.length > 0) {
        results.pin_locations.map((pinedLocation) => {
          pinedLocation['position'] = { lat: pinedLocation.lat, lng: pinedLocation.long };
        });
      }
      this.pinedLocations = results.pin_locations;
      this.pinedLocations.sort(function (a, b) { return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0); });
      this.isPinnedLocationAPICall = true;
      this.loaderService.dismissLoader();
    }, error => {
      this.loaderService.showToaster(error);
      this.loaderService.dismissLoader();
    });

    this.loadUserProfile();
  }

  loadUserProfile() {
    if (this.userService.getUserProfile() !== undefined && this.userService.getUserProfile() !== null) {
      this.userObj = this.userService.getUserProfile();
    } else {
      this.userService.getUserById(this.userObj._id).subscribe((response: any) => {
        if (response.status !== 'ERROR') {
          this.userObj = response.user;
          Object.assign(this.userObj, { _id: this.userObj.user_id });
        }
      });
    }
  }


  edit(pinnedLocation: IPinLocation, slidingItem: ItemSliding, index: number) {
    pinnedLocation.user_id = this.userService.userObj.user_id;
    slidingItem.close();
    this.navCtrl.push(EditLocation, { pinnedLocation: pinnedLocation });
    //navigate to new page for edit address
  }

  delete(pinnedLocation: IPinLocation, slidingItem: ItemSliding, position: number) {
    slidingItem.close();
    pinnedLocation.user_id = this.userService.userObj.user_id;
    //console.log(pinnedLocation);
    if (pinnedLocation.address_type === 'Home' || pinnedLocation.address_type === 'Work') {
      this.updateUserProfile(pinnedLocation);
    }
    this.aroundMeService.deletePinLocation(pinnedLocation).subscribe((response) => {
      //console.log(response);
      if (response.status == CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        this.pinedLocations.splice(position, 1);
      } else {
        this.loaderService.showToaster(response.message);
      }
    }
    );
  }

  updateUserProfile(pinedLocation: IPinLocation) {
    let userAddress: IHomeAddress = {
      street_address1: '',
      city: '',
      state: '',
      zipcode: pinedLocation.zipcode,
      place_id: ''
    };
    let pinnedAddress: IUser = { "_id": this.userService.userObj.user_id, profile: this.userService.userObj.profile };
    if (pinedLocation.address_type === 'Home') {
      Object.assign(pinnedAddress.profile, { home_address: userAddress });
    } else if (pinedLocation.address_type === 'Work') {
      Object.assign(pinnedAddress.profile, { work_address: userAddress });
    }
    this.userService.updateUserInfo(pinnedAddress).subscribe((res: any) => {
      if (res.status !== 'ERROR') {
        //let userObj = that.userService.getUserProfile();
        this.userObj.profile = pinnedAddress.profile;
        this.userService.setUserProfile(this.userObj);
      }
    });
  }
}

