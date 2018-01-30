import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CoreModule } from '../../shared/core.module'
import { GetStarted } from './get-started';
import { AppInfo } from './app-info/app-info';
import { ChoosePassword } from './select-password/choose-password/choose-password';
import { SelectPassword } from './select-password/select-password';
import { SignUp } from './sign-up/sign-up';
//import { SelectPasswordDirective } from "../../directives/select-password.directive";
//import { KeyboardGetstartedDirective } from '../../directives/keyboard-getstarted.directive';
import { ImageCacheModule } from "../../shared/image-cache.module";


@NgModule({
    imports: [CoreModule, ImageCacheModule],
    exports: [],
    entryComponents: [GetStarted, AppInfo, ChoosePassword, SelectPassword, SignUp],
    declarations: [GetStarted, AppInfo, ChoosePassword, SelectPassword, SignUp],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GetStartedModule { }