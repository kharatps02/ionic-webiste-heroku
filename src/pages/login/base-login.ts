import { UserService, IUser } from '../../providers/user-service';
import { AlertController, Events } from 'ionic-angular';
import { LoaderService } from '../../providers/loader-service'
import { TranslateService } from "@ngx-translate/core";
import { CONSTANTS } from '../../shared/config';
export class BaseLoginClass {

    constructor(public userService: UserService, public alertCtrl: AlertController, public events: Events,
        public translateService: TranslateService, public loaderService: LoaderService) {
        this.userService = userService;
    }

    proceedLogin(user, callback?) {
        let that = this;
        that.loaderService.createLoader(that.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
        that.userService.login(user).subscribe(function (data: any) {
            if (data.status !== "ERROR") {
                that.userService.storeUserCredentials(data, function () {
                    that.events.publish('user:login');
                });
            } else {
                if (!callback) {
                    that.userService.fbLogout();
                    let alert = that.alertCtrl.create({
                        title: that.translateService.instant('ERROR_MESSAGES.ERROR_TITLE'),
                        message: data.message,
                        buttons: [{
                            text: this.translateService.instant('MISC.OK')
                        }],
                        enableBackdropDismiss: false,
                        cssClass: 'alert-single'
                    });
                    alert.present();
                } else {
                    callback(data.message);
                }
            }
            that.loaderService.dismissLoader();
        }, error => {
            // console.log("ERROR::", error);
            this.loaderService.dismissLoader();
            this.loaderService.showToaster(error);
        });
    }

    onFLogin() {
        let that = this;
        that.userService.fbLogin().then(() => {
            that.userService.getUserFacebookProfile().then((profileData) => {
                // console.log('In fbLogin');
                // console.log(JSON.stringify(profileData), "ProfileData IN FBlogin");
                if (!profileData.errorCode) {
                    let userObj: IUser = {
                        user_name: profileData.name,
                        email: profileData.email,
                        profile: {
                            profile_pic: CONSTANTS.FACEBOOk_PROFILE_URL.PREFIX + profileData.id + CONSTANTS.FACEBOOk_PROFILE_URL.POSTFIX || '',
                            name: profileData.name
                        },
                        authType: 'fb',
                        facebook: profileData.id
                    };
                    // console.log("Outer FBlogin userObj>> ", userObj);
                    that.proceedLogin(userObj);
                } else {
                    // console.log('In onFLogin got error', profileData);
                }
            }
            ), error => {
                // console.log(" ERROR::", error);
                this.loaderService.dismissLoader();
                this.loaderService.showToaster(error);
            };
        }, error => {
            // console.log("Facebook ERROR::", error);
            this.loaderService.dismissLoader();
            this.loaderService.showToaster(error);
        });
    }
}
