import { Component } from "@angular/core";
import { NavController, NavParams, Events, ViewController, } from "ionic-angular";
import { ActivityService, IScheduledInfo, ICreateFeed, ICreatePollFeed } from "../../../pages/activity/activity-service";
import { TranslateService } from "@ngx-translate/core";
import moment from 'moment';
import { CONSTANTS } from "../../config";
import { LoaderService } from "../../../providers/loader-service";

@Component({
    selector: 'set-delivery-feed',
    templateUrl: 'set-delivery-feed.html',
})

export class SetDeliveryFeedModal {
    private scheduledInfo: IScheduledInfo;
    private placementFeedRequest: ICreateFeed;
    private pollFeedRequest: ICreatePollFeed;
    private feedType: string;
    private deliveryDate: Date;
    constructor(private activityService: ActivityService, public navCtrl: NavController, private params: NavParams,
        private loaderService: LoaderService,
        private events: Events, private translateService: TranslateService, public viewCtrl: ViewController) {
        this.scheduledInfo = params.get('scheduledInfo');
        this.placementFeedRequest = params.get('placementFeedRequest');
        this.pollFeedRequest = params.get('pollFeedRequest');
        this.feedType = params.get('feedType');
        this.scheduledInfo.scheduledDate = moment(this.scheduledInfo.scheduledDate).format();
        this.scheduledInfo.scheduledTime = moment(this.scheduledInfo.scheduledDate).format();
    }

    dismiss() {
        if (this.scheduledInfo.selectedScheduled == CONSTANTS.DELIVERY_TYPE.NOW) {
            this.scheduledInfo.scheduledDate = undefined
        }
        this.viewCtrl.dismiss(this.scheduledInfo);
    }

    validate() {
        if (this.scheduledInfo.selectedScheduled !== CONSTANTS.DELIVERY_TYPE.NOW) {
            let selectedDate = new Date(this.scheduledInfo.scheduledDate);
            let selectedTime = new Date(this.scheduledInfo.scheduledTime);
            let currentDate = new Date();
            selectedDate.setHours(selectedTime.getHours());
            selectedDate.setMinutes(selectedTime.getMinutes());
            selectedDate.setSeconds(selectedTime.getSeconds());
            selectedDate.setMilliseconds(selectedTime.getMilliseconds());

            if (currentDate > selectedDate) {
                this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.INVALID_TIME'));
                return false;
            }
            this.deliveryDate = selectedDate;
        } else {
            this.deliveryDate = undefined;
        }
        return true;
    }

    submitCard() {
        if (this.validate()) {
            let that = this;            
            that.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
            if (that.feedType === CONSTANTS.TEMPLATE.PLACEMENT) {
                that.placementFeedRequest.scheduled_date = that.deliveryDate;
                that.activityService.createFeed(that.placementFeedRequest).subscribe((response: any) => {
                    that.loaderService.dismissLoader();
                    this.scheduledInfo.isSubmit = true;
                    that.viewCtrl.dismiss(this.scheduledInfo);
                });
            } else {
                that.pollFeedRequest.scheduled_date = that.deliveryDate;
                that.activityService.createPollFeed(this.pollFeedRequest).subscribe((response: any) => {
                    this.scheduledInfo.isSubmit = true;
                    that.loaderService.dismissLoader();
                    that.viewCtrl.dismiss(this.scheduledInfo);
                });
            }
        }
    }
}

