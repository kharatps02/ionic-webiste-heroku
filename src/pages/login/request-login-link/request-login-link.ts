import { Component, ViewChild } from '@angular/core';
import { NavController, Content } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ValidationService } from '../../../shared/validationService';
import { LoginLinkSent } from '../login-link-sent/login-link-sent';
import { RequestLoginError } from '../request-login-error/request-login-error';
import { UserService } from '../../../providers/user-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";
@Component({
  selector: 'page-request-login-link',
  templateUrl: 'request-login-link.html'
})
export class RequestLoginLink {
  emailAddress: string;
  requestLogin: FormGroup;
  isFormSubmmited: boolean;
  isForgotpasswordApiCalled: boolean;
  @ViewChild(Content) content: Content;
  constructor(public navCtrl: NavController, public formBuilder: FormBuilder, private userService: UserService,
    private translateService: TranslateService, private analyticsService: AnalyticsService, private loaderService: LoaderService) {
    this.emailAddress = '';
    this.isFormSubmmited = false;
    this.isForgotpasswordApiCalled = false;
    this.requestLogin = formBuilder.group({
      'emailAddress': ['', Validators.compose([Validators.maxLength(150), ValidationService.emailValidator, Validators.required])]
    });
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.REQUEST_PASSWORD);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.REQUEST_PASSWORD);
  }

  onSendLoginLink() {
    this.isFormSubmmited = true;
    if (this.requestLogin.valid && !this.isForgotpasswordApiCalled) {
      this.isForgotpasswordApiCalled = true;
      this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
      this.userService.forgotpassword(this.emailAddress).subscribe((response) => {
        this.isForgotpasswordApiCalled = false;
        this.loaderService.dismissLoader();
        if (response.status !== "ERROR" && response.status_code === 0) {
          this.navCtrl.push(LoginLinkSent, { email: this.emailAddress });
        } else if (response.status_code === 1 || response.status_code === 2) {
          this.requestLogin.reset();
          this.navCtrl.push(RequestLoginError, { status_code: response.status_code, error_message: response.message });
        }
      }, error => {
        // console.log("ERROR::", error);
        this.loaderService.dismissLoader();
        this.loaderService.showToaster(error);
      })
    }
  }
}
