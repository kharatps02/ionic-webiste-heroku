import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CoreModule } from '../../shared/core.module'
import { LoginPage } from './login';
import { RequestLoginLink } from './request-login-link/request-login-link';
import { LoginLinkSent } from './login-link-sent/login-link-sent';
import { RequestLoginError } from './request-login-error/request-login-error';


@NgModule({
    imports: [CoreModule],
    exports: [],
    entryComponents: [LoginPage, RequestLoginLink, LoginLinkSent, RequestLoginError],
    declarations: [LoginPage, RequestLoginLink, LoginLinkSent, RequestLoginError],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginModule { }