import { Component } from '@angular/core';
import { Events, NavController } from 'ionic-angular'
import { AroundMeService, IGetMapOverlaysOptions, IUpdateUserAroundmeSettingsRequest } from '../aroundme-service';
import { LoaderService } from '../../../providers/loader-service';
import { UserService, IUser } from "../../../providers/user-service";
import { CONSTANTS } from "../../../shared/config";
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'page-map-overlays',
  templateUrl: 'map-overlays.html'
})
export class MapOverlays {
  public overlaysOptions: IGetMapOverlaysOptions;
  public userData: IUser;
  constructor(public loaderService: LoaderService, public aroundMeService: AroundMeService, private translateService: TranslateService,
    private analyticsService: AnalyticsService, private userService: UserService, private events: Events, public navCtrl: NavController) {
    this.userData = this.userService.getUser();
    this.setOverlaysOptions();
  }

  ionViewDidLoad() {
    if (!this.aroundMeService.mapOverlays.google_places || !this.aroundMeService.mapOverlays.service_interest) {
      this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
      this.aroundMeService.getUserAroundmeSettings({ user_id: this.userData.user_id }).subscribe((response) => {
        if (response.google_places || response.service_interest) {
          this.aroundMeService.mapOverlays.google_places = response.google_places;
          this.aroundMeService.mapOverlays.service_interest = response.service_interest;
          this.aroundMeService.mapOverlays.provider_overlay = response.provider_overlay;
          this.setOverlaysOptions();
        }
        this.loaderService.dismissLoader();
      });
    }
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.MY_PINNED_LOCATION);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.MY_PINNED_LOCATION);

  }

  setOverlaysOptions() {
    this.overlaysOptions = JSON.parse(JSON.stringify(this.aroundMeService.mapOverlays));
  }

  saveFilter() {
    let mapOverlays = this.overlaysOptions;
    let updateObj: IUpdateUserAroundmeSettingsRequest = {
      user_id: this.userData.user_id,
      google_places: [],
      provider_overlay: [],
      service_interest: []
    };
    mapOverlays.google_places.forEach((self) => {
      if (self.flag) {
        updateObj.google_places.push(self._id);
      }
    });
    mapOverlays.provider_overlay.forEach((self) => {
      if (self.flag) {
        updateObj.provider_overlay.push(self._id);
      }
    });
    mapOverlays.service_interest.forEach((self) => {
      if (self.flag) {
        updateObj.service_interest.push(self._id);
      }
    });

    this.aroundMeService.updateUserAroundmeSettings(updateObj).subscribe((response) => {
      if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        this.aroundMeService.mapOverlays = this.overlaysOptions;
        this.navCtrl.pop().then(()=>{
          this.events.publish(CONSTANTS.APP_EVENTS.ARROUND_YOU_ACTIONS, CONSTANTS.ARROUND_YOU_ACTIONS.SAVE_FILTER);
        });
        
      }
    });

  }
}
