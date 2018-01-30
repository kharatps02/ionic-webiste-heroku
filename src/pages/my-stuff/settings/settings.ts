import { Component } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';
import { UserService, IUser, ICoachMarksSettingsRequest } from '../../../providers/user-service';
import { CONSTANTS } from '../../../shared/config';
import { ENVIRONMENT } from '../../../shared/environment';
import { ChangePassword } from './change-password/change-password';
import { LoaderService } from '../../../providers/loader-service';
import { PubNubService } from '../../../providers/pubnub-service';
import { BlockedUsers } from './blocked-users/blocked-users';
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class Settings {
  public userObj: IUser;
  public appVersion: string = ENVIRONMENT.APP_VERSION_DISPLAY;
  public showCoachMarks: boolean = false;
  public availableLanguages: Array<ILanguages>;
  public currentLanguage;
  public LANGUAGEMAP = {
    'en': [{ "name": "English", "id": "en" },
      { "name": "Spanish", "id": "es" },
      { "name": "Korean", "id": "ko" },
      { "name": "Haitian Creole", "id": "ht" },
      { "name": "Russian", "id": "ru" },
      { "name": "Chinese, Simplified", "id": "zh-CN" },
      { "name": "Chinese, Traditional", "id": "zh-TW" },
      { "name": "Portuguese", "id": "pt" }],
    'ko': [{ "name": "영어", "id": "en" },
      { "name": "스페인어", "id": "es" },
      { "name": "한국어", "id": "ko" },
      { "name": "아이티 크리올", "id": "ht" },
      { "name": "러시아어", "id": "ru" },
      { "name": "중국어 간체", "id": "zh-CN" },
      { "name": "중국 전통", "id": "zh-TW" },
      { "name": "포르투갈어", "id": "pt" }],
    'es': [{ "name": "Inglés", "id": "en" },
      { "name": "Español", "id": "es" },
      { "name": "Coreano", "id": "ko" },
      { "name": "Criollo haitiano", "id": "ht" },
      { "name": "Ruso", "id": "ru" },
      { "name": "Chino (simplificado)", "id": "zh-CN" },
      { "name": "Chino (tradicional)", "id": "zh-TW" },
      { "name": "Portugués", "id": "pt" }],
    'ht': [{ "name": "Angle", "id": "en" },
      { "name": "Panyòl", "id": "es" },
      { "name": "Koreyen", "id": "ko" },
      { "name": "Kreyòl Ayisyen", "id": "ht" },
      { "name": "Ris", "id": "ru" },
      { "name": "Chinwa, Senplifye", "id": "zh-CN" },
      { "name": "Chinwa, tradisyonèl", "id": "zh-TW" },
      { "name": "Pòtigè", "id": "pt" }],
    'ru': [{ "name": "английский", "id": "en" },
      { "name": "испанский", "id": "es" },
      { "name": "Корейский", "id": "ko" },
      { "name": "Гаитянский креольский", "id": "ht" },
      { "name": "русский", "id": "ru" },
      { "name": "Китайский упрощенный", "id": "zh-CN" },
      { "name": "Китайский традиционный", "id": "zh-TW" },
      { "name": "португальский", "id": "pt" }],
    'zh-CN': [{ "name": "英语", "id": "en" },
      { "name": "西班牙语", "id": "es" },
      { "name": "朝鲜的", "id": "ko" },
      { "name": "海地克里奥尔人", "id": "ht" },
      { "name": "俄语", "id": "ru" },
      { "name": "简体中文", "id": "zh-CN" },
      { "name": "中国传统的", "id": "zh-TW" },
      { "name": "葡萄牙语", "id": "pt" }],
    'zh-TW': [{ "name": "英語", "id": "en" },
      { "name": "西班牙語", "id": "es" },
      { "name": "朝鮮的", "id": "ko" },
      { "name": "海地克里奧爾人", "id": "ht" },
      { "name": "俄語", "id": "ru" },
      { "name": "簡體中文", "id": "zh-CN" },
      { "name": "中國傳統的", "id": "zh-TW" },
      { "name": "葡萄牙語", "id": "pt" }],
      'pt': [{ "name": "Inglês", "id": "en" },
      { "name": "Espanhol", "id": "es" },
      { "name": "Coreano", "id": "ko" },
      { "name": "Crioulo Haitiano", "id": "ht" },
      { "name": "Russo", "id": "ru" },
      { "name": "Chinês, Simplificado", "id": "zh-CN" },
      { "name": "Chinês, Tradicional", "id": "zh-TW" },
      { "name": "Português", "id": "pt" }]

  };

  constructor(public navCtrl: NavController, public userService: UserService, private analyticsService: AnalyticsService,
    private translateService: TranslateService, private events: Events,
    private navParams: NavParams, private loaderService: LoaderService, private pubNubService: PubNubService) {
    this.userObj = this.navParams.get('userData');
    this.currentLanguage = this.translateService.currentLang;
    this.availableLanguages = this.LANGUAGEMAP[this.currentLanguage];
    this.availableLanguages = this.availableLanguages.sort(this.sortLanguages);
  }

  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.MY_STUFF_SETTINGS);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.MY_STUFF_SETTINGS);
    this.showCoachMarks = this.userService.userObj.show_coach_marks.all;
  }

  ionViewDidUnload() {
    //console.log("Settings");
  }

  changeNotitficationStatus(): void {
    let notificationObj: Object = { notification_enabled: this.userObj.notification_enabled, _id: this.userObj._id };
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    let pushChannels = this.pubNubService.getPushNotificationChannels();
    this.userService.updateUserInfo(notificationObj).subscribe((res: any) => {
      if (res.status == 'SUCCESS') {
        this.userService.userProfile.notification_enabled = this.userObj.notification_enabled;
        if (!this.userObj.notification_enabled) {
          this.pubNubService.unRegisterDevice(pushChannels, this.userService.deviceToken, this.userService.pushPlatform);
        } else {
          this.pubNubService.registerDevice(pushChannels, this.userService.deviceToken, this.userService.pushPlatform);
        }
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SETTINGS_UPDATED'));
      } else {
        this.loaderService.showToaster(res.message);
      }
      this.loaderService.dismissLoader();
    }, error => {
      // // console.log("ERROR::", error);
      this.loaderService.showToaster(error);
      this.loaderService.dismissLoader();
    });
  }

  changeLowDataSettings(): void {
    let notificationObj: Object = { low_data: this.userObj.low_data, _id: this.userObj._id };
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.userService.updateUserInfo(notificationObj).subscribe((res: any) => {
      if (res.status == 'SUCCESS') {
        this.userService.userObj.low_data = this.userObj.low_data;
        this.userService.userProfile.low_data = this.userObj.low_data;
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SETTINGS_UPDATED'));
      } else {
        this.loaderService.showToaster(res.message);
      } this.loaderService.dismissLoader();
    }, error => {
      // // console.log("ERROR::", error);
      this.loaderService.showToaster(error);
      this.loaderService.dismissLoader();
    });
  }

  changeCoachMarkStatus(): void {
    let coachMarksSettingsRequest: ICoachMarksSettingsRequest;
    let showCoachMarks = { all: true, feed: true, conversation: true, around_me: true, profile: true };
    showCoachMarks.all = showCoachMarks.feed = showCoachMarks.conversation = showCoachMarks.around_me = showCoachMarks.profile = this.showCoachMarks;
    coachMarksSettingsRequest = Object.assign({ user_id: this.userObj.user_id }, { show_coach_marks: showCoachMarks });

    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.userService.setCoachMarkSettings(coachMarksSettingsRequest).subscribe((response) => {
      if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        this.userObj.show_coach_marks = response.show_coach_marks;
        this.userService.setUserProfile(this.userObj);
        this.userService.isCoachSettingsUpdated = true;
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SETTINGS_UPDATED'));
      } else {
        this.loaderService.showToaster(response.message);
      }
      this.loaderService.dismissLoader();
    }, error => {
      this.loaderService.showToaster(error);
      this.loaderService.dismissLoader();
    });
  }

  navigatTo(pageName): void {
    // console.log(pageName);
    switch (pageName) {
      case 'changePassword':
        if (!this.userObj.facebook) {
          this.navCtrl.push(ChangePassword, { userData: this.userObj });
        }
        break;
      case 'blockedUsers':
        this.navCtrl.push(BlockedUsers);
        break;
    }
  }

  onLogout(): void {
    //console.log("---", this.navCtrl.length());
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.LOGGING_OUT'));
    this.userService.logout();
  }

  changeLanguage() {
    this.translateService.use(this.currentLanguage);
    this.userService.setCurrentLang(this.currentLanguage);
    this.pubNubService.setUserLang(this.currentLanguage);
    this.availableLanguages = this.LANGUAGEMAP[this.currentLanguage];
    this.availableLanguages = this.availableLanguages.sort(this.sortLanguages);
    if (this.userService.userObj && this.userService.userObj.user_id) {
      this.userService.updateUserDeviceLang({ user_id: this.userService.userObj.user_id }).subscribe((res) => {
      });
      this.events.publish(CONSTANTS.APP_EVENTS.REFRESH_CONVERSATION);
      this.events.publish(CONSTANTS.APP_EVENTS.LANGUAGE_UPDATE);
    }
  }

  sortLanguages(a: ILanguages,b:ILanguages){
    return a.name > b.name ? 1 : -1
  }

  
}
export interface ILanguages {
  id: string;
  name: string;
}

