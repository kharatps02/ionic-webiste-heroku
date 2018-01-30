import { Injectable } from '@angular/core';
import { Events, Platform } from 'ionic-angular';
import { Storage } from '@ionic/storage'
import { Facebook } from '@ionic-native/facebook';
import 'rxjs/add/operator/map';
import { CONSTANTS } from '../shared/config';
import { ENVIRONMENT } from '../shared/environment';
import { HttpService } from './http-service';
import { PubNubService } from '../providers/pubnub-service';
import CryptoJS from "crypto-js";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { LoaderService } from './loader-service';
import { TranslateService } from "@ngx-translate/core";
@Injectable()
export class UserService {
    public http: HttpService;
    public events: Events;
    public platform: Platform;
    public userObj: IUser;
    public pageDetails: IPageDetails;
    public deviceToken: string;
    public pushPlatform: string;
    public channelGroups: Array<string>
    public tempUserProfileObj: IUser;
    public userProfile: IUser;
    public userName: string;
    public isProfileUpdate: boolean = true;
    public isCoachSettingsUpdated: boolean = false;
    public currentLang: string;
    constructor(events: Events, http: HttpService, platform: Platform, public storage: Storage, private pubNubService: PubNubService,
        private translateService: TranslateService,
        private loaderService: LoaderService, private facebook: Facebook) {
        let that = this;
        that.events = events;
        that.http = http;
        that.storage = new Storage({});
        that.pageDetails = { currentPage: "", userid: "" };
        that.platform = platform;
        that.http.token = null;
        that.http.defaultRequestParams.sys_user_id = null;
        that.http.defaultRequestParams.sys_user_type = null;
        that.resetUserObj();
        that.hasLoggedIn().then(function (hasLoggedIn) {
            if (hasLoggedIn) {
                that.loadUser()
            }
        });

        // console.log('[ In UserService ]');
    }

    isOnline() {
        return this.http.isOnline();
    }

    setCurrentLang(lang) {
        this.currentLang = lang;
        if (this.userObj) {
            this.userObj.device_lang = lang;
        }
        if (this.userProfile) {
            this.userProfile.device_lang = lang;
        }
        // set current language so that it will share with each request at backend.
        this.http.userLangHeader = lang;
    }
    getCurrentLang() {
        return this.currentLang;
    }

    login(user: IUser): Observable<any> {
        let that = this;
        //// console.log('In AuthService, login ');
        //This is used to identify source of login to block non admin users on mobile. 
        user.source = "mobile";
        if (!user.authType) {
            user = JSON.parse(JSON.stringify(user));
            user.password = CryptoJS.PBKDF2(user.password, CONSTANTS.CRYPTO_SALT, { keySize: 256 / 32 }).toString();
        }
        Object.assign(user, { user_type: CONSTANTS.USER_TYPE.RESIDENT });
        //console.log('user', user);
        let url = ENVIRONMENT.APP_BASE_URL + '/api/user/signin';
        //// console.log(url);

        return that.http.post(url, user).map(res => res.json());

    }

