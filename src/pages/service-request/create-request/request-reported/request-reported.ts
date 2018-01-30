import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'page-request-reported',
  templateUrl: 'request-reported.html'
})
export class ServiceRequestReported {
  incidentNumber: string
  constructor(public navCtrl: NavController, private navParams: NavParams) {
    this.incidentNumber = this.navParams.get('incident_no');
  }

  ionViewDidLoad() {
    //console.log('Hello ServiceRequestReported Page',this.incidentNumber);
  }

  navigateToServiceListPage() {
    this.navCtrl.pop();
  }

}
