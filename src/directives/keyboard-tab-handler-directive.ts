import { Directive, Input } from '@angular/core';
import { Content, Platform } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';
import { Subscription } from 'rxjs/Rx';


@Directive({
  selector: '[keyboard-tab-handler]'
})
export class KeyboardTabHandler {
  @Input('keyboard-tab-handler') content: Content;

  private onShowSubscription: Subscription;
  private onHideSubscription: Subscription;
  // private tabHeight: number;

  constructor(private platform: Platform, private keyboard: Keyboard) {
    if (this.platform.is('cordova')) {
      this.onShowSubscription = this.keyboard.onKeyboardShow().subscribe(e => this.onShow(e));
      this.onHideSubscription = this.keyboard.onKeyboardHide().subscribe(() => this.onHide());
    }
  }

  ngOnDestroy() {
    if (this.onShowSubscription) {
      this.onShowSubscription.unsubscribe();
    }
    if (this.onHideSubscription) {
      this.onHideSubscription.unsubscribe();
    }
    // console.log("keyboard-open' ngOnDestroy")
  }

  private onShow(e) {
    // let keyboardHeight: number = e.keyboardHeight || (e.detail && e.detail.keyboardHeight);
    // this.setElementPosition(keyboardHeight);
    // console.log("Keyboard Show");
    document.body.classList.add('keyboard-open');
  };

  private onHide() {
    // this.setElementPosition(0);
    // console.log("Keyboard Hide");
    if (document.body.classList.contains('keyboard-open')) {
      document.body.classList.remove('keyboard-open');
    } else {
      // console.log("keyboard-open' does not exist")
    }
  };
}