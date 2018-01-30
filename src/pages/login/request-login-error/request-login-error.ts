import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { BaseLoginClass } from './../base-login';
import { UserService } from '../../../providers/user-service';
import { AlertController, Events } from 'ionic-angular';
import { LoaderService } from '../../../providers/loader-service'
import { CONSTANTS } from "../../../shared/config";
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'page-request-login-error',
  templateUrl: 'request-login-error.html'
})
export class RequestLoginError extends BaseLoginClass {
  public status_code: number;
  public error_message: string;


  constructor(public userService: UserService, public alertCtrl: AlertController, public events: Events, public translateService: TranslateService,
    private analyticsService: AnalyticsService,public loaderService: LoaderService, public navCtrl: NavController, private navParams: NavParams) {
    super(userService, alertCtrl, events, translateService, loaderService);
    this.status_code = this.navParams.get('status_code');
    this.error_message = this.navParams.get('error_message')
    //console.log('Hello RequestLoginError Page', this.status_code, this.error_message);
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.REQUEST_PASSWORD_ERROR);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.REQUEST_PASSWORD_ERROR);
  }

  fixThisIssue() {
    this.navCtrl.pop();
  }

  loginWithFacebook() {
    this.onFLogin();
  }

}
