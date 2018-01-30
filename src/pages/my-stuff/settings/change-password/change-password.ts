import { Component } from '@angular/core';
import { NavParams, NavController, AlertController } from 'ionic-angular';
import { UserService, IUser } from '../../../../providers/user-service';
import { LoaderService } from '../../../../providers/loader-service';
import { CONSTANTS } from '../../../../shared/config';
import { AnalyticsService } from "../../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'change-password',
  templateUrl: 'change-password.html'
})
export class ChangePassword {

  private userObj: IUser;
  public newPassword: string;
  public repeatPassword: string;
  private mediumRegex: RegExp;
  constructor(private userService: UserService, private loaderService: LoaderService, private navParams: NavParams, private translateService: TranslateService,
    private analyticsService: AnalyticsService, private alertCtrl: AlertController, private navctrl: NavController) {
    // // console.log('Hello ChangePassword Component');
    this.newPassword = '';
    this.repeatPassword = '';
    this.mediumRegex = new RegExp(CONSTANTS.CHANGE_PASSWORD_MESSAGES.MEDIUM_REGX);
    this.userObj = this.navParams.get('userData');
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.MY_STUFF_CHANGE_PASSWORD);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.MY_STUFF_CHANGE_PASSWORD);
  }

  saveToBackend() {
    let that = this;
    that.repeatPassword = that.repeatPassword.trim();
    that.newPassword = that.newPassword.trim();
    let validatePassword: boolean = that.mediumRegex.test(that.newPassword);
    let message = '';
    if (that.newPassword == '') {
      message = this.translateService.instant('ERROR_MESSAGES.PASSWORD_BLANK');
    } else if (that.newPassword !== that.repeatPassword) {
      message = this.translateService.instant('ERROR_MESSAGES.PASSWORD_MISMATCH');
    } else if (validatePassword) {
      let passwordRequest: Object = { password: that.repeatPassword, email: that.userObj.email, _id: that.userObj._id };
      that.loaderService.createLoader(that.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
      that.userService.changePassword(passwordRequest).subscribe((res: any) => {
        if (res.status == 'SUCCESS') {
          // // console.log(res, "response from userService.updateUserInfo");
          that.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.UPDATE_SUCCESSFUL'));
          that.loaderService.dismissLoader();
          that.navctrl.pop();
        } else {
          that.loaderService.showToaster(res.message);
          that.loaderService.dismissLoader();
        }

      }, error => {
        // // console.log("ERROR::", error);
        that.loaderService.showToaster(error);
        that.loaderService.dismissLoader();
      });
    } else {
      message = this.translateService.instant('ERROR_MESSAGES.PASSWORD_FORMAT');
    }
    if (message != '') {
      let alert = that.alertCtrl.create({
        title: that.translateService.instant('ERROR_MESSAGES.ERROR_TITLE'),
        subTitle: message,
        buttons: [{
          text: this.translateService.instant('CONVERSATIONS.OK'),
          handler: () => {
            that.repeatPassword = '';
            that.newPassword = '';
          }
        }],
        enableBackdropDismiss: false,
        cssClass: 'alert-single'
      });
      alert.present();
    }
  }
}
