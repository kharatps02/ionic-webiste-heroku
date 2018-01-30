import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { UserService, IFeedback } from '../../../providers/user-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'page-tell-feedback',
  templateUrl: 'tell-feedback.html'
})
export class TellFeedback {
  public feedbackObj: IFeedback;
  constructor(public navCtrl: NavController, private userService: UserService, private loaderService: LoaderService, private translateService: TranslateService,
    private analyticsService: AnalyticsService, private navParams: NavParams, private alertCtrl: AlertController) {
    this.feedbackObj = {
      user_id: '',
      message: '',
      first_name: '',
      last_name: '',
      user_email: ''
    }
    let userObj = this.navParams.get('userData');
    // console.log("User", userObj);
    this.feedbackObj.first_name = userObj.profile.first_name;
    this.feedbackObj.last_name = userObj.profile.last_name;
    this.feedbackObj.user_email = userObj.email;
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.FEEDBACK);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.FEEDBACK);
  }

  saveFeeedBack(): void {
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.REPORTING'));
    this.userService.saveFeedBack(this.feedbackObj).subscribe((res: any) => {
      // // console.log('feedback response', res)
      if (res.status !== 'ERROR') {
        this.loaderService.dismissLoader();
        let alert = this.alertCtrl.create({
          title: res.message,
          buttons: [{
            text: this.translateService.instant('CONVERSATIONS.OK'),
            handler: () => {
              this.navCtrl.pop();
            }
          }],
          enableBackdropDismiss: false,
          cssClass: 'alert-single'
        });
        alert.present();

      } else {
        this.loaderService.dismissLoader();
        let alert = this.alertCtrl.create({
          title: this.translateService.instant('ERROR_MESSAGES.ERROR_TITLE'),
          subTitle: res.message,
          buttons: [{
            text: this.translateService.instant('MISC.OK')
          }],
          enableBackdropDismiss: false,
          cssClass: 'alert-single'
        });
        alert.present();
      }
    }, error => {
      this.loaderService.showToaster(error);
      this.loaderService.dismissLoader();
    });
  }

}


