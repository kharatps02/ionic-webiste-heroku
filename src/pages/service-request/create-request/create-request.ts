
import { Component } from '@angular/core';
import { NavController, ActionSheetController, Platform, NavParams, Events } from 'ionic-angular';
import { Camera } from '@ionic-native/camera';
import { TranslateService } from "@ngx-translate/core";

import { IUser, UserService } from "../../../providers/user-service";
import { ServiceRequestReported } from './request-reported/request-reported';
import { ServiceRequestService, IServiceRequest, IResidentProperty, ISaveMessage } from './../service-request-service';
import { UploadService, IUploadOptions } from '../../../providers/upload-service';
import { AnalyticsService } from '../../../providers/analytics-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from "../../../shared/config";
import { PubNubService } from '../../../providers/pubnub-service';


@Component({
  selector: 'page-create-request',
  templateUrl: 'create-request.html'
})
export class CreateRequest {
  public serviceRequestObj: IServiceRequest;
  public pictureModel: string
  public selectedTab: string = 'types';
  public userData: IUser;
  public serviceRequestTypes: Array<{ name: string, _id: string }> = [];
  public serviceRequestTypeClassMap: any = {};
  private selectedProperty: IResidentProperty;
  constructor(private navCtrl: NavController, private actionSheetCtrl: ActionSheetController, private platform: Platform,
    private analyticsService: AnalyticsService, private camera: Camera, private loaderService: LoaderService,
    private userService: UserService, private translateService: TranslateService, private navParams: NavParams, private pubNubService: PubNubService,
    private events: Events, private uploadService: UploadService, private serviceRequestService: ServiceRequestService) {

    this.selectedTab = 'types';
    this.userData = this.userService.getUser();
    this.serviceRequestObj = {
      user_id: this.userData.user_id,
      user_name: this.userData.user_name,
      address: '',
      property_id: '',
      type: '',
      description: '',
      photos: [],
      building_id: '',
      incident_date_string: this.serviceRequestService.getIncidentDateString()
    };

    // This is fixed for all domains so have to update this when we add/remove types
    this.serviceRequestTypeClassMap = this.serviceRequestService.serviceRequestTypeClassMap;
    this.selectedProperty = this.navParams.get('selectedProperty');
    // console.log('this.serviceRequestPropertyId', this.serviceRequestPropertyId);
  };

  ionViewDidEnter() {
    if (this.platform.is('cordova')) {
      this.analyticsService.trackScreenView(CONSTANTS.PAGES.SERVICE_REQUESTS);
    }
  }

  ionViewDidLoad() {
    //console.log("In ionViewDidLoad, made display none");
    this.loadServiceRequestTypes();
  }

