import { Transfer, TransferObject, FileUploadOptions } from '@ionic-native/transfer';
import { Camera } from '@ionic-native/camera';
import { Crop } from '@ionic-native/crop';
import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, ActionSheetController, AlertController, Content } from 'ionic-angular';
import { EditProfile } from './edit-profile/edit-profile';
import { UserService, IUser } from '../../../providers/user-service';
import { LoaderService } from '../../../providers/loader-service';
import { ENVIRONMENT } from '../../../shared/environment';
import { CONSTANTS } from '../../../shared/config';
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html'
})
export class Profile {
  public userObj: IUser;
  @ViewChild(Content) content: Content;
  constructor(public navCtrl: NavController, private navParams: NavParams, public actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController, private userService: UserService, private translateService: TranslateService,
    private loaderService: LoaderService, private analyticsService: AnalyticsService,
    private transfer: Transfer, private camera: Camera, private crop: Crop) {
    this.userObj = JSON.parse(JSON.stringify(this.navParams.get('userData')));
  }

  ionViewDidEnter() {
    //this.initUserObj();    
    this.content.resize();
    this.userService.setCurrentPage(CONSTANTS.PAGES.MY_STUFF_PROFILE);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.MY_STUFF_PROFILE);
    this.userObj = JSON.parse(JSON.stringify(this.userService.getUserProfile()));
  }

  ionViewDidLoad() {
    this.content.resize();
  }

  navigatToEditProfile() {
    this.navCtrl.push(EditProfile, { userData: this.userObj });
  }

  uploadFileOnserver(fileURI, callback): void {
    const fileTransfer: TransferObject = this.transfer.create();
    let fileUploadOptions: FileUploadOptions = {
      fileKey: 'file',
      fileName: this.getFileName(fileURI),
      httpMethod: 'POST'
    };

    if (!fileUploadOptions.headers) {
      fileUploadOptions.headers = {
        'Authorization': 'Bearer ' + this.userService.http.token,
        source: CONSTANTS.UPLOAD_IMAGE_SOURCE.PROFILE, user_id: this.userObj.user_id
      };
    }
    let uploadEndpoint: string = ENVIRONMENT.APP_BASE_URL + '/listing/uploadImage';
    // // console.log('In uploadFileOnserver fileUrl', fileURI, uploadEndpoint, fileUploadOptions);
    if (!this.userService.isOnline()) {
      callback(this.translateService.instant('ERROR_MESSAGES.NO_NETWORK'));
    } else {
      fileTransfer.upload(fileURI, uploadEndpoint, fileUploadOptions).then((data: any) => {
        // // console.log('In uploadFileOnserver success', data)
        if (callback) {
          let response = JSON.parse(data.response);
          // // console.log("Image respinse", response);
          callback(null, response.image_url);
        }
      }, (err) => {
        if (callback) {
          callback(err);
        }
      })
      fileTransfer.onProgress((state: ProgressEvent) => {
        // console.log(state);
      });
    }
  }

  getFileName(fileURI): string {
    let fileNameTemp, fileExt = 'jpg', fileName;
    if (fileURI.indexOf('.') !== -1 && fileURI.indexOf('?') !== -1) {
      fileNameTemp = fileURI.split('.').pop();
      fileExt = fileNameTemp.split('?')[0];
    }
    fileName = this.userObj.user_name + new Date().getTime() + '.' + fileExt;
    return fileName;
  }

  takeFromCamera(source): void {
    // console.log('Take pic from Camera');
    this.camera.getPicture({
      quality: 100,
      destinationType: this.camera.DestinationType.FILE_URI,
      sourceType: source,
      allowEdit: false,
      encodingType: this.camera.EncodingType.JPEG,
      targetWidth: 600,
      targetHeight: 338,
      mediaType: this.camera.MediaType.PICTURE,
      saveToPhotoAlbum: true,
      correctOrientation: true
    }).then(imageData => {
      this.crop.crop(imageData, { quality: 100 }).then((croppedimageData) => {
        this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.UPLOADING'));
        this.uploadFileOnserver(croppedimageData, (error, image_url) => {
          if (!error) {
            this.userObj.profile.profile_pic = image_url;
            this.userService.updateUserInfo(this.userObj).subscribe((res: any) => {
              if (res.status == 'SUCCESS') {
                this.userService.setUserProfile(this.userObj);
                this.loaderService.dismissLoader();
                // // console.log(res, "response from userService.updateUserInfo");
              } else {
                let alert = this.alertCtrl.create({
                  title: this.translateService.instant('ERROR_MESSAGES.ERROR_TITLE'),
                  subTitle: res.message,
                  buttons: [{
                    text: this.translateService.instant('MISC.DISMISS')
                  }],
                  enableBackdropDismiss: false,
                  cssClass: 'alert-single'
                });
                alert.present();
              }
            }, error => {
              this.loaderService.showToaster(error);
              this.loaderService.dismissLoader();
            });
          } else {
            this.loaderService.showToaster(error);
            this.loaderService.dismissLoader();
          }
        });
      }, error => {
        // console.log('ERROR ->' + JSON.stringify(error));
      });
    });
  }

  presentActionSheet(): void {
    let actionSheet = this.actionSheetCtrl.create({
      cssClass: 'photo-sheet',
      buttons: [
        {
          text: this.translateService.instant("CONVERSATIONS.NEW_MSG.TAKE_PHOTO"),
          role: 'Take a photo',
          cssClass: 'take-photo',
          icon: 'icons-camera',
          handler: () => {
            this.takeFromCamera(this.camera.PictureSourceType.CAMERA);
          }
        }, {
          text: this.translateService.instant("CONVERSATIONS.NEW_MSG.ATTACH_PHOTO"),
          cssClass: 'take-photo',
          icon: 'icons-image-photo',
          handler: () => {
            this.takeFromCamera(this.camera.PictureSourceType.PHOTOLIBRARY);
          }
        }
      ]
    });
    actionSheet.present();
  }
}





