import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonicApp, IonicModule, Platform } from 'ionic-angular';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core'
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpModule, Http, XHRBackend, RequestOptions } from '@angular/http';
import { IonicStorageModule } from '@ionic/storage';
import { BrowserModule } from '@angular/platform-browser';

import { Toast } from '@ionic-native/toast'
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Push } from '@ionic-native/push';
import { Keyboard } from '@ionic-native/keyboard';
import { Deeplinks } from '@ionic-native/deeplinks';
import { Network } from '@ionic-native/network';

import { Transfer } from '@ionic-native/transfer';
import { MediaCapture } from '@ionic-native/media-capture';
import { Facebook } from '@ionic-native/facebook';
import { Crop } from '@ionic-native/crop';
import { Camera } from '@ionic-native/camera';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { CallNumber } from '@ionic-native/call-number';
import { GoogleAnalytics } from '@ionic-native/google-analytics'
import { DatePicker } from '@ionic-native/date-picker'

import { RezApp } from './app.component';
import { HomeTabs } from '../pages/home-tabs/home-tabs';
import { ActivityFeedModule } from '../pages/activity/activity-feed.module';
import { AroundMeModule } from '../pages/aroundme/aroundme.module';
import { MyStuffModule } from '../pages/my-stuff/my-stuff.module';
import { ConversationModule } from '../pages/conversations/conversations.module';
import { LoginModule } from '../pages/login/login.module';
import { GetStartedModule } from '../pages/get-started/get-started.module';
import { ServiceRequestModule } from '../pages/service-request/service-request.module';
import { HttpService } from '../providers/http-service';
import { LoaderService } from '../providers/loader-service';
import { StorageService } from '../providers/storage-service';
import { AnalyticsService } from '../providers/analytics-service';
import { UserService } from '../providers/user-service';
import { PubNubService } from '../providers/pubnub-service';
import { KeyboardTabHandler } from "../directives/keyboard-tab-handler-directive";
import { SocialSharing } from "@ionic-native/social-sharing";
import { TextToSpeech } from "@ionic-native/text-to-speech";
import { Device } from '@ionic-native/device';

@NgModule({
  declarations: [
    RezApp,
    HomeTabs,
    KeyboardTabHandler,

  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(RezApp, {
      tabsPlacement: 'bottom',
      tabsHideOnSubPages: 'true',
      activator: "ripple",
      swipeBackEnabled: "false"
    }),
    IonicStorageModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [Http]
      }
    }),
    ActivityFeedModule,
    AroundMeModule,
    MyStuffModule,
    ConversationModule,
    LoginModule,
    GetStartedModule,
    ServiceRequestModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    RezApp,
    HomeTabs
  ],
  providers: [{
    provide: HttpService,
    useFactory: httpServiceHelperFactory,
    deps: [XHRBackend, RequestOptions, Platform]
  }, Toast, SplashScreen, StatusBar, Deeplinks, Network,
    Keyboard, Camera, Transfer, MediaCapture, GoogleAnalytics, DatePicker,
    Push, Facebook, Crop, InAppBrowser, CallNumber, SocialSharing, TextToSpeech, Device,
    PubNubService, UserService, AnalyticsService, StorageService, LoaderService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class AppModule { }
export function httpServiceHelperFactory(xhrBackend: XHRBackend, requestOptions: RequestOptions, platform: Platform, translateService: TranslateService) {
  return new HttpService(xhrBackend, requestOptions, translateService);
}
export function createTranslateLoader(http: Http) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}