    signup(user: ISignUpRequest, isSignupwithsocial?): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/residentsignup';
        user = JSON.parse(JSON.stringify(user));
        if (user.password) {
            user.password = CryptoJS.PBKDF2(user.password, CONSTANTS.CRYPTO_SALT, { keySize: 256 / 32 }).toString();
        }
        Object.assign(user, { user_type: CONSTANTS.USER_TYPE.RESIDENT });
        return this.http.post(url, user).map(res => res.json());

    }

    forgotpassword(emailId: string): Observable<any> {
        // // console.log('In user, forgotpassword ', emailId);
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/user/forgotpassword';
        let params = { emailId: emailId }
        Object.assign(params);
        return this.http.post(url, params).map(res => res.json());
    }

    verifyEmailId(email: string): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/user/verifyemail';
        let params = { email: email };
        return this.http.post(url, params).map(res => res.json());
    }

    verifyAuthorizationToken(params: { auth_code: string }): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/user/verifyauthorizationtoken';
        Object.assign(params);
        return this.http.post(url, params).map(res => res.json());
    }

    loadUser(loadUserCB?): void {
        let that = this, token = null;
        if (localStorage.getItem(CONSTANTS.HAS_LOGGED_IN)) {
            token = localStorage.getItem(CONSTANTS.LOCAL_TOKEN_KEY);

            // Set the token value into http service, It's passed for each request
            that.http.token = token;
            that.getUserInfoByToken(token, function (userInfoFromToken: IUser) {
                //// console.log('[ In UserService, user :' + JSON.stringify(user) + ']');

                // Set the defaultRequestParams.user_id into http service, It's passed for each request
                that.http.defaultRequestParams.sys_user_id = userInfoFromToken.user_id;
                that.getUserById(userInfoFromToken.user_id).subscribe((userObj: any) => {
                    if (userObj.status !== 'ERROR') {
                        Object.assign(that.userObj, userInfoFromToken, userObj.user);
                        that.http.defaultRequestParams.sys_user_type = that.userObj.user_type;
                        that.userName = that.userObj.profile.first_name + ' ' + that.userObj.profile.last_name
                        // console.log('[ In UserService, userObj :', that.userObj);
                        if (loadUserCB) {
                            loadUserCB(true);
                        }
                    } else {
                        if (loadUserCB) {
                            loadUserCB(false);
                        }
                    }
                });
            });
        }
    }


    isAppStarted(): boolean {
        let hasAppStarted: string = localStorage.getItem(CONSTANTS.HAS_APP_STARTED);
        if (hasAppStarted !== null && hasAppStarted === 'true') {
            return true;
        } {
            return false;
        }
    }

    setAppStarted(): void {
        //// console.log('In setAppStarted');
        //// console.log("Init pubNubService");
        let userlogin: IUser = this.getUser();
        this.pubNubService.initializePubnub(userlogin.user_id);
        localStorage.setItem(CONSTANTS.HAS_APP_STARTED, '' + true);
    }
    getUser(): IUser {
        return this.userObj;
    }

    storeUserCredentials(data, storeUserCredentialsCB): void {
        let that = this;
        let token = data.token;

        if (data.user && data.user.groups) {
            that.channelGroups = data.user.groups;
        }
        if (token) {
            localStorage.setItem(CONSTANTS.LOCAL_TOKEN_KEY, token);
            localStorage.setItem(CONSTANTS.HAS_LOGGED_IN, '' + true);
            that.storage.set(CONSTANTS.LOCAL_TOKEN_KEY, token).then(function () {
                that.storage.set(CONSTANTS.HAS_LOGGED_IN, true).then(function () {
                    that.loadUser(() => {
                        if (storeUserCredentialsCB) storeUserCredentialsCB(token);
                    });
                });
            });
        } else {
            // console.log('In storeUserCredentials no token found');
        }
    }

    storeDeviceToken(token): void {
        let that = this;
        this.storage.set(CONSTANTS.DEVICE_TOKEN_KEY, token).then(function () {
            that.deviceToken = token;
            // console.log('In storeDeviceToken, DeviceId is stored into LocalStorage');
        });
    }

    getUserInfoByToken(this: UserService, token, getUserInfoByTokenCB): void {
        let user: IUser = {};
        if (typeof token !== 'undefined') {
            let encoded = token.split('.')[1];
            let tmp_user = JSON.parse(this.urlBase64Decode(encoded));
            //// console.log(tmp_user, "------userToken Info------");
            user = {
                user_id: tmp_user.user_id,
                user_email: tmp_user.user_email
            };
        }
        if (getUserInfoByTokenCB) getUserInfoByTokenCB(user);
    };

    registerDeviceOnServer(): void {
        let that = this;
        let platform: string = '', params: Object = {};
        if (!this.platform.is('cordova')) {
            return;
        }
        if (this.platform.is('android')) {
            platform = "google";
            this.pushPlatform = "gcm";
        } else if (this.platform.is('ios')) {
            platform = "apple";
            this.pushPlatform = "apns";
        }

        that.storage.get(CONSTANTS.DEVICE_TOKEN_KEY).then(function (deviceId) {
            params = {
                'register_token': deviceId,
                'emailId': that.userObj.user_email,
                'platform': platform || 'google'
            };

            // // console.log('In registerDeviceOnServer request obj ');
            // // console.log(params);
            let url: string = ENVIRONMENT.APP_BASE_URL + '/api/user/registertoken';
            that.http.post(url, JSON.stringify(params)).map(res => res.json())
                .subscribe(data => {
                    // console.log(data);
                }, error => {
                    that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.NETWORK'));
                });
            //Commented push notification registration for user id to add channel wise enable disable push 
            // that.pubNubService.unRegisterDevice(that.userObj.user_id, deviceId, this.pushPlatform);

        });
    }

    urlBase64Decode(str: string): string {
        let output: string = str.replace('-', '+').replace('_', '/');
        switch (output.length % 4) {
            case 0:
                break;
            case 2:
                output += '==';
                break;
            case 3:
                output += '=';
                break;
            default:
                throw 'Illegal base64url string!';
        }
        return window.atob(output);
    }

    logout(): void {
        let that = this
        let platform: string = '', params: Object = {}, pushPlatform: string = '';
        that.clearPubnub();
        //that.pubNubService.removeChannelFromGroup([this.userObj.user_id]);

        if (this.platform.is('android')) {
            platform = "google";
            pushPlatform = 'gcm';
        } else if (this.platform.is('ios')) {
            pushPlatform = 'apns';
            platform = "apple";
        } else {
            platform = "web";
        }

        if (platform != "web") {
            that.storage.get(CONSTANTS.DEVICE_TOKEN_KEY).then(function (device_Id) {
                //// console.log("params", device_Id, "---", JSON.stringify(that.userObj), '----', platform, '----', that.userObj.email);
                params = {
                    'register_token': device_Id,
                    'emailId': that.userObj.email,
                    'user_id': that.userObj.user_id,
                    'platform': platform || 'google'
                };
                // // console.log(params, "parasm on logout");
                let url = ENVIRONMENT.APP_BASE_URL + '/api/user/signout';
                that.http.post(url, params).map(res => res.json())
                    .subscribe(data => {
                        // console.log(data, "user signedOut");
                        if (data.status === 'SUCCESS') {
                            if (that.userObj.facebook) {
                                that.fbLogout();
                            }
                            that.clearUserState();
                        } else {
                            //TODO - Need to add callback for error
                            that.loaderService.showToaster(that.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
                            that.loaderService.dismissLoader();
                        }
                    });
                that.pubNubService.unRegisterAllChannels(device_Id, pushPlatform);
            });
            //Logout from facebook 
        } else {
            that.clearUserState();
        }
        //localStorage.removeItem(APP_CONFIG.LOCAL_CONVERSATION_COUNT_MAP + '-' + this.userObj.user_id);
    }

    resetUserObj() {
        this.userObj = {};
        this.userObj["show_coach_marks"] = { all: false, feed: false, conversation: false, around_me: false, profile: false }
    }

    clearPubnub() {
        let that = this;
        that.pubNubService.unsubscribe();
        that.pubNubService.deleteGroup(that.userObj.user_id + '_friends');
        that.pubNubService.deleteGroup(that.userObj.user_id + '_group');
    }

    clearUserState() {
        let that = this;
        that.setCurrentPage(CONSTANTS.PAGES.LOGIN);
        that.storage.remove(CONSTANTS.LOCAL_TOKEN_KEY);
        that.storage.remove(CONSTANTS.HAS_LOGGED_IN);
        that.events.publish('user:logout');
        localStorage.removeItem(CONSTANTS.LOCAL_TOKEN_KEY);
        localStorage.removeItem(CONSTANTS.HAS_LOGGED_IN);
        //that.resetUserObj();
        that.userProfile = null;
        that.isProfileUpdate = false;
        that.isCoachSettingsUpdated = false;
        that.tempUserProfileObj = null;
        that.channelGroups = [];
        that.userName = '';
        that.http.token = null;
        that.http.defaultRequestParams.sys_user_id = null;
        that.http.defaultRequestParams.sys_user_type = null;

    }

    fbLogout(): void {
        if (this.facebook) {
            this.facebook.logout().then(() => {
                // console.log('Facebook logout called.');
            })
        }
    }

    hasLoggedIn(): Promise<any> {
        if (localStorage.getItem(CONSTANTS.HAS_LOGGED_IN)) {

            return this.storage.get(CONSTANTS.HAS_LOGGED_IN).then((value) => {
                //  // console.log(value, 'storage value');
                return value;
            });
        } else {
            return this.storage.get(CONSTANTS.HAS_LOGGED_IN).then((value) => {
                //   // console.log(value, 'storage value');
                return false;
            });
        }
    }

    fbLogin(): Promise<any> {
        try {
            if (this.platform.is('cordova')) {
                if (this.http.online) {
                    return this.facebook.login(['email']).then(
                        (success) => {
                            return success;
                        },
                        (error) => {
                            this.loaderService.showToaster(error.errorMessage);
                            return error.errorMessage;
                        }
                    )
                }
                else {
                    return Promise.reject(this.translateService.instant('ERROR_MESSAGES.NO_NETWORK'));;
                }
            } else {
                return Promise.reject('Please run me on a device');
            }
        } catch (error) {
            // // console.log(error);
            return Promise.reject(error.errorMessage);
        }
    }

    getUserFacebookProfile(): Promise<any> {
        try {
            return this.facebook.api('me?fields=email,name,picture.width(600).height(600)', []).then(
                (profileData) => {
                    // // console.log(JSON.stringify(profileData));
                    return profileData;
                }, (error) => {
                    // // console.log(JSON.stringify(error));
                    return error;
                });
        } catch (error) {
            // console.log(JSON.stringify(error));
        }
    }

    getAllUsers(): Observable<any> {
        let userObj: IUser = this.getUser()
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/user/all';
        return this.http.post(url, { "email": userObj.user_email }).map((res: any) => res.json());
    }

    getCurrentPage(): IPageDetails {
        //// console.log("Current Page is - ", this.pageDetails);
        return this.pageDetails;
    }

    setCurrentPage(newPage: string, userid?: string) {
        // // console.log("Current Page to", this.pageDetails.currentPage, "=>", newPage, "=>", userid);
        this.pageDetails.currentPage = newPage;
        this.pageDetails.userid = userid;
    }

    updateUserInfo(userData: IUser): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/updateUserProfile'
        return this.http.post(url, userData).map((res: any) => res.json());
    }

    changePassword(userData: IUser): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/user/changepassword';
        if (userData && userData.password) {
            userData.password = CryptoJS.PBKDF2(userData.password, CONSTANTS.CRYPTO_SALT, { keySize: 256 / 32 }).toString();
        }
        return this.http.post(url, userData).map((res: any) => res.json());
    }
    getUserById(userId: string): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/user/findbyid';
        return this.http.post(url, { "_id": userId }).map((res: any) => res.json());
    }

    verifyPhoneNumber(code): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/verifymobilenumber';
        let userObj: IUser = this.getUser();
        return this.http.post(url, { "_id": userObj.user_id, "verification_code": code }).map((res: any) => res.json());
    }

    sendVerificationCode(mob_number): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/sendverificationcode';
        let userObj: IUser = this.getUser()
        return this.http.post(url, { "_id": userObj.user_id, "mobile_number": mob_number }).map((res: any) => res.json());
    }

    getDataFromUserMaster(): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/usermaster/all';
        return this.http.post(url, {}).map((res: any) => res.json());
    }

    saveFeedBack(feedbackObj: IFeedback): Observable<any> {
        feedbackObj.user_id = this.userObj.user_id;
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/feedback';
        return this.http.post(url, feedbackObj).map((res: any) => res.json());
    }

    setTempUserProfileObj(params) {
        this.tempUserProfileObj = params;
    }

    getTempUserProfileObj() {
        return this.tempUserProfileObj;
    }
    getUserProfile(): IUser {
        return this.userProfile;
    }
    setUserProfile(user: IUser) {
        this.userProfile = user;
        this.userName = user.profile.first_name + ' ' + user.profile.last_name;
        this.isProfileUpdate = false;
        this.userObj.profile.profile_pic = user.profile.profile_pic;
    }

    verifyForceUpdate(appVersion: string, deviceType: string): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/verifyversion';
        return this.http.post(url, { app_version: appVersion, device_type: deviceType }).map((res: any) => res.json());
    }

    updateUserDeviceLang(params: { user_id: string }): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/user/updateuserdevicelang';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    acceptPolicy(params: IUser): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/user/settermsandprivacy';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    getBlockedUsers(userId: string): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/user/getblockuserslist';
        return this.http.post(url, { "user_id": userId }).map((res: any) => res.json());
    }

    setCoachMarkSettings(params: ICoachMarksSettingsRequest): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/user/setcoachmarksettings';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    shareOnFacebook(url: string, caption: string, imageUrl: string, callback: any) {
        let options;
        options = {
            method: "share",
            quote: caption,
            hashtag: '#Rezility',
            href: url,
            picture: imageUrl
        }
        this.facebook.showDialog(options).then(
            (success) => {
                if (callback) {
                    callback(true);
                }
                //console.log(JSON.stringify(success));
            }, (error) => {
                if (callback) {
                    callback(false);
                }
            });
    }
}

