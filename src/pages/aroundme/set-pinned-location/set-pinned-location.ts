import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { AroundMeService, IPinLocation } from '../aroundme-service';
import { UserService, IUser, IHomeAddress } from '../../../providers/user-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";
@Component({
  selector: 'page-set-pinned-location',
  templateUrl: 'set-pinned-location.html'
})
export class SetPinnedLocation {
  public pinedLocation: IPinLocation;
  public AddressType: Array<{name:string,value:string}>;
  public locationName: string;
  private userObj: IUser;

  constructor(public navCtrl: NavController, private navParams: NavParams, private loaderService: LoaderService, private analyticsService: AnalyticsService,
    private translateService: TranslateService,  
    private userService: UserService, private aroundMeService: AroundMeService, private alertCtrl: AlertController) {
    this.AddressType = [{name:this.translateService.instant("AROUND_ME.ADDRESS_TYPE.HOME"),value:'Home'},
                        {name:this.translateService.instant("AROUND_ME.ADDRESS_TYPE.WORK"),value:'Work'},
                        {name:this.translateService.instant("AROUND_ME.ADDRESS_TYPE.OTHER"),value:'Other'}]
    this.locationName = '';
    this.userObj = {
      _id: userService.userObj.user_id
    };
    this.pinedLocation = this.navParams.get('selectedlocation');
  }

  ionViewDidLoad() {

  }
  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.SET_PIN_LOCATION);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.SET_PIN_LOCATION);
    if (this.userService.getUserProfile() !== undefined && this.userService.getUserProfile() !== null) {
      this.userObj = this.userService.getUserProfile();
    } else {
      this.loaduserProfileData();
    }
  }

  loaduserProfileData(): void {
    let that = this;
    this.userService.getUserById(this.userObj._id).subscribe((response: any) => {
      if (response.status !== 'ERROR') {
        this.userObj = response.user;
        Object.assign(this.userObj, { _id: this.userObj.user_id });
      } else {
        let alert = that.alertCtrl.create({
          subTitle: that.translateService.instant('ERROR_MESSAGES.APP_VERSION_UPDATED'),
          buttons: [{
            text: this.translateService.instant('CONVERSATIONS.OK'),
            handler: () => {
              that.userService.logout();
            }
          }],
          enableBackdropDismiss: false,
          cssClass: 'alert-single'
        });
        alert.present();
      }
    }, error => {
      this.loaderService.showToaster(error);
      this.loaderService.dismissLoader();
    })
  }


  saveDropPin(): void {
    let that = this;
    //console.log(" that.pinedLocation.name", that.pinedLocation);
    if (that.pinedLocation !== undefined && that.pinedLocation.position !== undefined) {
      if (that.locationName !== 'Other') {
        that.pinedLocation.name = that.locationName;
      }
      let params = {
        user_id: that.userObj._id,
        name: that.pinedLocation.name,
        address: that.pinedLocation.address,
        address_type: that.locationName,
        lat: that.pinedLocation.position.lat,
        long: that.pinedLocation.position.lng,
        zipcode: that.pinedLocation.zipcode,
        state: that.pinedLocation.state,
        city: that.pinedLocation.city
      };
      let userAddress: IHomeAddress = that.setUserAddress();
      let pinnedAddress: IUser = { "_id": that.userObj._id, profile: that.userObj.profile };
      if (that.pinedLocation.name == 'Home') {
        Object.assign(pinnedAddress.profile, { home_address: userAddress });
      } else if (that.pinedLocation.name == 'Work') {
        Object.assign(pinnedAddress.profile, { work_address: userAddress });
      }
      // // console.log("PinnedAddress --->>", pinnedAddress);
      // if(that.pinedLocation.name)

      if (that.pinedLocation.name) {
        that.loaderService.createLoader(that.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));

        that.userService.updateUserInfo(pinnedAddress).subscribe((res: any) => {
          if (res.status !== 'ERROR') {
            that.loaderService.dismissLoader();
            //let userObj = that.userService.getUserProfile();
            that.userObj.profile = pinnedAddress.profile;
            that.userService.setUserProfile(that.userObj);
            that.aroundMeService.addDropPinLocation(params).subscribe(result => {
              // reset pinked location
              that.pinedLocation = {
                name: '',
                address: '',
                position: { lat: 0, lng: 0 }
              };
            }, error => {
              that.loaderService.showToaster(error);
              that.loaderService.dismissLoader();
            });
            that.navCtrl.pop();
          } else {
            that.loaderService.showToaster(res.messsage);
            that.loaderService.dismissLoader();
          }
        }, error => {
          that.loaderService.dismissLoader();
          that.loaderService.showToaster(error);
        });
      } else {
        let alert = that.alertCtrl.create({
          title: that.translateService.instant('ERROR_MESSAGES.ERROR_TITLE'),          
          subTitle: that.translateService.instant('ERROR_MESSAGES.LOCATION_NAME_BLANK'),
          buttons: [{
            text: this.translateService.instant('MISC.OK')
          }],
          enableBackdropDismiss: false,
          cssClass: 'alert-single'
        });
        alert.present();
      }
    } else {
      let alert = that.alertCtrl.create({
        title: that.translateService.instant('ERROR_MESSAGES.ERROR_TITLE'),
        subTitle: that.translateService.instant('ERROR_MESSAGES.SELECT_LOCATION'),
        buttons: [{
            text: this.translateService.instant('MISC.OK')
          }],
        enableBackdropDismiss: false,
        cssClass: 'alert-single'
      });
      alert.present();
    }

  }


  setUserAddress(): IHomeAddress {
    let userAddress: IHomeAddress = {
      street_address1: '',
      city: '',
      state: '',
      zipcode: '',
      place_id: ''
    };

    userAddress.street_address1 = this.pinedLocation.address;

    if (this.pinedLocation.city) {
      userAddress.city = this.pinedLocation.city;
    } else {
      userAddress.city = '';
    }
    if (this.pinedLocation.zipcode) {
      userAddress.zipcode = this.pinedLocation.zipcode;
    } else {
      userAddress.zipcode = '';
    }
    if (this.pinedLocation.state) {
      userAddress.state = this.pinedLocation.state;
    } else {
      userAddress.state = '';
    }
    userAddress.place_id = this.pinedLocation.place_id;
    return userAddress;
  }
}
