import { Component } from "@angular/core";
import { NavController, NavParams, Events, ViewController } from "ionic-angular";
import { UserService, IBranch } from "../../../../providers/user-service";
import { TranslateService } from "@ngx-translate/core";
import { CreatePlacementFeedPage } from "../create-placement-feed";
import { ActivityService, IGetUserSegmentRequest, IUserSegment, IFeedTemplate, IPlacementInfo } from "../../activity-service";
import { populateNodeData } from "ionic-angular/components/virtual-scroll/virtual-util";
import { CONSTANTS } from "../../../../shared/config";



@Component({
    selector: 'select-image',
    templateUrl: 'select-image.html',
})
export class SelectImage {

    private activity: IFeedTemplate;
    private organisationID: string;
    private imageCategory: string;
    private libraryImages: Array<string> = [];

    constructor(private activityService: ActivityService, public navCtrl: NavController, private params: NavParams,
        private userService: UserService, private events: Events, private translateService: TranslateService, public viewCtrl: ViewController) {
        this.organisationID = this.params.get('organisationId');
        this.imageCategory = this.params.get('imageCategory');
        this.activityService.getImageLibraryData(this.organisationID, this.imageCategory).subscribe((response: any) => {
            this.libraryImages = response.result;
        });
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }

    selectImage(position: number) {
        this.viewCtrl.dismiss({ selectedImage: this.libraryImages[position], imageType: this.imageCategory });
    }
}
