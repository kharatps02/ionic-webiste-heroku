import { Component, ViewChild } from '@angular/core';
import { NavController, Platform, Content } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectPassword } from './../select-password/select-password';
import { LoginPage } from '../../login/login';
import { UserService, ISignUpRequest } from '../../../providers/user-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { ValidationService } from '../../../shared/validationService';
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";
declare let cordova;
@Component({
  selector: 'page-sign-up',
  templateUrl: 'sign-up.html'
})
export class SignUp {
  @ViewChild(Content) content: Content;
  private isEmailVerified: boolean;
  public signUpModel: ISignUpRequest;
  public signupForm: FormGroup;
  public isSignupFormInValid: boolean;
  constructor(public navCtrl: NavController, private platform: Platform, private userService: UserService, private translateService: TranslateService,
    private analyticsService: AnalyticsService,private loaderService: LoaderService, private fb: FormBuilder) {

    this.signupForm = this.fb.group({
      'firstName': ['', Validators.compose([Validators.maxLength(50), Validators.required])],
      'lastName': ['', Validators.compose([Validators.maxLength(50), Validators.required])],
      'email': ['', Validators.compose([Validators.maxLength(150), ValidationService.emailValidator, Validators.required])],
      'zipcode': ['', Validators.compose([Validators.maxLength(10), ValidationService.zipcodeValidator, Validators.required])],
      'privacyAccepted': ['', Validators.compose([ValidationService.isTrueValue, Validators.required])]
    });


    this.signUpModel = {
      first_name: '',
      last_name: '',
      email: '',
      zipcode: null,
      is_terms_checked: false,
      is_privacy_checked: false,
      is_terms_privacy_accepted: false
    };
    this.isSignupFormInValid = true;
    this.isEmailVerified = false;
  }
  ngOnInit() {
    //console.log('In SignUp ngOnInit');    
    this.signupForm.valueChanges.subscribe(data => {
      if (this.signupForm.invalid !== this.isSignupFormInValid) {
        this.isSignupFormInValid = !this.isSignupFormInValid;
      }
    });

  }

  ionViewDidEnter() {
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.SIGN_UP);
  }

  openPrivacyNoticeUrl() {
    this.signUpModel.is_privacy_checked = true;
    this.openInAppBrowser(CONSTANTS.PRIVACY_NOTICE_URL);
  }

  openTermsOfUseUrl() {
    this.signUpModel.is_terms_checked = true;
    this.openInAppBrowser(CONSTANTS.TERM_OF_USE_URL);
  }

  openInAppBrowser(url) {
    this.platform.ready().then(() => {
      cordova.InAppBrowser.open(url, "_blank", "location=no");
    });
  }

  privacyAccepted() {
    this.signUpModel.is_terms_privacy_accepted = !this.signUpModel.is_terms_privacy_accepted;
  }

  onContinue() {
    if (this.signupForm.valid && !this.isEmailVerified && !this.isSignupFormInValid) {
      this.isEmailVerified = true;
      this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
      this.userService.verifyEmailId(this.signUpModel.email).subscribe((response) => {
        this.isEmailVerified = false;
        if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
          if (response.is_exist) {
            this.navCtrl.push(LoginPage, { email: this.signUpModel.email });
          } else {
            this.navCtrl.push(SelectPassword, { signUpModel: this.signUpModel });
          }
        } else {
          this.loaderService.showToaster(response.message);
        }
        this.loaderService.dismissLoader();
      });
    }
  }
  navigatetoBackPage() {
    this.navCtrl.pop();
  }
}
