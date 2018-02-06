import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavParams, ViewController, Platform } from 'ionic-angular';
import Cropper from 'cropperjs';

@Component({
  selector: 'crop-image',
  templateUrl: 'crop-image.html'
})
export class CropImageModal {
  @ViewChild('image') input: ElementRef;
  imageBase64: any;
  width: number;
  height: number;
  cropper: Cropper;

  constructor(public viewCtrl: ViewController, public navParams: NavParams,  private platform: Platform) {
    let filePath: string = this.navParams.get("imageBase64");
    filePath = filePath.replace(/^file:\/\//, '');
    this.imageBase64 = filePath;
    this.width = this.navParams.get("width");
    this.height = this.navParams.get("height");
  }

  cropperLoad() {
    this.cropper = new Cropper(this.input.nativeElement, {
      dragMode: 'crop',
      aspectRatio: this.width / this.height,
      modal: true,
      guides: true,
      highlight: true,
      center: true,
      background: false,
      autoCrop: true,
      movable: false,
      zoomable: false,
      autoCropArea: 1,
      responsive: true,
      cropBoxMovable: true,
      cropBoxResizable: true,
      scalable: false,
      minCropBoxWidth :this.width,
      minCropBoxHeight: this.height,
      crop: (e: Cropper.CropperCropEvent) => {}
    });
  }

  cropperReset() { this.cropper.reset() }

  imageRotate() { this.cropper.rotate(90); }

  cancel() { this.viewCtrl.dismiss(); }

  finish() {
    let croppedImgB64String: string = this.cropper.getCroppedCanvas({
    }).toDataURL('image/jpeg', 1);
    this.viewCtrl.dismiss(croppedImgB64String);
  }
}
