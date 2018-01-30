import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Content, AlertController } from 'ionic-angular';
import { Verifications } from './verifications/verifications';
import { Address } from './address/address';
import { UserService, IUser, IUserMaster } from '../../../../providers/user-service';
import { LoaderService } from '../../../../providers/loader-service';
import { CONSTANTS } from '../../../../shared/config';
import { AnalyticsService } from "../../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";
import { DatePicker } from "@ionic-native/date-picker";
import { dateDifference } from "../../../../shared/util/date";



@Component({
  selector: 'page-edit-profile',
  templateUrl: 'edit-profile.html'
})
export class EditProfile {
  @ViewChild(Content) content: Content;
  public userObj: IUser;
  public userMasterData: IUserMaster;
  private isMasterDetailsLoaded: boolean = false;
  private currentDate: string;
  private phonenumber: string;
  private mask: string = "(999) 999-9999"
  constructor(public navCtrl: NavController, private navParams: NavParams, private userService: UserService,
    private alertCtrl: AlertController, private translateService: TranslateService, private datePicker: DatePicker,
    private analyticsService: AnalyticsService, private loaderService: LoaderService) {
    this.userMasterData = {
      _id: '',
      deeplink_base_url: '',
      language: [],
      education_level: [],
      annual_income: [],
      gender: [],
      service_interest: []
    };
    this.currentDate = new Date().toISOString();
    // this.maxDate = new Date().setFullYear(new Date().getFullYear() - 1);
    this.initMasterDetails();
    this.userObj = JSON.parse(JSON.stringify(this.navParams.get('userData')));
    this.phonenumber = this.userObj.profile.phone_number;
    this.formatPhone();
  }

  ionViewDidLoad() {
    this.content.resize();
    this.userService.setTempUserProfileObj(this.userObj);
  }

