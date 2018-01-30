import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { HousingUnit } from '../housing-unit/housing-unit';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { ProviderService, IProviderDetails, IBuilding } from "../provider-service";
import { UserService } from "../../../providers/user-service";
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'page-housing-types',
  templateUrl: 'housing-types.html'
})
export class HousingTypes {
  providerDetails: IProviderDetails;
  buildings: Array<IBuilding>
  constructor(private loaderService: LoaderService, private providerService: ProviderService, private translateService: TranslateService,
    private navCtrl: NavController, private navParams: NavParams, private analyticsService: AnalyticsService, private userService: UserService) {
    this.providerDetails = this.navParams.get('providerDetails');
    this.getBuildingList(this.providerDetails._id);
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.HOUSING_TYPES);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.HOUSING_TYPES);
  }


  getBuildingList(property_id: string) {
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.providerService.getBuildingsByPropertyId({ property_id: this.providerDetails._id }).subscribe((response) => {
      if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        //console.log("---", response);
        this.buildings = response.buildings;
      }
      this.loaderService.dismissLoader();
    }, error => {
      this.loaderService.dismissLoader();
      this.loaderService.showToaster(error);
    });
  }
  selectUnit(selectedBuilding) {
    this.navCtrl.push(HousingUnit, { buildingName: selectedBuilding.public_name, units: selectedBuilding.units, providerDetails: this.providerDetails });
  }
}