export interface IPageDetails {
    currentPage: string,
    userid?: string
}

export interface IUser {
    _id?: string;
    user_id?: string;
    user_name?: string;
    email?: string;
    user_email?: string;
    password?: any;
    profile?: {
        first_name?: string,
        last_name?: string,
        nick_name?: string,
        description?: string,
        profile_pic?: string,
        home_address?: IHomeAddress,
        gender?: string,
        phone_number?: string,
        name?: string,
        middle_name?: string,
        age?: number,
        education_level?: string,
        language?: string,
        date_of_birth?: any
    };
    notification_enabled?: boolean;
    show_coach_marks?: ICoachMarksSettings;
    is_mobile_number_verified?: boolean;
    verification_code?: string;
    financial_info?: any;
    service_interests?: string;
    facebook?: string;
    authType?: string;
    is_email_verified?: boolean;
    source?: string;
    is_terms_checked?: boolean;
    is_privacy_checked?: boolean;
    is_terms_privacy_accepted?: boolean;
    user_type?: string;
    low_data?: boolean;
    device_lang?: string;
    branches?: Array<IBranch>;
}

export interface IBranch {
    organization_id: string;
    organization_img: string;
    organization_name: string;
    public_name?: string;
    profile_pic?: string;
    _id: string;
}

export interface IUserMaster {
    _id?: string;
    deeplink_base_url?: string;
    age?: Array<IUserMasterObjectParams>;
    annual_income?: Array<IUserMasterObjectParams>;
    education_level?: Array<IUserMasterObjectParams>;
    gender?: Array<IUserMasterObjectParams>;
    language?: Array<IUserMasterObjectParams>;
    service_interest?: Array<IUserMasterObjectParams>;
}

