//import { SecureStorage } from 'ionic-native';
import { Platform } from 'ionic-angular';
import { Injectable } from '@angular/core';
//import { Storage } from '@ionic/storage'
import 'rxjs/add/operator/map';
@Injectable()
// TODO - not in use
export class StorageService {
    storage: any;
    constructor(platform: Platform) {
        // console.log('In StorageService constructor created  SecureStorage instance.',platform.is('ios'), platform.is('android'))
        if (platform.is('ios') || platform.is('android')) {
            //   this.storage = new SecureStorage();
            // console.log('In StorageService constructor created  SecureStorage instance.')
        } else {
            //   this.storage = new Storage();
            // console.log('In StorageService constructor created  Storage instance.')
        }
    }

    create(key: string) {
        this.storage.create(key).then(() => {
            // console.log('Storage is ready!')
        }, this.error);
    }

    set(key: string, value: string) {
        this.storage.set(key, value).then((data) => {
            // console.log('StorageService, In set', key, data);
        }, this.error);
    }
    get(key: string) {
        this.storage.get(key).then((data) => {
            // console.log('StorageService, In get', key, data);
        }, this.error);
    }

    remove(key: string) {
        this.storage.remove(key).then(() => {
            // console.log('StorageService, In remove', key);
        }, this.error);
    }
    error(error) {
        // console.log('Error in StorageService');
    }

}

