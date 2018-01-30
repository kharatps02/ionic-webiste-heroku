import { Transfer, TransferObject, FileUploadOptions } from '@ionic-native/transfer';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { Crop } from '@ionic-native/crop'; import { Injectable } from '@angular/core';

import { TranslateService } from "@ngx-translate/core";
import 'rxjs/add/operator/map';
import { UserService, IUser } from './user-service';
import { LoaderService } from './loader-service';
import { ENVIRONMENT } from '../shared/environment';
import { ModalController } from 'ionic-angular';
import { CropImageModal } from '../shared/modals/crop-image/crop-image';

@Injectable()
export class UploadService {
    userData: IUser;
    constructor(private userService: UserService, private loaderService: LoaderService, private transfer: Transfer, private camera: Camera,
        private crop: Crop, private translateService: TranslateService, public modalCtrl: ModalController) {
        this.userData = this.userService.getUser();
    }

    uploadFileOnserver(fileURI: string, uploadOptions: IUploadOptions, callback): void {
        const fileTransfer: TransferObject = this.transfer.create();
        let fileUploadOptions: FileUploadOptions = {
            fileKey: 'file',
            fileName: this.getFileName(fileURI),
            httpMethod: 'POST'
        };

        if (!fileUploadOptions.headers) {
            fileUploadOptions.headers = {
                'Authorization': 'Bearer ' + this.userService.http.token,
                source: uploadOptions.bucketSource, user_id: this.userData.user_id,
                image_category: uploadOptions.imageCategory,
                organization_id: uploadOptions.organizationId,
                branch_id: uploadOptions.branchId
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
            // fileTransfer.onProgress((state: ProgressEvent) => {
            //     // console.log(state);
            // });
        }
    }

    getFileName(fileURI): string {
        let fileNameTemp, fileExt = 'jpg', fileName;
        if (fileURI.indexOf('.') !== -1 && fileURI.indexOf('?') !== -1) {
            fileNameTemp = fileURI.split('.').pop();
            fileExt = fileNameTemp.split('?')[0];
        }
        fileName = this.userData.user_id + new Date().getTime() + '.' + fileExt;
        return fileName;
    }


    takeFromCamera(uploadOptions: IUploadOptions, callback): void {
        const options: CameraOptions = {
            quality: 100,
            destinationType: this.camera.DestinationType.FILE_URI,
            sourceType: uploadOptions.sourceType,
            allowEdit: false,
            encodingType: this.camera.EncodingType.JPEG,
            mediaType: this.camera.MediaType.PICTURE,
            correctOrientation: true
        }

        if (uploadOptions.sourceType === this.camera.PictureSourceType.PHOTOLIBRARY) {
            options['saveToPhotoAlbum'] = false;
        } else {
            options['saveToPhotoAlbum'] = true;
        }

        this.camera.getPicture(options).then(imageData => {
            if (uploadOptions.cropImage) {
                let cropModal = this.modalCtrl.create(CropImageModal, { "imageBase64": imageData, "width": uploadOptions.targetWidth, "height": uploadOptions.targetHeight });
                cropModal.onDidDismiss((croppedImage: any) => {
                    if (croppedImage) {
                        proceedUpload.call(this, croppedImage);
                    }
                });
                cropModal.present();
            } else {
                proceedUpload.call(this, imageData);
            }
        });

        function proceedUpload(imageData) {
            this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.UPLOADING'));
            this.uploadFileOnserver(imageData, uploadOptions, (error, image_url) => {
                if (callback) {
                    callback(error, image_url);
                }
                this.loaderService.dismissLoader();
            });
        }
    }
}


export interface IUploadOptions {
    sourceType: number;
    bucketSource: string;
    cropImage: boolean;
    targetWidth: number,
    targetHeight: number,
    imageCategory?: string;
    organizationId?: string;
    branchId?: string;
}