export interface IUserMasterObjectParams {
    _id?: string;
    max?: string;
    min?: string;
    name?: string;
    code?: string;
}

export interface IFeedback {
    user_id?: string;
    message?: string;
    first_name?: string;
    last_name?: string;
    user_email?: string;
}

export interface IAppMetaData {
    app_id: string;
    app_version: string;
    device_id: string;
    device_type: string;
}

export interface IHomeAddress {
    street_address1?: string,
    street_address2?: string,
    city?: string,
    state?: string,
    zipcode?: string,
    place_id?: string,
    verification_status?: string,
    lat?: string,
    long?: string
}

export interface ISignUpRequest {
    first_name: string;
    last_name: string;
    email: string;
    zipcode: number;
    facebook?: string;
    password?: string;
    profile_pic?: string;
    is_terms_checked: boolean;
    is_privacy_checked: boolean;
    is_terms_privacy_accepted: boolean;
}

export interface IBlockedUser {
    user_id: string;
    user_name: string;
    email: string;
    connection_status: number;
    profile_pic: string;
    first_name: string,
    last_name: string,
    shared_channel?: string,
    receiver_id: string,
    timetoken: number
}

export interface ICoachMarksSettings {
    all: boolean;
    feed: boolean;
    conversation: boolean;
    around_me: boolean;
    profile: boolean;
}
export interface ICoachMarksSettingsRequest {
    user_id: string;
    show_coach_marks: ICoachMarksSettings;
}

