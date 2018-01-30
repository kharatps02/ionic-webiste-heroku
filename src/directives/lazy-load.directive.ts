import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  OnInit, OnDestroy, Renderer2
} from '@angular/core';
import { ImageCacheService } from "../providers/image-cache-service";
import { CONSTANTS } from "../shared/config";


/**
 * This directive is charge of cache the images and emit a loaded event
 */
@Directive({
  selector: '[lazy-load]'
})
export class LazyLoadDirective implements OnInit, OnDestroy {

  @Input('inputSrc') src = '';
  @Input('lowData') lowData: boolean;
  @Output() loaded = new EventEmitter();

  public loadEvent: any;
  public errorEvent: any;

  constructor(public el: ElementRef,
    public imgCacheService: ImageCacheService,
    public renderer: Renderer2) { }

  ngOnInit() {
    // get img element
    const nativeElement = this.el.nativeElement;
    const render = this.renderer;

    // add load listener
    this.loadEvent = render.listen(nativeElement, 'load', () => {
      render.addClass(nativeElement, 'loaded');
      this.loaded.emit();
    });

    this.errorEvent = render.listen(nativeElement, 'error', () => {
      nativeElement.remove();
    });

    if (this.src === CONSTANTS.PLACEHOLDER_IMAGES.PROFILE_PIC) {
      render.setAttribute(nativeElement, 'src', this.src);
    } else {
      this.imgCacheService.isCached(this.src).then((value) => {
        if (value) {
          console.log("===Load cached image");
          this.imgCacheService.cacheImage(this.src).then((value) => {
            render.setAttribute(nativeElement, 'src', value);
          });
        }else if (this.lowData){
          console.log("===Low Data Image");
        } else{
          console.log("===Low Normal Image");
          this.imgCacheService.cacheImage(this.src).then((value) => {
            render.setAttribute(nativeElement, 'src', value);
          });
        }
      });
    }
  }

  ngOnDestroy() {
    // remove listeners
    this.loadEvent();
    this.errorEvent();
  }

}
