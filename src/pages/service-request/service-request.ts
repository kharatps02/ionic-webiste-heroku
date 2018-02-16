import { Component, ViewChild } from '@angular/core';
import { NavController, Events, Content } from 'ionic-angular';
import { ServiceRequestService, IResidentProperty } from './service-request-service';
import { TranslateService } from '@ngx-translate/core';
import { UserService, IUser } from '../../providers/user-service';
import { LoaderService } from '../../providers/loader-service';
import { CONSTANTS } from '../../shared/config';
import { CreateRequest } from './create-request/create-request';
import { ServiceRequestDetails } from './service-request-details/service-request-details';
import { IPinLocation } from '../aroundme/aroundme-service';

@Component({
  selector: 'service-request',
  templateUrl: 'service-request.html'
})
export class ServiceRequest {
  public selectedTab: string = 'active';
  private userInfo: IUser;
  public serviceRequestsPageState: any;
  public infiniteScrollEnabled: boolean = true;
  public serviceRequests: Array<any> = [];
  public residentProperties: Array<IResidentProperty>;
  public selectedProperty: IResidentProperty = null;
  public isServiceRequestAPICall: boolean = false;
  private showToolbar: boolean = false;
  @ViewChild(Content) content: Content;
  constructor(public navCtrl: NavController, private serviceRequestService: ServiceRequestService, private events: Events,
    private translateService: TranslateService, private userService: UserService, private loaderService: LoaderService, ) {
    this.selectedTab = 'active';
    this.serviceRequestsPageState = {
      pageNumber: 0,
      pageSize: CONSTANTS.DEFAULT_PAGE_SIZE.SERVICE_LIST,
      total: 0
    };
    this.userInfo = this.userService.getUser();
    this.initResidentProperties();
  }

  ionViewDidLoad() {
    //console.log('Hello IncidentSetting Page');
    this.serviceRequestsPageState.pageNumber = 0;
    this.loadServiceRequestList();
    this.events.subscribe(CONSTANTS.APP_EVENTS.SERVICE_REQUEST_REPORTED, (incident) => {
      this.serviceRequests.splice(0, 0, incident);
    });
  }

  ionViewDidEnter() {
    this.content.resize();
  }

  ionViewWillUnload() {
    this.events.unsubscribe(CONSTANTS.APP_EVENTS.SERVICE_REQUEST_REPORTED);
  }

  loadServiceRequestList(showLoader: boolean = true, callback?) {
    this.isServiceRequestAPICall = false;
    if (this.serviceRequestsPageState.pageNumber === 0 ||
      (this.serviceRequestsPageState.pageNumber * this.serviceRequestsPageState.pageSize) < this.serviceRequestsPageState.total) {
      this.serviceRequestsPageState.pageNumber += 1;

      let params = {
        user_id: this.userInfo.user_id,
        per_page: this.serviceRequestsPageState.pageSize,
        page_number: this.serviceRequestsPageState.pageNumber
      };
      let that = this;
      if (showLoader) {
        this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
      }
      this.serviceRequestService.getServiceRequestList(params).subscribe((response) => {
        if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
          that.serviceRequests = that.serviceRequests.concat(response.service_requests || []);
          that.serviceRequestsPageState.total = response.total;
          if (callback) {
            callback();
          }
        }
        this.isServiceRequestAPICall = true;
        this.loaderService.dismissLoader();
      })
    } else {
      this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.NO_MORE_DATA_TO_LOAD'));
      if (callback) {
        callback(true);
      }
    }

  }

  loadServiceRequestCallback(): void {
    let that = this;
    setTimeout(() => {
      that.isServiceRequestAPICall = true;
    }, 500);
  }

  doRefresh(refresher): void {
    this.isServiceRequestAPICall = false;
    this.serviceRequestsPageState.pageNumber = 0;
    this.infiniteScrollEnabled = true;
    this.serviceRequests = [];
    this.loadServiceRequestList(false, () => {
      refresher.complete();
      this.loadServiceRequestCallback();
    });
  }

  loadMore(infiniteScroll): void {
    this.loadServiceRequestList(true, (isMoreDataNotFound) => {
      infiniteScroll.complete();
      if (!!isMoreDataNotFound) {
        this.infiniteScrollEnabled = false;
      }
    });
  }

  initResidentProperties() {
    let that = this;
    that.serviceRequestService.checkForResidences({ user_id: that.userInfo.user_id }).subscribe((response) => {
      //console.log('In initResidentProperties response', response);
      if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        that.residentProperties = response.resident_properties || [];
        if (that.residentProperties && that.residentProperties.length > 0) {
          // TODO, Have to show popup modal to select properties for reporting request
          that.selectedProperty = that.residentProperties.filter((property) => {
            return property.is_advocate === false;
          })[0];
          if (!that.selectedProperty) {
            that.selectedProperty = that.residentProperties[0];
          }
        }
      }
      this.showToolbar = true;
    });
  }

  serviceRequest() {
    this.navCtrl.push(CreateRequest, { selectedProperty: this.selectedProperty });
  }

  viewRequestDetails(request) {
    //console.log('viewRequestDetails', request);
    this.navCtrl.push(ServiceRequestDetails, { _id: request._id });
  }

  navigateToAroundYou() {
    if (this.userService.userObj.profile.home_address.street_address1.length > 0) {
      let data: IPinLocation = {};
      data.address = this.userService.userObj.profile.home_address.street_address1;
      data.position = { lat: 0, lng: 0 };
      if (this.userService.userObj.profile.home_address.lat) {
        data.position.lat = parseFloat(this.userService.userObj.profile.home_address.lat);
        data.position.lng = parseFloat(this.userService.userObj.profile.home_address.long);
      }
      this.events.publish(CONSTANTS.APP_EVENTS.ARROUND_YOU_ACTIONS, CONSTANTS.ARROUND_YOU_ACTIONS.SELECT_SAVED_PIN, data);
    }
    this.navCtrl.pop();
    this.navCtrl.parent.select(2);
  }

}