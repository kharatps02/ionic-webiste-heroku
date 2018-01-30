import { Injectable } from '@angular/core';
import {
    Http,
    Request,
    ConnectionBackend,
    RequestOptions,
    RequestOptionsArgs,
    Response,
    Headers
} from '@angular/http';
import { CONSTANTS } from '../shared/config';
import { ENVIRONMENT } from '../shared/environment';
import { Observable } from 'rxjs/Observable';
//import { LoaderService } from "./loader-service";
import 'rxjs/Rx';
import { TranslateService } from "@ngx-translate/core";

@Injectable()
export class HttpService extends Http {
    online: boolean;
    token: string;
    defaultRequestParams: IDefaultRequestParams;
    userLangHeader: string;
    constructor(backend: ConnectionBackend, defaultOptions: RequestOptions, private translateService: TranslateService) {
        super(backend, defaultOptions);
        this.online = true;
        this.defaultRequestParams = {
            app_id: CONSTANTS.APP_ID,
            app_version: ENVIRONMENT.APP_VERSION,
            device_id: CONSTANTS.DEVICE_ID,
            device_type: null,
            sys_user_id: null,
            sys_user_type: null
        };
    }

    isOnline(): boolean {
        return this.online;
    }

    /**
     * Performs any type of http request.
     * @param url
     * @param options
     * @returns {Observable<Response>}
     */
    request(url: string | Request, options?: RequestOptionsArgs): Observable<Response> {
        return super.request(url, options);
    }

    /**
     * Performs a request with `get` http method.
     * @param url
     * @param options
     * @returns {Observable<>}
     */
    get(url: string, options?: RequestOptionsArgs): Observable<any> {
        if (this.requestInterceptor()) {
            return super.get(this.getFullUrl(url), this.requestOptions(options))
                .timeout(CONSTANTS.NETWORK_TIMEOUT)
                .catch(this.onCatch)
                .do((res: Response) => {
                    this.onSubscribeSuccess(res);
                }, (error: any) => {
                    this.onSubscribeError(error);
                })
                .finally(() => {
                    this.onFinally();
                });
        } else {
            return Observable.throw('Network not Connected');
        }
    }

    getLocal(url: string, options?: RequestOptionsArgs): Observable<any> {
        return super.get(url, options);
    }

    /**
     * Performs a request with `post` http method.
     * @param url
     * @param body
     * @param options
     * @returns {Observable<>}
     */
    post(url: string, body: any, options?: RequestOptionsArgs): Observable<any> {
        if (this.requestInterceptor()) {
            Object.assign(body, this.defaultRequestParams);
            return super.post(this.getFullUrl(url), body, this.requestOptions(options))
                .timeout(CONSTANTS.NETWORK_TIMEOUT)
                .catch(this.onCatch)
                .do((res: Response) => {
                    this.onSubscribeSuccess(res);
                }, (error: any) => {
                    this.onSubscribeError(error);
                })
                .finally(() => {
                    this.onFinally();
                });
        }
        else {
            return Observable.throw(this.translateService.instant('ERROR_MESSAGES.NO_NETWORK'));
        }
    }

    /**
     * Performs a request with `put` http method.
     * @param url
     * @param body
     * @param options
     * @returns {Observable<>}
     */
    put(url: string, body: string, options?: RequestOptionsArgs): Observable<any> {
        this.requestInterceptor();
        Object.assign(body, this.defaultRequestParams);
        return super.put(this.getFullUrl(url), body, this.requestOptions(options))
            .timeout(CONSTANTS.NETWORK_TIMEOUT)
            .catch(this.onCatch)
            .do((res: Response) => {
                this.onSubscribeSuccess(res);
            }, (error: any) => {
                this.onSubscribeError(error);
            })
            .finally(() => {
                this.onFinally();
            });
    }

    /**
     * Performs a request with `delete` http method.
     * @param url
     * @param options
     * @returns {Observable<>}
     */
    delete(url: string, options?: RequestOptionsArgs): Observable<any> {
        this.requestInterceptor();
        return super.delete(this.getFullUrl(url), this.requestOptions(options))
            .timeout(CONSTANTS.NETWORK_TIMEOUT)
            .catch(this.onCatch)
            .do((res: Response) => {
                this.onSubscribeSuccess(res);
            }, (error: any) => {
                this.onSubscribeError(error);
            })
            .finally(() => {
                this.onFinally();
            });
    }


    /**
     * Request options.
     * @param options
     * @returns {RequestOptionsArgs}
     */
    private requestOptions(options?: RequestOptionsArgs): RequestOptionsArgs {
        if (options == null) {
            options = new RequestOptions();
        }
        if (options.headers == null) {
            options.headers = new Headers({
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.token,
                'Accept-Language': this.userLangHeader,
                'accept-version': this.defaultRequestParams.app_version
            });
        }
        return options;
    }

    /**
     * Build API url.
     * @param url
     * @returns {string}
     */
    private getFullUrl(url: string): string {
        // return full URL to API here
        return url;
    }

    /**
     * Request interceptor.
     */
    private requestInterceptor(): boolean {
        if (this.online) {
            // console.log("Network Connected");
            return true;
        } else {
            // console.log("Network Disconnected");
            return false;
        }
    }

    /**
     * Response interceptor.
     */
    private responseInterceptor(): void {
        //// console.log('In responseInterceptor');
        // this.loaderService.hidePreloader();
    }

    /**
     * Error handler.
     * @param error
     * @param caught
     * @returns {ErrorObservable}
     */
    private onCatch(error: any, caught: Observable<any>): Observable<any> {
        return Observable.throw(error);
    }

    /**
     * onSubscribeSuccess
     * @param res
     */
    private onSubscribeSuccess(res: Response): void {
        // // console.log('In onSubscribeSuccess', res);
    }

    /**
     * onSubscribeError
     * @param error
     */
    private onSubscribeError(error: any): void {
        //  // console.log('In onSubscribeError', error);
    }

    /**
     * onFinally
     */
    private onFinally(): void {
        this.responseInterceptor();
    }
}

export interface IDefaultRequestParams {
    app_id: string;
    app_version: string;
    device_id: string;
    device_type: string;
    sys_user_id: string;
    sys_user_type: string;
    device_model?: string;
    os_version?: string;
}