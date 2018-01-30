// An autoresize directive that works with ion-textarea in Ionic 2
// Usage example: <ion-textarea autoresize [(ngModel)]="body"></ion-textarea>

import { Directive, HostListener, ElementRef } from "@angular/core";

@Directive({
	selector: "ion-textarea[autoresize]" // Attribute selector
})
export class Autoresize {

	@HostListener("input", ["$event.target"])
	onInput(textArea: HTMLTextAreaElement): void {
		//if (this.platform.is('cordova')) {
		this.adjust();
		//}
	}
	constructor(public element: ElementRef) {
	}
	ngOnInit(): void {
		// if (this.platform.is('cordova')) {
		// 	this.adjust();
		// }
	}
	adjust(): void {
		//let textareaEle = this.element.nativeElement.querySelector("textarea");
		this.element.nativeElement.querySelector('textarea').style.height = '0';
		if (this.element) {
			this.element.nativeElement.querySelector('textarea').style.height = this.element.nativeElement.querySelector('textarea').scrollHeight + "px";
			// document.getElementById("chat-text").style.height = (textareaEle.scrollHeight + 16 + "px");
		}
	}
}
