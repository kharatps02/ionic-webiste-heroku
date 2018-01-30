import { Component } from "@angular/core";
import { NavController, NavParams, Events } from "ionic-angular";
import { UserService, IBranch } from "../../../providers/user-service";
import { TranslateService } from "@ngx-translate/core";
import { LoaderService } from "../../../providers/loader-service";
import { ActivityService, IGetUserSegmentRequest, IUserSegment } from "../activity-service";
import { CreatePlacementFeedPage } from "../create-placement-feed/create-placement-feed";
import { DescriptionFeedPage } from './../create-placement-feed/description-feed/description-feed';
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
    private selectedTemplate: string = CONSTANTS.TEMPLATE.PLACEMENT;

    constructor(private activityService: ActivityService, public navCtrl: NavController, private navParams: NavParams, private userService: UserService,
        private events: Events,
        private translateService: TranslateService,
        public loaderService: LoaderService) {

    }

    ionViewDidEnter() {
        this.branches = this.userService.userObj.branches;
        //this.loadUserSegments();
    }

    loadUserSegments() {
        let that = this;
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
            }
            that.loaderService.dismissLoader();
        });
    }
    navigateToSetFeed() {
        console.log(this.selectedTemplate);
        if(this.selectedTemplate === CONSTANTS.TEMPLATE.PLACEMENT){
            this.navCtrl.push(CreatePlacementFeedPage, { selectedBranch: this.selectedBranch, selectedSegment: this.selectedSegment, selectedTemplate: this.selectedTemplate, organisationId: this.selectedBranch.organization_id });
        }else{
            console.log(this.selectedTemplate);
            this.navCtrl.push(CreatePollFeedPage, { selectedBranch: this.selectedBranch, selectedSegment: this.selectedSegment, selectedTemplate: this.selectedTemplate, organisationId: this.selectedBranch.organization_id });
        }
    }
    onTemplateSelect(template){
        this.selectedTemplate = template;
    }

}