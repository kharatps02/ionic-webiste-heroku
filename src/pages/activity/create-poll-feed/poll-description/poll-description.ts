import { Component } from "@angular/core";
import { NavController, NavParams, Events, ViewController } from "ionic-angular";
import { UserService, IBranch } from "../../../../providers/user-service";
import { TranslateService } from "@ngx-translate/core";
import { CreatePollFeedPage } from "../create-poll-feed";
import { ActivityService, IGetUserSegmentRequest, IUserSegment, IFeedTemplate, IPollInfo } from "../../activity-service";
import { populateNodeData } from "ionic-angular/components/virtual-scroll/virtual-util";



@Component({
    selector: 'poll-description',
    templateUrl: 'poll-description.html',
})
export class PollDescriptionPage {
    private action: string;
    public pollInfo: IPollInfo;
    private selectedBranch: IBranch;
    private selectedSegment: string;
    private selectedTemplate: string;
    private activity: IFeedTemplate;
    private organisationID: any;
    private libraryBackImages: Array<string> = [];
    private libraryLogoImages: Array<string> = [];
    private answerType: string;
    multipleRows = [];
    pollAnswerOption: string = '';
    constructor(private activityService: ActivityService, public navCtrl: NavController, private params: NavParams,
        private userService: UserService, private events: Events, private translateService: TranslateService, public viewCtrl: ViewController) {
        this.pollInfo = params.get('pollInfo');
        if (this.pollInfo.is_multiselect) {
            this.answerType = "multiple";
        } else {
            this.answerType = "single";
        }
        console.log(this.pollInfo);
        this.selectedBranch = this.params.get('selectedBranch');
        this.organisationID = this.params.get('organisationId');
    }

    dismiss() {
        if (this.answerType === "single") {
            this.pollInfo.is_multiselect = false;
        } else {
            this.pollInfo.is_multiselect = true;
        }
        this.viewCtrl.dismiss(this.pollInfo);
    }

    onAddOptions() {
        this.pollInfo.answer_options.push(this.pollAnswerOption);
        this.pollAnswerOption = '';
    }
    removeOption(indexNumber: any) {
        this.pollInfo.answer_options.splice(indexNumber, 1);
    }
}