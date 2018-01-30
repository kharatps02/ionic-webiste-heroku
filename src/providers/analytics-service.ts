import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { GoogleAnalytics } from '@ionic-native/google-analytics';

// import { GoogleAnalytics } from 'ionic-native';

@Injectable()
export class AnalyticsService {
  isCordovaPlatform: boolean = false;
  constructor(private platform: Platform, private ga: GoogleAnalytics) {
    // console.log('Hello AnalyticsService Provider');
    if (this.platform.is('cordova')) {
      this.isCordovaPlatform = true;
    }
  }

  startTracker(key: string) {
    // console.log('startTracker begin');
    this.ga.startTrackerWithId(key).then(() => {
      //console.log('Google analytics is ready now');
    });
  }

  addCustomDimension(userId: string) {
    if (this.ga && this.isCordovaPlatform) {
      // console.log("addCustomDimension", propertyManager);
      this.ga.addCustomDimension(1, userId).then(() => {
      }).catch(e => console.log('Error addCustomDimension GoogleAnalytics', e));
    }
  }

  enableExceptionReporting(shouldEnable: boolean) {
    if (this.isCordovaPlatform) {
      this.ga.enableUncaughtExceptionReporting(shouldEnable);
    }
  }

  enableDebugMode() {
    if (this.isCordovaPlatform) {
      this.ga.debugMode();
    }
  }
  trackScreenView(title: string, campaignUrl?: string) {
    if (this.isCordovaPlatform) {
      this.ga.trackView(title, campaignUrl).then(() => {
      }).catch(e => console.log('Error trackScreenView GoogleAnalytics', e));
    }
  }

  trackMetric(key: number, value: any) {
    if (this.isCordovaPlatform) {
      this.ga.trackMetric(key, value).then(() => {
      }).catch(e => console.log('Error trackMetric GoogleAnalytics', e));
    }
  }

  trackEvent(category: string, action: string, label?: string, value?: number) {
    if (this.isCordovaPlatform) {
      this.ga.trackEvent(category, action, label, value).then(() => {
      }).catch(e => console.log('Error trackEvent GoogleAnalytics', e));
    }
  }

  setUserId(userId: string) {
    if (this.isCordovaPlatform) {
      this.ga.setUserId(userId).then(() => {
      }).catch(e => console.log('Error setUserId GoogleAnalytics', e));
    }
  }

  setAllowIDFACollection(allow: boolean) {
    if (this.isCordovaPlatform) {
      this.ga.setAllowIDFACollection(allow).then(() => {
      }).catch(e => console.log('Error setAllowIDFACollection GoogleAnalytics', e));
    }
  }
}
