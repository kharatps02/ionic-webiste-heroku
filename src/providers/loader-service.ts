import { Injectable } from '@angular/core';
import { LoadingController, Loading, Platform } from 'ionic-angular';
import { Toast } from '@ionic-native/toast'
import 'rxjs/add/operator/map';
import { CONSTANTS } from '../shared/config';

@Injectable()
export class LoaderService {
  private loader: Loading;

  constructor(private loadingCtrl: LoadingController, private platform: Platform, private toast: Toast) {
    // console.log('Hello LoaderService Provider');
  }

  createLoader(message: string, duration: number = CONSTANTS.LOADER_MESSAGE.DURATION): void {
    this.loader = this.loadingCtrl.create({ content: message, duration: duration });
    this.loader.present();
  }

  dismissLoader(): void {
    if (this.loader) {
      this.loader.dismiss();
    }
  }


  showToaster(message: string, position?: string): void {
    if (this.platform.is('cordova')) {
      if (!position) {
        position = CONSTANTS.TOASTER.POSITION_BOTTOM
      }
      this.toast.show(message, CONSTANTS.TOASTER.DURATION, position).subscribe(
        toast => {
          // console.log("Toast message", message);
        });
    }
  }
}
