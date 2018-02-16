import { Component } from "@angular/core";
import { NavController, NavParams, Events, AlertController } from "ionic-angular";
import { UserService, IBranch } from "../../../providers/user-service";
import { TranslateService } from "@ngx-translate/core";
import { LoaderService } from "../../../providers/loader-service";
import { ActivityService, IGetUserSegmentRequest, IUserSegment } from "../activity-service";
import { CreatePlacementFeedPage } from "../create-placement-feed/create-placement-feed";
import { CreatePollFeedPage } from "../create-poll-feed/create-poll-feed";
import { CONSTANTS } from "../../../shared/config";
@Component({
    selector: 'create-feed',
    templateUrl: 'create-feed.html',
})
export class CreateFeedPage {

    private userSegments: Array<IUserSegment>;
    private branches: Array<IBranch>;
    private selectedBranch: IBranch;
    private selectedBranchId: string;
    private selectedSegment: string;
    private selectedSegmentName: string;
    private selectedTemplate: string;
    constructor(private activityService: ActivityService, public navCtrl: NavController, private navParams: NavParams, private userService: UserService,
        private events: Events,
        private translateService: TranslateService, private alertCtrl: AlertController,
        public loaderService: LoaderService) {

    }

    ionViewDidEnter() {
        this.branches = this.userService.userObj.branches;
        this.selectedTemplate = this.userService.userObj.feed_templates[0];
    }

    loadUserSegments() {
        let that = this;
        this.selectedSegment = undefined;
        this.selectedSegmentName = '';
        that.loaderService.createLoader(that.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
        let userSegments: Array<IUserSegment> = [];
        let request: IGetUserSegmentRequest = {
            branch_id: that.selectedBranch._id,
            user_id: that.userService.userObj.user_id,
            user_type: that.userService.userObj.user_type
        }
        that.activityService.getUserSegments(request).subscribe((response: any) => {
            //    this.loaderService.dismissLoader();
            if (response && response.usersegment) {
                response.usersegment.forEach((userSegment) => {
                    userSegments.push({ _id: userSegment._id, name: userSegment.name, segment_category: userSegment.segment_category, parent_feed_id: userSegment.parent_feed_id });
                });
                that.userSegments = userSegments;
                console.log(that.userSegments);
            }
            that.loaderService.dismissLoader();
        });
    }
    navigateToSetFeed() {
        console.log(this.selectedTemplate, this.selectedSegment);
        if (this.selectedTemplate === CONSTANTS.TEMPLATE.PLACEMENT) {
            this.navCtrl.push(CreatePlacementFeedPage, { selectedBranch: this.selectedBranch, selectedSegment: this.selectedSegment, selectedTemplate: this.selectedTemplate, organisationId: this.selectedBranch.organization_id });
        } else {
            console.log(this.selectedTemplate);
            this.navCtrl.push(CreatePollFeedPage, { selectedBranch: this.selectedBranch, selectedSegment: this.selectedSegment, selectedTemplate: this.selectedTemplate, organisationId: this.selectedBranch.organization_id });
        }
    }
    onTemplateSelect(template) {
        this.selectedTemplate = template;
    }

    onSegmentList() {
        for (let i = 0; i < this.userSegments.length; i++) {
            //console.log(this.userSegments[i]);
            this.userSegments[i].type = "radio",
                this.userSegments[i].label = this.userSegments[i].name;
            this.userSegments[i].value = this.userSegments[i]._id + "_" + this.userSegments[i].name;
            if (!this.userSegments[i].parent_feed_id) {
                this.userSegments[i].id = "parent-" + i;
            } else {
                this.userSegments[i].id = "child-" + i;
            }
        }
        //console.log(this.userSegments);
        if (this.userSegments.length > 0) {
            let alert = this.alertCtrl.create({
                title: 'Select Segment',
                inputs: this.userSegments,
                buttons: [
                    {
                        text: this.translateService.instant('CONVERSATIONS.CANCEL'),
                        role: 'cancel',
                        handler: data => {
                            console.log('Cancel clicked');
                        }
                    },
                    {
                        text: this.translateService.instant('CONVERSATIONS.OK'),
                        handler: data => {
                            let segmentData = data.split('_');
                            this.selectedSegment = segmentData[0];
                            this.selectedSegmentName = segmentData[1];
                        }
                    }
                ]
            });
            alert.present();
        } else {
            let alert = this.alertCtrl.create({
                title: this.translateService.instant('ERROR_MESSAGES.NO_SEGMENTS'),               
                buttons: [{
                  text: this.translateService.instant('MISC.DISMISS')
                }],
                cssClass: 'alert-single'
              });
            alert.present();
        }


    }

    refreshTarget(): void {
        // let refreshTargetObj = { created_by: this.userId, branch_id: this.userService.selectedBranch._id, segment_type: CONSTANTS.SEGMENT_TYPE.NORMAL };
        // if (this.audienceDetail.segment_category !== CONSTANTS.SEGMENT_CATEGORY.SERVICE_AREA) {
        //   let housingProviderObj = this.getHousingProviderRequestJSON();
        //   Object.assign(refreshTargetObj, housingProviderObj);
        // } else {
        //   Object.assign(refreshTargetObj, this.audienceDetail);
        // }
        // this.activityFeedService.refreshTarget(refreshTargetObj).subscribe((response: any) => {
        //   if (response.status !== CONSTANTS.RESPONSE_STATUS.ERROR) {
        //     this.targetCount = response.targets;
        //     this.setTargetPercentage(response.total_users);
        //   } else {
        //     this.notificationService.showToast(CONSTANTS.RESPONSE_STATUS.ERROR, CONSTANTS.ERROR_MESSAGES.SOMETHING_WENT_WRONG);
        //     this.targetCount = '0';
        //     this.setTargetPercentage(0);
        //   }
        // });
    }


}