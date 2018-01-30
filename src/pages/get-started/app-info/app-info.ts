import { Component, ViewChild } from '@angular/core';
import { NavController, Slides } from 'ionic-angular';
import { SignUp } from '../sign-up/sign-up';
import { LoginPage } from '../../login/login';
import { CONSTANTS } from "../../../shared/config";
import { AnalyticsService } from "../../../providers/analytics-service";

@Component({
  selector: 'app-info',
  templateUrl: 'app-info.html'
})

export class AppInfo {
  public runningSliderConfig: {
    initialSlide: number
  };

  @ViewChild(Slides) slides: Slides;
  constructor(private navCtrl: NavController, private analyticsService: AnalyticsService) {
    this.runningSliderConfig = {
      initialSlide: 0
    };
  }

  ionViewDidEnter() {
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.APP_ONBOARDING);
  }

  skipSlides() {
    this.slides.slideTo(3, 500);
  }

  navigatetoNextPage() {
    this.navCtrl.push(SignUp);
  }

  navigatetoBackPage() {
    this.navCtrl.pop();
  }

  alreadyHaveAccount(): void {
    this.navCtrl.setRoot(LoginPage);
  }

}

