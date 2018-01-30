import { Component } from '@angular/core';
import { NavController, Events, NavParams } from 'ionic-angular';

import { ChoosePassword } from './choose-password/choose-password';
import { LoginPage } from '../../login/login';
import { UserService, ISignUpRequest } from '../../../providers/user-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'page-select-password',
  templateUrl: 'select-password.html'
})
export class SelectPassword {
  private signUpModel: ISignUpRequest;
  constructor(public navCtrl: NavController, private userService: UserService, private events: Events, private translateService: TranslateService,
    private analyticsService: AnalyticsService, private navParams: NavParams, private loaderService: LoaderService) {
    this.signUpModel = this.navParams.get('signUpModel');
    //console.log('In SelectPassword params:userId', this.signUpModel);
  }

  ionViewDidEnter() {
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.SELECT_PASSWORD);
  }

  navigateToChoosePassword(): void {
    if (this.signUpModel) {
      this.navCtrl.push(ChoosePassword, { signUpModel: this.signUpModel });
    }
  }

  navigatetoGetStartedPage() {
    this.navCtrl.remove((this.navCtrl.length() - 1), 1, { animate: false, progressAnimation: false }).then(() => {
    });
  }

  navigateToSignInPage() {
    this.navCtrl.setRoot(LoginPage);
  }

  onFLogin(): void {
    let that = this;
    that.userService.fbLogin().then(() => {
      that.userService.getUserFacebookProfile().then((profileData) => {
        if (!profileData.errorCode) {
          that.signUpModel['facebook'] = profileData.id;
          that.signUpModel['profile_pic'] = CONSTANTS.FACEBOOk_PROFILE_URL.PREFIX + profileData.id + CONSTANTS.FACEBOOk_PROFILE_URL.POSTFIX || '';
          that.loaderService.createLoader(that.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
          that.userService.signup(that.signUpModel).subscribe((data: any) => {
            if (data.status !== "ERROR") {
              that.userService.storeUserCredentials(data, () => {
                that.events.publish('user:signup');
                that.loaderService.dismissLoader();
              });
            } else {
              that.signUpModel['facebook'] = '';
              that.signUpModel['profile_pic'] = '';
              that.userService.fbLogout();
              that.loaderService.showToaster(data.message);
              that.loaderService.dismissLoader();
            }
          }, error => {
            that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
            that.loaderService.dismissLoader();
          });
        }
      }, error => {
        that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
      });
    }, error => {
      that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
    });
  }
}