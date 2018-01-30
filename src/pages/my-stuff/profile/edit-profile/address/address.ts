import { Component, ViewChild, NgZone } from '@angular/core';
import { NavController, AlertController, NavParams, Navbar } from 'ionic-angular';
import { UserService, IUser } from '../../../../../providers/user-service';
import { LoaderService } from '../../../../../providers/loader-service';
import { CONSTANTS } from '../../../../../shared/config';
import { AroundMeService } from "../../../../aroundme/aroundme-service";
import { AnalyticsService } from "../../../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'page-address',
  templateUrl: 'address.html'
})
export class Address {
  @ViewChild(Navbar) navBar: Navbar;
  public addressObj: IUser;
  public userProfile: IUser;
  public modelModified: boolean = false;

  public autocompletePlaces: any;
  public query: string;


  constructor(public navCtrl: NavController, private userService: UserService, private loaderService: LoaderService,
    private zone: NgZone, private aroundMeService: AroundMeService, private analyticsService: AnalyticsService, private translateService: TranslateService,
    private alertCtrl: AlertController, private navParams: NavParams) {

    this.addressObj = {
      _id: this.userService.userObj.user_id,
      profile: {
        home_address: {
          street_address1: '',
          street_address2: '',
          city: '',
          state: '',
          zipcode: ''
        }
      }
    }
    if (this.navParams.get('userData') !== undefined) {
      this.userProfile = JSON.parse(JSON.stringify(this.navParams.get('userData')));
      this.addressObj.profile = this.userProfile.profile;
      this.query = this.addressObj.profile.home_address.street_address1
    }
  }



  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.ADDRESS_UPDATE);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.ADDRESS_UPDATE);
  }

  ionViewDidLoad() {
    // console.log('Hello Address Page');


    this.navBar.backButtonClick = (e: UIEvent) => {
      // console.log("BAck clicked");

      // todo something
      if (this.modelModified) {
        let alert = this.alertCtrl.create({
          title: this.translateService.instant('LOGIN.CONTINUE_SAVE'),
          buttons: [{
            text: this.translateService.instant('CONVERSATIONS.OK'),
            handler: () => {
              let navTransition = alert.dismiss();
              navTransition.then(() => {
                this.navCtrl.pop();
              });

              return false;
            }
          },
          {
            text: this.translateService.instant('CONVERSATIONS.CANCEL'),
            role: 'cancel',
            handler: data => {
              // console.log('Cancel clicked');
            }
          }],
          enableBackdropDismiss: false
        });
        alert.present();
      }
      else {
        this.navCtrl.pop();
      }
    }

  }


  saveToBackend(): void {
    if (this.modelModified) {
      let regex = new RegExp("^[0-9]{5}(?:-[0-9]{4})?$");
      if (regex.test(this.addressObj.profile.home_address.zipcode)) {
        this.addressObj.profile.home_address.verification_status = '';
        this.userProfile.profile = this.addressObj.profile;
        this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
        this.userService.updateUserInfo(this.userProfile).subscribe((res: any) => {
          if (res.status == 'SUCCESS') {
            this.navCtrl.pop();
            //this.userProfile.profile = this.addressObj.profile;
            this.userService.setTempUserProfileObj(this.userProfile);
            this.userService.setUserProfile(this.userProfile);
          } else {
            let alert = this.alertCtrl.create({
              title: this.translateService.instant('ERROR_MESSAGES.ERROR_TITLE'),
              subTitle: res.message,
              buttons: [{
                text: this.translateService.instant('MISC.DISMISS')
              }],
              enableBackdropDismiss: false,
              cssClass: 'alert-single'
            });
            alert.present();
          }
          this.loaderService.dismissLoader();
        }, error => {
          this.loaderService.showToaster(error);
          this.loaderService.dismissLoader();
        });
      } else {
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.ZIP_CODE_VALID'));
      }
    } else {
      this.navCtrl.pop();
    }
  }

  detectChange(e) {
    this.modelModified = true;
  }


  autocompletePlacesSearch() {
    // console.log("Onupdate called ",this.searchLocation.query )
    let that = this, searchObj = null, autocompletePlacesTemp: Array<any> = [];
    if (that.query == '') {
      // Clear results when no input is provided 
      that.autocompletePlaces = [];
      return;
    } else if (that.query.length < 3) {
      //To show results till the user clears the input
      return;
    }
    searchObj = { input: that.query };
    //, types: ['address'] , componentRestrictions: { country: 'US' }
    that.aroundMeService.getPlacePredictions(searchObj).subscribe((response: any) => {
      autocompletePlacesTemp = [];
      let places = response.places.predictions;
      if (places) {
        places.forEach(function (place) {
          autocompletePlacesTemp.push(place);
        });
        // apply result on autocompletePlaces object 
        that.zone.run(function () {
          that.autocompletePlaces = autocompletePlacesTemp;
        });
      } else {
        that.autocompletePlaces = [];
      }
    }, error => {
      this.loaderService.showToaster(error);
    });
  }

  onPlaceSelect(placeDetail): void {
    this.modelModified = true;
    this.autocompletePlaces = [];
    this.addressObj.profile.home_address.zipcode = '';
    this.addressObj.profile.home_address.street_address2 = '';
    this.query = placeDetail.description;
    this.aroundMeService.placeDetailById({ place_id: placeDetail.place_id }).subscribe((place: any) => {
      if (place.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        //this.query = place.location.address;
        this.addressObj.profile.home_address.street_address1 = place.location.address;
        this.addressObj.profile.home_address.zipcode = place.location.zipcode;
        this.addressObj.profile.home_address.city = place.location.city;
        this.addressObj.profile.home_address.state = place.location.state;
        this.addressObj.profile.home_address.place_id = placeDetail.place_id;
        this.addressObj.profile.home_address.lat = place.location.lat;
        this.addressObj.profile.home_address.long = place.location.long;
        // add marker on map 
      } else {
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.ADDRESS_NOT_FOUND'));
      }
    }, error => {
      this.loaderService.showToaster(error);
    });
  }
  hideAutoComplete(){
    this.autocompletePlaces = [];
  }
  

}
