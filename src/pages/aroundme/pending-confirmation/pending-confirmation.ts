import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { UserService } from "../../../providers/user-service";
import { AnalyticsService } from "../../../providers/analytics-service";
import { CONSTANTS } from "../../../shared/config";


@Component({
  selector: 'page-pending-confirmation',
  templateUrl: 'pending-confirmation.html'
})
export class PendingConfirmation {
  constructor(public navCtrl: NavController, private analyticsService: AnalyticsService, public userService: UserService) {
    this.userService.isProfileUpdate = true;
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.PENDING_CONFIRMATION);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.PENDING_CONFIRMATION);
  }
  navigatetoNextPage() {
    const startIndex = this.navCtrl.getActive().index - 1;
    this.navCtrl.remove(startIndex, 2);
  }
}