import { Component } from "@angular/core";
import { NavController, NavParams, Events, ActionSheetController, ModalController } from "ionic-angular";
import { UserService, IBranch } from "../../../providers/user-service";
import { TranslateService } from "@ngx-translate/core";
import { LoaderService } from "../../../providers/loader-service";
import { ActivityService, IGetUserSegmentRequest, IUserSegment, IFeedTemplate, ICreateFeed, IPollInfo, ICreatePollFeed, IScheduledInfo } from "../activity-service";
import { PollDescriptionPage } from './poll-description/poll-description';
import { populateNodeData } from "ionic-angular/components/virtual-scroll/virtual-util";
import { UploadService, IUploadOptions } from "../../../providers/upload-service";
import { CONSTANTS } from "../../../shared/config";
import { SetDeliveryFeedModal } from "../../../shared/modals/set-delivery-feed/set-delivery-feed";


@Component({
    selector: 'create-poll-feed',
    templateUrl: 'create-poll-feed.html',
})
export class CreatePollFeedPage {
    singleSelectRows = [];
    multiSelectRows = [];
    private selectedBranch: IBranch;
    private selectedSegment: string;
    private selectedTemplate: string;
    private pollInfo: IPollInfo;
    private feedTemplates = ['Placement', 'Poll'];
    public singleSelection: any = 'singleSelection';
    public multiSelection: any = 'multiSelection';
    private scheduledInfo: IScheduledInfo;

    constructor(private activityService: ActivityService, public navCtrl: NavController, private navParams: NavParams, private userService: UserService,
        private events: Events, private translateService: TranslateService, private uploadService: UploadService,
        public loaderService: LoaderService, public modalCtrl: ModalController) {
        this.pollInfo = this.getDefaultActivityModel(this.navParams.get('selectedTemplate'), this.navParams.get('selectedSegment'));
        this.selectedBranch = this.navParams.get('selectedBranch');
    }

    getDefaultActivityModel(template: string, userSegment?: string) {
        return {
            template: template,
            user_segment: userSegment !== undefined ? userSegment : '',
            question: '',
            answer_options: [],
            is_multiselect: false
        };
    }

    pollDescriptionModal() {
        let descriptionModal = this.modalCtrl.create(PollDescriptionPage, { pollInfo: this.pollInfo, });
        descriptionModal.onDidDismiss(data => {
            this.pollInfo.question = data.question;
            this.pollInfo.answer_options = data.answer_options;
            this.pollInfo.is_multiselect = data.is_multiselect;
        });
        descriptionModal.present();
    }


    setDelivery() {
        let params: ICreatePollFeed = this.pollInfo;
        params.branch_id = this.selectedBranch;
       // params.scheduled_date = undefined;
        params.organization_id = this.selectedBranch.organization_id;
        params.feed_owner_id = this.userService.userObj.user_id;
        params.sender_ref_id = this.userService.userObj.user_id;
        params.created_by = this.userService.userObj.user_id;
        params.is_campaign_feed = false;
        params.count_answer_option = this.pollInfo.answer_options.length;

        this.scheduledInfo = {}
        if (this.pollInfo.scheduled_date !== undefined) {
            this.scheduledInfo.scheduledDate = this.pollInfo.scheduled_date;
            this.scheduledInfo.selectedScheduled = "schedule";
        } else {
            this.scheduledInfo.scheduledDate = new Date().toISOString();
            this.scheduledInfo.selectedScheduled = "now";
        }
        this.scheduledInfo.scheduledTime = this.scheduledInfo.scheduledDate;
        let setDeliveryModal = this.modalCtrl.create(SetDeliveryFeedModal, {
            scheduledInfo: this.scheduledInfo, pollFeedRequest: params, feedType: this.pollInfo.template
        });
        setDeliveryModal.onDidDismiss(data => {
            if (!data) {
                const startIndex = this.navCtrl.getActive().index - 1;
                this.navCtrl.remove(startIndex, 2);
            } else {
                this.scheduledInfo.selectedScheduled = data.selectedScheduled;
                this.pollInfo.scheduled_date = data.scheduledDate;
            }
        });
        setDeliveryModal.present();
    }


    // submitCard() {
    //     let that = this;
    //     let params: ICreatePollFeed = this.pollInfo;
    //     that.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    //     params.branch_id = this.selectedBranch;
    //     params.scheduled_date = undefined;
    //     params.organization_id = this.selectedBranch.organization_id;
    //     params.feed_owner_id = this.userService.userObj.user_id;
    //     params.sender_ref_id = this.userService.userObj.user_id;
    //     params.created_by = this.userService.userObj.user_id;
    //     params.is_campaign_feed = false;
    //     params.count_answer_option = this.pollInfo.answer_options.length;
    //     //console.log("Data model ", params)
    //     that.activityService.createPollFeed(params).subscribe((response: any) => {
    //         that.loaderService.dismissLoader();
    //         const startIndex = that.navCtrl.getActive().index - 1;
    //         that.navCtrl.remove(startIndex, 2);
    //     });
    // }
}
