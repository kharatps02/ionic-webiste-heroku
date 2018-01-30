import { Directive, ElementRef, Input } from '@angular/core';
import { Content, Platform, Events } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';
import { Subscription } from 'rxjs/Rx';

/**
 * @name KeyboardAttachDirective
 * @description
 * The `keyboardAttach` directive will cause an element to float above the
 * keyboard when the keyboard shows. Currently only supports the `ion-footer` element.
 * 
 * ### Notes
 * - This directive requires [Ionic Native](https://github.com/driftyco/ionic-native)
 * and the [Ionic Keyboard Plugin](https://github.com/driftyco/ionic-plugin-keyboard).
 * - Currently only tested to work on iOS.
 * - If there is an input in your footer, you will need to set
 *   `Keyboard.disableScroll(true)`.
 *
 * @usage
 *
 * ```html
 * <ion-content #content>
 * </ion-content>
 * 
 * <ion-footer [keyboardAttach]="content">
 *   <ion-toolbar>
 *     <ion-item>
 *       <ion-input></ion-input>
 *     </ion-item>
 *   </ion-toolbar>
 * </ion-footer>
 * ```
 */

@Directive({
  selector: '[keyboardAttach]'
})
export class KeyboardAttachDirective {
  @Input('keyboardAttach') content: Content;

  private onShowSubscription: Subscription;
  private onHideSubscription: Subscription;
  // private tabHeight: number;

  constructor(private elementRef: ElementRef, private platform: Platform, private events: Events, private keyboard: Keyboard) {
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
  }

  private onShow(e) {
    if (this.platform.is('cordova') && this.platform.is('ios')) {
      let keyboardHeight: number = e.keyboardHeight || (e.detail && e.detail.keyboardHeight);
      this.setElementPosition(keyboardHeight);
    }

    setTimeout(() => {
      window.scrollTo(0, 0);
      this.content.scrollToBottom(0);
      this.keyboard.disableScroll(true);
    },100);
    //this.events.publish(CONSTANTS.APP_EVENTS.KEYBOARD);
  };

  private onHide() {
    this.setElementPosition(0);

  };

  private setElementPosition(pixels: number) {
    if(this.elementRef.nativeElement){
      this.elementRef.nativeElement.style.paddingBottom = pixels + 'px';
    }
    if(this.content){
      this.content.resize();
    }
  }

  // private onShow(e) {
  //   let keyboardHeight: number = e.keyboardHeight || (e.detail && e.detail.keyboardHeight);
  //   this.setElementPosition(keyboardHeight,true);
  // };

  // private onHide() {
  //   this.setElementPosition(0,false);
  // };

  // private setElementPosition(pixels: number,onShow: boolean) {
  //   if(onShow){
  //       let tabElement = <HTMLElement>document.querySelector("#chat-box-footer"), tabElementStyle = tabElement.style;;
  //       // console.log(tabElementStyle.bottom);   
  //       this.tabHeight = parseInt(tabElementStyle.bottom.substring(0,tabElementStyle.bottom.length -2));
  //       pixels = pixels - this.tabHeight;
  //       this.elementRef.nativeElement.style.paddingBottom = pixels + 'px';
  //   }else{
  //       this.elementRef.nativeElement.style.paddingBottom = pixels + 'px';
  //   }
  //   // console.log("setElementPosition - " + pixels);
  //   this.content.resize();
  //}
}