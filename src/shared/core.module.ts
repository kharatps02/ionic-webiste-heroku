import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from 'ionic-angular';
import { TranslateModule } from '@ngx-translate/core'
@NgModule({
    imports: [FormsModule, ReactiveFormsModule, IonicModule, TranslateModule],
    exports: [FormsModule, ReactiveFormsModule, IonicModule, TranslateModule],
    declarations: [],
    providers: [],
})
export class CoreModule { }
