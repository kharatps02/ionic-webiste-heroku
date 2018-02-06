import { Component } from "@angular/core";
import { NavController, NavParams, Events, ActionSheetController, ModalController } from "ionic-angular";
import { UserService, IBranch } from "../../../providers/user-service";
import { TranslateService } from "@ngx-translate/core";
import { LoaderService } from "../../../providers/loader-service";
import { ActivityService, IGetUserSegmentRequest, IUserSegment, IFeedTemplate, ICreateFeed, IPlacementInfo, IScheduledInfo } from "../activity-service";
import { DescriptionFeedPage } from './../create-placement-feed/description-feed/description-feed';
import { Camera } from "@ionic-native/camera";
import { UploadService, IUploadOptions } from "../../../providers/upload-service";
import { CropImageModal } from "../../../shared/modals/crop-image/crop-image";
import { ShowImage } from "../../conversations/show-image/show-image";
import { SelectImage } from "./selectImage/select-image";
import { CONSTANTS } from "../../../shared/config";
import { SetDeliveryFeedModal } from "../../../shared/modals/set-delivery-feed/set-delivery-feed";


@Component({
    selector: 'create-placement-feed',
    templateUrl: 'create-placement-feed.html',
})
export class CreatePlacementFeedPage {
    singleSelectRows = [];
    multiSelectRows = [];
    private selectedBranch: IBranch;
    private selectedSegment: string;
    private selectedTemplate: string;
    private feedInfo: IFeedTemplate;
    private placementInfo: IPlacementInfo;
    private scheduledInfo: IScheduledInfo;
    private createFeedRequest: ICreateFeed

    constructor(private activityService: ActivityService, public navCtrl: NavController, private navParams: NavParams, private userService: UserService,
        private events: Events, public actionSheetCtrl: ActionSheetController, private camera: Camera,
        private translateService: TranslateService, private uploadService: UploadService,
        public loaderService: LoaderService, public modalCtrl: ModalController) {
        this.feedInfo = this.getDefaultActivityModel(this.navParams.get('selectedTemplate'), this.navParams.get('selectedSegment'));
        this.selectedBranch = this.navParams.get('selectedBranch');
    }

    ionViewDidEnter() {
    }


    uploadDone(error, url: string, imageCategory: string) {
        if (!error) {
            //this.serviceRequestObj.photos.push(url);
            if (imageCategory === CONSTANTS.FEED_IMAGE_TYPES.LOGO) {
                this.feedInfo.header.leftIconUrl = url;
            } else {
                this.feedInfo.header.bgImageUrl = url;
            }
        }
        console.log(error, url);
    }