  ionViewDidEnter() {
    this.content.resize();
    this.userService.setCurrentPage(CONSTANTS.PAGES.EDIT_PROFILE);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.EDIT_PROFILE);
    this.userObj = this.userService.getTempUserProfileObj();

  }

  initMasterDetails(): void {
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.userService.getDataFromUserMaster().subscribe((response: any) => {
      // // console.log('<<response>>', response);
      if (response.status !== 'ERROR') {
        this.isMasterDetailsLoaded = true;
        this.userMasterData = response.userMaster[0];
        this.userMasterData.service_interest = this.userMasterData.service_interest.sort(this.sortServiceInterest);
      } else {
        // // console.log('Error in getDataFromUserMaster', response);
        this.loaderService.showToaster(response.message);
      }
      this.loaderService.dismissLoader();
    }, error => {
      this.loaderService.showToaster(error);
      this.loaderService.dismissLoader();
    });
  }

  navigateToVerification(): void {
    this.navCtrl.push(Verifications, { userData: this.userObj });
  }

  saveToBackend(): void {
    // // console.log("save call to backend");
    // // console.log(this.userObj, "userobjToBackend");
    this.userObj.profile.age = parseInt('' + this.userObj.profile.age);
    let phoneValidator: boolean = this.validatePhone();
    let nameValidator: boolean = this.validateNameFields();
    if (nameValidator && phoneValidator) {
      this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
      this.userService.updateUserInfo(this.userObj).subscribe((res: any) => {
        if (res.status == 'SUCCESS') {
          // // console.log(res, "response from userService.updateUserInfo");
          this.userService.setUserProfile(this.userObj);
          this.navCtrl.pop();
        } else {
          let alert = this.alertCtrl.create({
            title: this.translateService.instant('ERROR_MESSAGES.ERROR_TITLE'),
            subTitle: res.message,
            buttons: [{
              text: this.translateService.instant('MISC.DISMISS')
            }],
            enableBackdropDismiss: false
          });
          alert.present();
        }
        this.loaderService.dismissLoader();
      }, error => {
        // // console.log("ERROR::", error);
        this.loaderService.showToaster(error);
        this.loaderService.dismissLoader();
      });
    }


  }

  navigatTo(pageName): void {
    console.log(this.userObj.profile.phone_number);
    console.log(this.phonenumber.replace(/\D+/g, ''));
    switch (pageName) {
      case 'Address':
        this.navCtrl.push(Address, { userData: this.userObj });
        break;
    }
  }

  calculateAge(birthday): number { // birthday is a date
    let ageDifMs = Date.now() - birthday.getTime();
    let ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  dateSelectionEvent(e): void {
    // console.log("currentDate", this.currentDate);
    // console.log("this.userObj.profile.date_of_birth", this.userObj.profile.date_of_birth);
    // console.log("Selection event", this.userObj.profile.date_of_birth > this.currentDate);
    if ((this.userObj.profile.date_of_birth > this.currentDate)) {
      this.userObj.profile.date_of_birth = new Date().toISOString();
      this.loaderService.showToaster(this.translateService.instant('YOUR_STUFF.PROFILE.MESSAGES'));
    } else {
      this.userObj.profile.age = this.calculateAge(new Date(this.userObj.profile.date_of_birth));
    }
  }


  dateSelection() {
    let that = this;
    this.datePicker.show({
      date: new Date(),
      mode: 'date',
      locale: this.userService.getCurrentLang(),
      cancelButtonLabel: that.translateService.instant('CONVERSATIONS.CANCEL'),
      doneButtonLabel: that.translateService.instant('CONVERSATIONS.OK')
    }).then(
      date => {
        //('Got date: ', date, 'that.currentDate', that.currentDate);
        //console.log(dateDifference(that.currentDate, date));
        if (date) {
          if (dateDifference(that.currentDate, date) <= 0) {
            that.loaderService.showToaster(that.translateService.instant('YOUR_STUFF.PROFILE.MESSAGES.DOB_ERROR'));
          } else {
            that.userObj.profile.date_of_birth = date.toISOString();
            that.userObj.profile.age = that.calculateAge(date);
          }
        }
      },
      err => console.log('Error occurred while getting date: ', err)
      );
  }

  validateNameFields() {
    if ((this.userObj.profile.first_name.trim().length > 0 && this.userObj.profile.last_name.trim().length > 0)) {
      return true
    } else {
      this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.NAME_VALIDATION'));
      return false;
    }
  }

  validatePhone() {
    if (this.phonenumber.length > 0) {
      let phonePattern = /^(\([0-9]{3}\) |[0-9]{3}-)[0-9]{3}-[0-9]{4}/;
      if (phonePattern.test(this.phonenumber)) {
        this.userObj.profile.phone_number = this.phonenumber.replace(/\D+/g, '');
        return true;
      } else {
        //TODO - Replace this with phone message 
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.PHONE_VALIDATION'));
        return false;
      }
    } else {
      return true;
    }
  }

  formatPhone() {
    console.log(this.phonenumber);
    this.phonenumber = this.format(this.phonenumber);
    console.log(this.phonenumber);
  }
  private format(v: string): string {
    let s: string = '';

    var matches = v.match(/[a-zA-Z0-9]+/g);
    if (matches !== null) {
      let value = matches.join('').split('');

      var chars = this.mask.split('');
      for (let c of chars) {
        if (value.length === 0) {
          break;
        }

        switch (c) {
          case '#':
            s += value[0];
            value = value.slice(1);
            break;

          case '9':
            if (value[0].match(/\d/) !== null) {
              s += value[0];
              value = value.slice(1);
            }
            break;

          case 'A':
            if (value[0].match(/[a-zA-Z]/) !== null) {
              s += value[0];
              value = value.slice(1);
            }
            break;

          default:
            s += c;
        }
      }
    }

    return s;
  }

  sortServiceInterest(a: IServiceInterest,b:IServiceInterest){
    return a.name > b.name ? 1 : -1
  }
  
}
export interface IServiceInterest {
  _id: string;
  name: string;
}
