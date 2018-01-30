import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { LoginPage } from '../../login/login';
import { CONSTANTS } from "../../../shared/config";
import { AnalyticsService } from "../../../providers/analytics-service";
import { UserService } from "../../../providers/user-service";
@Component({
  selector: 'page-login-link-sent',
  templateUrl: 'login-link-sent.html'
})
export class LoginLinkSent {
  public email: string;
  constructor(public navCtrl: NavController, private navParams: NavParams, private analyticsService: AnalyticsService, private userService: UserService) {
    this.email = this.navParams.get('email');
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.REQUEST_PASSWORD_SUCCESS);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.REQUEST_PASSWORD_SUCCESS);
  }

  onContinue() {
    this.navCtrl.push(LoginPage, { loginLinkSentEmail: this.email });
  }
}
