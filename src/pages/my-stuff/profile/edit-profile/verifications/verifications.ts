import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { IUser } from '../../../../../providers/user-service';

@Component({
  selector: 'page-verifications',
  templateUrl: 'verifications.html'
})
export class Verifications {
  public userObj: IUser;
  constructor(public navCtrl: NavController, private navParams: NavParams) {
      this.userObj = this.navParams.get('userData');
   }

  ionViewDidLoad() {
    // console.log('Hello Verifications Page');
  }  
}

