import { Component, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';

import { AppInfo } from './app-info/app-info';
import { LoginPage } from '../login/login';
import { AnalyticsService } from "../../providers/analytics-service";
import { CONSTANTS } from "../../shared/config";

@Component({
  selector: 'page-get-started',
  templateUrl: 'get-started.html'
})

export class GetStarted implements OnInit {

  constructor(private navCtrl: NavController,private analyticsService: AnalyticsService) {
  }


  ngOnInit() {
  }

  ionViewDidEnter() {
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.GET_STARTED);
  }

  onGetStarted(): void {
    this.navCtrl.push(AppInfo);
  }

  onLoginToRezility(): void {
    this.navCtrl.push(LoginPage);
  }

}
