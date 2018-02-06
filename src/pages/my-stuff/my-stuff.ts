import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NavController, Platform, AlertController, Content } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';
import { Profile } from './profile/profile';
import { Settings } from './settings/settings';
import { ServiceRequest } from '../../pages/service-request/service-request';

//import { FrequetlyAskedQustion } from './frequetly-asked-qustion/frequetly-asked-qustion';
import { TellFeedback } from './tell-feedback/tell-feedback';
import { UserService, IUser } from '../../providers/user-service';
import { AnalyticsService } from '../../providers/analytics-service';
import { LoaderService } from '../../providers/loader-service'
import { CONSTANTS } from '../../shared/config';
import { TranslateService } from "@ngx-translate/core";
import { ActivityPage } from "../activity/activity-feed";
declare let cordova;
@Component({
  selector: 'page-my-stuff',
  templateUrl: 'my-stuff.html'
})
export class MyStuff implements OnDestroy {
  public userObj: IUser;
  public usertype = CONSTANTS.USER_TYPE;
  @ViewChild(Content) content: Content;
  constructor(public navCtrl: NavController, public userService: UserService, private analyticsService: AnalyticsService,
    public platform: Platform, private alertCtrl: AlertController, private translateService: TranslateService,
    private loaderService: LoaderService, private keyboard: Keyboard) {
    this.resetUserObj();
    this.keyboard.close();
  }

  ionViewDidEnter() {
    this.content.resize();
    let tempUser = this.userService.getUserProfile();
    this.userService.setCurrentPage(CONSTANTS.PAGES.MY_STUFF);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.MY_STUFF);
    if (this.userService.isCoachSettingsUpdated && tempUser.show_coach_marks) {
      //console.log('Updated show_coach_marks');
      this.userService.userObj.show_coach_marks = tempUser.show_coach_marks;
      this.userService.isCoachSettingsUpdated = false;
    }

    if (tempUser && tempUser.user_id !== '' && this.userService.isProfileUpdate === false) {
      this.userObj = JSON.parse(JSON.stringify(this.userService.getUserProfile()));
    } else {
      this.initUserObj();
    }
  }

  ionViewDidLoad() {
    //console.log('Hello MyStuff Page');
  }

  ngOnDestroy() {
    // console.log("MyStuff is killed");
  }

  initUserObj(initUserObjCB?) {
    let that = this, userInfo: IUser = this.userService.getUser();
    if (!this.userService.userObj.show_coach_marks.profile) {
      that.loaderService.createLoader(that.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    }
    this.userService.getUserById(userInfo.user_id).subscribe((response: any) => {
      if (response.status !== 'ERROR') {
        this.userObj = response.user;
        Object.assign(this.userObj, { _id: userInfo.user_id });
        this.userService.setUserProfile(this.userObj);
        // // console.log('In MyStuff userObj ->', this.userObj);
        if (initUserObjCB) {
          initUserObjCB();
        }
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
      this.loaderService.dismissLoader();
    }, error => {
      // // console.log("ERROR::", error);
      this.loaderService.showToaster(error);
      this.loaderService.dismissLoader();
    })
  }

  resetUserObj(): void {
    this.userObj = {
      _id: '',
      user_id: '',
      user_name: '',
      email: '',
      is_mobile_number_verified: false,
      verification_code: '',
      profile: {}
    }
    this.userObj.profile = {
      profile_pic: '',
      description: '',
      gender: '',
      phone_number: '',
      name: '',
      first_name: '',
      last_name: '',
      nick_name: ''
    }
  }
  navigatTo(pageName): void {
    if (this.userService.isOnline()) {
      if (this.userObj && this.userObj.user_id !== '') {
        this.openPage(pageName);
      } else {
        this.initUserObj(() => {
          this.openPage(pageName);
        });
      }
    } else {
      this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.NO_NETWORK'));
    }
  }

  openPage(pageName: string) {
    switch (pageName) {
      case 'settings':
        this.navCtrl.push(Settings, { userData: this.userObj });
        break;
      case 'profile':
        this.navCtrl.push(Profile, { userData: this.userObj });
        break;
        case 'servicerequest':
        this.navCtrl.push(ServiceRequest);
        break;
      case 'feedback':
        this.navCtrl.push(TellFeedback, { userData: this.userObj })
        break;
      case 'favorites':
        this.navCtrl.push(ActivityPage,{favorites: true});
        break;
      case 'help':
        //this.navCtrl.push(FrequetlyAskedQustion);
        cordova.InAppBrowser.open(CONSTANTS.FAQ_URL, "_blank", "location=no");
        break;
    }
  }
}