    presentActionSheet(imageCategory: string) {
        let that = this;
        let uploadOptions: IUploadOptions = {
            sourceType: that.camera.PictureSourceType.CAMERA, bucketSource: "feeds", cropImage: true,
            targetHeight: imageCategory === CONSTANTS.FEED_IMAGE_TYPES.LOGO ? 100 : 168,
            targetWidth: imageCategory === CONSTANTS.FEED_IMAGE_TYPES.LOGO ? 100 : 312,
            organizationId: this.selectedBranch.organization_id,
            branchId: this.selectedBranch._id,
            imageCategory: imageCategory
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
                            that.uploadDone.call(that, error, image, imageCategory);
                        });
                    }
                }, {
                    text: this.translateService.instant("CONVERSATIONS.NEW_MSG.ATTACH_PHOTO"),
                    cssClass: 'take-photo',
                    icon: 'icons-image-photo',
                    handler: () => {
                        uploadOptions.sourceType = that.camera.PictureSourceType.PHOTOLIBRARY;
                        that.uploadService.takeFromCamera(uploadOptions, (error, image) => {
                            that.uploadDone.call(that, error, image, imageCategory)
                        });
                    }
                },
                {
                    text: this.translateService.instant("CONVERSATIONS.NEW_MSG.LIB_PHOTO"),
                    role: 'Load',
                    cssClass: 'take-photo',
                    icon: 'icons-grid',
                    handler: () => {
                        this.showImageGallery(imageCategory);
                    }
                }
            ]
        });
        actionSheet.present();
    }


    getDefaultActivityModel(template: string, userSegment?: string) {
        return {
            template: template,
            header: {
                leftIconUrl: '',
                leftIconName: '',
                title: '',
                bgImageUrl: ''
            },
            body: {
                headLineText: '',
                detailText: '',
                imageUrl: ''
            },
            openInUrl: '',
            user_segment: userSegment !== undefined ? userSegment : '',
            poll: {
                question: '',
                answer_options: [],
                is_multiselect: false
            },
            is_allow_conversation: false
        };
    }

    presentDescriptionModal() {
        this.placementInfo = {};
        this.placementInfo.title = this.feedInfo.header.title;
        this.placementInfo.description = this.feedInfo.body.detailText;
        this.placementInfo.allowConversation = this.feedInfo.is_allow_conversation;
        this.placementInfo.url = this.feedInfo.openInUrl;
        let descriptionModal = this.modalCtrl.create(DescriptionFeedPage, {
            placementInfo: this.placementInfo, organisationId: this.selectedBranch.organization_id
        });
        descriptionModal.onDidDismiss(data => {
            //console.log(data);
            this.feedInfo.header.title = data.title;
            this.feedInfo.body.headLineText = data.title;
            this.feedInfo.body.detailText = data.description;
            this.feedInfo.openInUrl = data.url;
            this.feedInfo.is_allow_conversation = data.allowConversation;
        });
        descriptionModal.present();
    }

    showImageGallery(imageCategory: string) {
        let imageModel = this.modalCtrl.create(SelectImage, {
            organisationId: this.selectedBranch.organization_id,
            imageCategory: imageCategory
        });
        imageModel.onDidDismiss(data => {
            if (data) {
                if (data.imageType === CONSTANTS.FEED_IMAGE_TYPES.LOGO) {
                    this.feedInfo.header.leftIconUrl = data.selectedImage;
                } else {
                    this.feedInfo.header.bgImageUrl = data.selectedImage;
                }
            }
        });
        imageModel.present();
    }

    // submitCard() {
    //     let that = this;
    //     let params: ICreateFeed = this.activity;
    //     that.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    //     params.branch_id = this.selectedBranch;
    //     params.scheduled_date = undefined;
    //     params.organization_id = this.selectedBranch.organization_id;
    //     params.feed_owner_id = this.userService.userObj.user_id;
    //     params.sender_ref_id = this.userService.userObj.user_id;
    //     params.created_by = this.userService.userObj.user_id;
    //     params.is_campaign_feed = false;
    //     //console.log("Data model ", params)
    //     that.activityService.createFeed(params).subscribe((response: any) => {
    //         that.loaderService.dismissLoader();
    //         const startIndex = that.navCtrl.getActive().index - 1;
    //         that.navCtrl.remove(startIndex, 2);
    //     });
    // }


    setDelivery() {
        let params: ICreateFeed = this.feedInfo;
        params.branch_id = this.selectedBranch;
        //params.scheduled_date = undefined;
        params.organization_id = this.selectedBranch.organization_id;
        params.feed_owner_id = this.userService.userObj.user_id;
        params.sender_ref_id = this.userService.userObj.user_id;
        params.created_by = this.userService.userObj.user_id;
        params.is_campaign_feed = false;

        this.scheduledInfo = {}
        if (this.feedInfo.scheduled_date !== undefined) {
            this.scheduledInfo.scheduledDate = this.feedInfo.scheduled_date;
            this.scheduledInfo.selectedScheduled = "schedule";
        } else {
            this.scheduledInfo.scheduledDate = new Date().toISOString();
            this.scheduledInfo.selectedScheduled = "now";
        }
        this.scheduledInfo.scheduledTime = this.scheduledInfo.scheduledDate;
        let setDeliveryModal = this.modalCtrl.create(SetDeliveryFeedModal, {
            scheduledInfo: this.scheduledInfo, placementFeedRequest: params, feedType: this.feedInfo.template
        });
        setDeliveryModal.onDidDismiss(data => {
            if (!data) {
                const startIndex = this.navCtrl.getActive().index - 1;
                this.navCtrl.remove(startIndex, 2);
            } else {
                this.scheduledInfo.selectedScheduled = data.selectedScheduled;
                this.feedInfo.scheduled_date = data.scheduledDate;
            }
        });
        setDeliveryModal.present();
    }
}

