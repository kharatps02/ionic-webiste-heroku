import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../providers/user-service';
import { NavController, NavParams, AlertController, Events, Platform } from 'ionic-angular';
import { RequestLoginLink } from './request-login-link/request-login-link';
import { GetStarted } from '../get-started/get-started';
import { ValidationService } from '../../shared/validationService';
//import { CONSTANTS } from '../../shared/config';
import { LoaderService } from '../../providers/loader-service'
import { BaseLoginClass } from './base-login';
import { AnalyticsService } from "../../providers/analytics-service";
import { CONSTANTS } from "../../shared/config";
import { TranslateService } from "@ngx-translate/core";
@Component({
  selector: 'login',
  templateUrl: 'login.html'
})
export class LoginPage extends BaseLoginClass {
  user: {
    password: string,
    email: string
  };
  submitted: boolean;
  showPasswordIsChecked: boolean;
  isLoggedUser: boolean;
  loginForm: FormGroup;
  isEmailExist: boolean;
  invalidLoginError: string;

  constructor(public userService: UserService, public navCtrl: NavController, public alertCtrl: AlertController, public navParams: NavParams,
    private analyticsService: AnalyticsService, public events: Events, public platform: Platform, public loaderService: LoaderService,
    public translateService: TranslateService, public formBuilder: FormBuilder) {
    super(userService, alertCtrl, events,translateService, loaderService);
    this.showPasswordIsChecked = false;
    this.isEmailExist = false;
    this.navCtrl = navCtrl;
    this.userService = userService;
    this.user = {
      password: '',
      email: ''
      //password: 'Rezility123',
      //email: 'babu@yopmail.com'
    };
    this.events = events;
    this.submitted = false;
    this.loginForm = formBuilder.group({
      'username': ['', Validators.compose([Validators.maxLength(150), ValidationService.emailValidator, Validators.required])],
      'password': ['', Validators.compose([Validators.required])]
      // 'password': ['', Validators.compose([Validators.maxLength(50), ValidationService.strongPasswordValidator, Validators.required])]
    });

    if (navParams.get('email')) {
      this.user.email = navParams.get('email');
      this.isEmailExist = true;
    } else if (navParams.get('loginLinkSentEmail')) {
      this.user.email = navParams.get('loginLinkSentEmail');
    }
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.LOGIN);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.LOGIN);
    this.userService.userObj["show_coach_marks"] = { all: true, feed: true, conversation: true, around_me: true, profile: true }
  }

  onLogin(user) {
    this.submitted = true;
    if (this.loginForm.valid) {
      this.proceedLogin(user, (errorMsg) => {
        //console.log(errorMsg);
        this.invalidLoginError = errorMsg;
      })
    } else {
      this.invalidLoginError = this.translateService.instant('ERROR_MESSAGES.INVALID_USERNAME_PASSWORD');    
    }
  }

  navigateToSignupLandingPage() {
    // if (this.navCtrl.length() > 1) {
    //   console.log('navigateToSignupLandingPage1');
    //   this.navCtrl.pop();
    // } else {
    //   console.log('navigateToSignupLandingPage2');
    //   this.navCtrl.setRoot(GetStarted);
    // }
    this.navCtrl.setRoot(GetStarted);
  }
  onRequestLoginLink() {
    this.navCtrl.push(RequestLoginLink);
  }

  showPassword() {
    // console.log('hiii showPassword');
    this.showPasswordIsChecked = !this.showPasswordIsChecked
  }


}
