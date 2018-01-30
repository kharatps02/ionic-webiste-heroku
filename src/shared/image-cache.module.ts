import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LazyLoadDirective } from "../directives/lazy-load.directive";
import { LazyImgComponent } from "../components/lazy-img/lazy-img.component";
import { ImageCacheService } from "../providers/image-cache-service";
import { KeyboardAttachDirective } from "../directives/keyboard-attach.directive";
import { Autoresize } from "../directives/auto-resize.directive";
import { LocalizedDatePipe } from '../directives/localized-date-pipe.directive';


@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [
        LazyLoadDirective,
        LazyImgComponent,
        KeyboardAttachDirective,
        LocalizedDatePipe,
        Autoresize
        
    ],
    providers: [ImageCacheService],
    exports: [
        LazyImgComponent,
        KeyboardAttachDirective,
        LocalizedDatePipe,
        Autoresize
    ]
})

export class ImageCacheModule { }