  loadServiceRequestTypes() {
    this.serviceRequestService.getServiceRequestTypes().subscribe((response) => {
      if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        this.serviceRequestTypes = response.result || [];
      }
    })
  }



  onTabSelect(tabIndex: number) {
    //console.log(tabIndex == 1 && this.serviceRequestObj.type !== '', "extreesion check");
    if (tabIndex == 1 && this.serviceRequestObj.type !== '') {
      this.selectedTab = 'description';
    } else if (this.serviceRequestObj.description && this.serviceRequestObj.description.trim().length > 0 && tabIndex == 2) {
      this.selectedTab = 'photos';
    } else if (tabIndex == 0)
      this.selectedTab = 'types';
  }

  getRequestTypeNameById(typeId) {
    var element = null, selecttedType = null;
    for (let index = 0; index < this.serviceRequestTypes.length; index++) {
      element = this.serviceRequestTypes[index];
      if (element._id === typeId) {
        selecttedType = element;
        break;
      }
    }
    return selecttedType.name || '';
  }

  createNewServiceRequest() {
    this.loaderService.createLoader(this.translateService.instant("ERROR_MESSAGES.REPORTING"));
    this.serviceRequestObj['property_id'] = this.selectedProperty.property_id || '';
    this.serviceRequestObj['building_id'] = this.selectedProperty.building_id || '';
    this.serviceRequestObj['unit'] = this.selectedProperty.unit || '';

    this.serviceRequestService.reportServiceRequest(this.serviceRequestObj).subscribe((response: any) => {
      //console.log(response, "response for INCIDENT API");
      if (response.status !== CONSTANTS.RESPONSE_STATUS.ERROR) {
        this.navCtrl.push(ServiceRequestReported, { incident_no: response.incidents.incident_number }).then(() => {
          this.navCtrl.remove(this.navCtrl.length() - 2, 1);

          // Get request type name by id since we are not storing type name in database
          response.incidents['type'] = this.getRequestTypeNameById(response.incidents.type);
          response.incidents['providers'] = response.providers || [];
          this.events.publish(CONSTANTS.APP_EVENTS.SERVICE_REQUEST_REPORTED, response.incidents);
          this.createConversation(response.incidents);
        });
      } else {
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
      }
      this.loaderService.dismissLoader();
    }, error => {
      console.log("ERROR::", error);
      this.loaderService.showToaster(error);
    });
  }

  createConversation(serviceRequet) {
    this.pubNubService.getTimeToken((pubnubtimestoken) => {
      let shared_channel: string = this.userData.user_id + '_' + serviceRequet._id;
      let members = [];
      if (serviceRequet.providers) {
        serviceRequet.providers.forEach((self) => {
          if (self.user_id !== this.userData.user_id) {
            members.push(self.user_id);
          }
        });
      }
      let newConversation = {
        user_id: this.userData.user_id,
        shared_channel: shared_channel,
        name: serviceRequet.incident_number,
        joining_time_token: pubnubtimestoken,
        incident_id: serviceRequet._id,
        members: members
      };
      this.serviceRequestService.createConversation(newConversation).subscribe((response) => {
        if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
          this.pubNubService.addChanneltoGroup(newConversation.members, newConversation.shared_channel, newConversation.name, this.userService.userObj.user_id, this.userService.deviceToken, this.userService.pushPlatform, CONSTANTS.USER_STATES.SERVICE_REQUEST_REPORTED);
          this.sendMessage(newConversation, serviceRequet.incident_number);
        }
      });
    });
  }


  sendMessage(conversation, incident_number: string) {
    this.pubNubService.getSupportedLanguageMsg(CONSTANTS.MESSAGES.SERVICE_REQUEST_CREATED).subscribe((msgContent) => {
      let coreMessageObj = {
        content: msgContent,
        sender_uuid: this.userData.user_id,
        image: '',
        receiver_uuid: conversation.shared_channel,
        shared_channel: conversation.shared_channel,
        timetoken: conversation.joining_time_token,
        is_group: true,
        is_sys_msg: true,
        content_type_id: CONSTANTS.MESSAGE_CONTENT_TYPE_ID.SERVICE_REQUEST
      };

      this.pubNubService.publish(coreMessageObj.shared_channel, coreMessageObj).subscribe((event) => {
        // console.log('In sendInvitationMessageToAdmin Publish message', coreMessageObj, event);
        let saveMessage: ISaveMessage = {
          user_id: this.userData.user_id,
          content: coreMessageObj.content,
          shared_channel: coreMessageObj.shared_channel
        };
        this.serviceRequestService.saveMessage(saveMessage).subscribe(() => {
          // console.log('Saved message!');
        });
      });
    }, error => {
      this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
    });
  }

  closeServiceRequest() {
    this.navCtrl.pop();
  }

  uploadDone(error, url: string) {
    if (!error) {
      this.serviceRequestObj.photos.push(url);
    }
    console.log(error, url);
  }

  presentActionSheet() {
    let that = this;
    let uploadOptions: IUploadOptions = {
      sourceType: that.camera.PictureSourceType.CAMERA,
      bucketSource: CONSTANTS.UPLOAD_IMAGE_SOURCE.INCIDENTS,
      cropImage: false,
      targetHeight: 600,
      targetWidth: 1062
    };
    let actionSheet = that.actionSheetCtrl.create({
      cssClass: 'photo-sheet',
      buttons: [
        {
          text: this.translateService.instant("CONVERSATIONS.NEW_MSG.TAKE_PHOTO"),
          role: 'Take a photo',
          cssClass: 'take-photo',
          icon: 'icons-camera',
          handler: () => {
            that.uploadService.takeFromCamera(uploadOptions, (error, image) => {
              that.uploadDone.call(that, error, image);
            });
          }
        }, {
          text: this.translateService.instant("CONVERSATIONS.NEW_MSG.ATTACH_PHOTO"),
          cssClass: 'take-photo',
          icon: 'icons-image-photo',
          handler: () => {
            uploadOptions.sourceType = that.camera.PictureSourceType.PHOTOLIBRARY;
            that.uploadService.takeFromCamera(uploadOptions, (error, image) => {
              that.uploadDone.call(that, error, image)
            });
          }
        }
      ]
    });
    actionSheet.present();
  }

  removePhoto(index: number) {
    this.serviceRequestObj.photos.splice(index, 1);
  }
}

