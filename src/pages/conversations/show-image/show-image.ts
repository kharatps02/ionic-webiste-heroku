import { Component } from '@angular/core';
import { NavController, NavParams, Events, Platform } from 'ionic-angular';
import { CONSTANTS } from '../../../shared/config';
import { AnalyticsService } from "../../../providers/analytics-service";
import { UserService } from "../../../providers/user-service";

@Component({
  selector: 'page-show-image',
  templateUrl: 'show-image.html'
})
export class ShowImage {
  image: string;
  enableButton: boolean;
  messageModel: string;
  enableZoom: boolean;
  constructor(public navCtrl: NavController, private navParams: NavParams, private events: Events, private analyticsService: AnalyticsService,
    private userService: UserService,private platform: Platform) {
    this.image = '';
    this.enableButton = false;
    this.messageModel = '';
    this.enableButton = this.navParams.get('enableSendButton');
    this.image = this.navParams.get('image_content');
    if(this.platform.is('ios')){
      this.image = this.image.replace(/^file:\/\//, '');
    }
    this.enableZoom = this.navParams.get('enableZoom');
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.VIEW_IMAGE);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.VIEW_IMAGE);
  }
  navigateToChatPage() {
    this.navCtrl.pop();
  }

  setAttachement() {
    let data = { 'image': this.image, 'attachement': true, caption: this.messageModel };
    // console.log('In setAttachement', data);
    this.navCtrl.pop();
    this.events.publish(CONSTANTS.APP_EVENTS.CLOSE_IMAGE_PREVIEW, data);
  }

  dismiss() {

  }

}
