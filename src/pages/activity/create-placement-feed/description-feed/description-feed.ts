import { Component } from "@angular/core";
import { NavController, NavParams, Events, ViewController } from "ionic-angular";
import { UserService, IBranch } from "../../../../providers/user-service";
import { TranslateService } from "@ngx-translate/core";
import { CreatePlacementFeedPage } from "../create-placement-feed";
import { ActivityService, IGetUserSegmentRequest, IUserSegment, IFeedTemplate, IPlacementInfo } from "../../activity-service";
import { populateNodeData } from "ionic-angular/components/virtual-scroll/virtual-util";



@Component({
    selector: 'description-feed',
    templateUrl: 'description-feed.html',
})
export class DescriptionFeedPage {
    private action: string;
    public placementInfo: IPlacementInfo;
    private selectedBranch: IBranch;
    private selectedSegment: string;
    private selectedTemplate: string;
    private activity: IFeedTemplate;
    private organisationID: any;
    private libraryBackImages: Array<string> = [];
    private libraryLogoImages: Array<string> = [];

    constructor(private activityService: ActivityService, public navCtrl: NavController, private params: NavParams,
    private userService: UserService, private events: Events, private translateService: TranslateService, public viewCtrl: ViewController) {
        this.placementInfo = params.get('placementInfo');
        this.selectedBranch = this.params.get('selectedBranch');
        this.organisationID = this.params.get('organisationId');
    }

    dismiss() {
        if (this.validateData()) {
            this.viewCtrl.dismiss(this.placementInfo);
        } else {
            console.log("Please enter valid URL");
        }

    }
    navigateBack() {
        this.navCtrl.setRoot(CreatePlacementFeedPage);
    }

    validateData(): boolean {
        //TODO - Validate URL here 
        return true;
    }


}
