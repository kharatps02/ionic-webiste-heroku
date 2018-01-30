import { Component, ViewChild } from '@angular/core';
import { NavController, Events, NavParams, Content } from 'ionic-angular';

import { UserService, ISignUpRequest } from '../../../../providers/user-service';
import { LoaderService } from '../../../../providers/loader-service';
import { CONSTANTS } from '../../../../shared/config';
import { AnalyticsService } from "../../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'page-choose-password',
  templateUrl: 'choose-password.html'
})

export class ChoosePassword {
  @ViewChild(Content) content: Content;
  private isFormSubmmited: boolean;
  private strongRegex: RegExp;
  private mediumRegex: RegExp;
  public passwordstrength: string;
  public isPasswordType: boolean;
  public password: string;
  public signUpModel: ISignUpRequest;

  constructor(public navCtrl: NavController, private userService: UserService, private events: Events,  private translateService: TranslateService,
    private analyticsService: AnalyticsService, private params: NavParams, private loaderService: LoaderService) {
    this.isPasswordType = false;
    this.isFormSubmmited = false;
    this.password = '';
    this.strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,100})");
    this.mediumRegex = new RegExp("^(((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]))((?=.*[a-z]))((?=.*[A-Z]))(?=.*[0-9]))(?=.{8,100})");
     this.signUpModel = this.params.get('signUpModel');
    this.signUpModel['password'] = '';
  }

  ionViewDidLoad() {   
    //console.log("In ionViewDidLoad userObj", this.signUpModel);
  }

  ionViewDidEnter() {
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.CHOOSE_PASSWORD);
  }

  onLoginToRezility(): void {
    let that = this;
    that.loaderService.createLoader(that.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    if (!that.isFormSubmmited) {
      that.isFormSubmmited = true;
      that.userService.signup(this.signUpModel, false).subscribe(function (data: any) {
        that.isFormSubmmited = false;
        if (data.status !== "ERROR") {
          that.userService.storeUserCredentials(data, function () {
            that.events.publish('user:signup');
          })
        } else {
          that.loaderService.showToaster(data.message);
          that.loaderService.dismissLoader();
        }
      }, error => {
        that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
        that.loaderService.dismissLoader();
      });
    }
  }

  analyzePasswordStrength(value: string): void {
    if (value === '') {
      this.passwordstrength = 'weak'
    } else if (this.strongRegex.test(value)) {
      this.passwordstrength = 'strong'
    }
    else if (this.mediumRegex.test(value)) {
      this.passwordstrength = 'strong'
    }
    else {
      this.passwordstrength = 'weak'
    }
  }

  onShowPassword(): void {
    this.isPasswordType = !this.isPasswordType
  }

}
