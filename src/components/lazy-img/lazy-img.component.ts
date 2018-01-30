import { Component, Input } from '@angular/core';

/**
 * Component in charge of lazy load images and cache them
 */
@Component({
  selector: 'lazy-img',
  templateUrl:'lazy-img.html'
})
export class LazyImgComponent {

  @Input() inputSrc: string;
  @Input() lowData: boolean = false;

  public placeholderActive: boolean = true;

}
