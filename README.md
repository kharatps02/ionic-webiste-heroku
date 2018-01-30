==========================================================================================
                                    Cordova/Ionic Plugins
==========================================================================================
 ionic plugin add cordova-plugin-facebook4 --variable APP_ID="1931075873790998" --variable APP_NAME="Rezility" --save

 cordova plugin add ionic-plugin-deeplinks --variable URL_SCHEME=rezility --variable DEEPLINK_SCHEME=https --variable DEEPLINK_HOST=rezility-qa.herokuapp.com --variable DEEPLINK_2_SCHEME=https --variable DEEPLINK_2_HOST=rezility-uat.herokuapp.com --variable DEEPLINK_3_SCHEME=https --variable DEEPLINK_3_HOST=rezility-dev.herokuapp.com --variable  ANDROID_PATH_PREFIX=\* --save
 
applinks:rezility-qa.herokuapp.com
applinks:rezility-uat.herokuapp.com
applinks:rezility-dev.herokuapp.com
 

adb shell am start -a android.intent.action.VIEW -d "https://rezility-dev.herokuapp.com" com.enterprise.behome

adb shell am start -a android.intent.action.VIEW -d "rezility-dev.herokuapp://login" com.enterprise.behome

<data android:host="rezility-dev.herokuapp.com" android:pathPrefix="\*" android:scheme="https" />

 cordova plugin add cordova-plugin-inappbrowser --save

cordova plugin add phonegap-plugin-push --variable SENDER_ID="975547819683" --save

ionic cordova plugin add cordova-plugin-googlemaps --variable API_KEY_FOR_ANDROID="AIzaSyBMqI16sxcd8uTFU1X-4uPoQsH7fQHXe3Y" --variable API_KEY_FOR_IOS="AIzaSyDw1XhlBcOkmGVZvQxmXvkCWNBnVEiQLos" --save --variable LOCATION_WHEN_IN_USE_DESCRIPTION=""Show your location on the map" --variable LOCATION_ALWAYS_USAGE_DESCRIPTION="Show your location on the map"

cordova plugin add https://github.com/phonegap-googlemaps-plugin/cordova-plugin-googlemaps --variable API_KEY_FOR_ANDROID="AIzaSyBMqI16sxcd8uTFU1X-4uPoQsH7fQHXe3Y" --variable API_KEY_FOR_IOS="AIzaSyDw1XhlBcOkmGVZvQxmXvkCWNBnVEiQLos" --save


com.googlemaps.ios

cordova plugin add cordova-plugin-compat --save

cordova plugin add cordova-plugin-camera --variable CAMERA_USAGE_DESCRIPTION="BEHOME would like to access your camera" --variable PHOTOLIBRARY_USAGE_DESCRIPTION="BEHOME would like to access your photo library." --save

cordova plugin add cordova-plugin-media-capture --variable CAMERA_USAGE_DESCRIPTION="BEHOME would like to access your camera." --variable PHOTOLIBRARY_USAGE_DESCRIPTION="BEHOME would like to access your photo library." --save

cordova plugin add cordova-plugin-file  --save

cordova plugin add cordova-plugin-file-transfer --save

cordova plugin add cordova-plugin-x-toast --save

cordova plugin add cordova-plugin-google-analytics --save

cordova plugin add cordova-plugin-network-information --save

cordova plugin add cordova-plugin-secure-storage --save

cordova plugin add cordova-plugin-app-event --save


<meta-data android:name="io.fabric.ApiKey" android:value="337ec19bb47257200922d1a85d59be96ea3832fd" />
sudo cordova plugin add cordova-fabric-plugin --variable FABRIC_API_KEY=337ec19bb47257200922d1a85d59be96ea3832fd --variable FABRIC_API_SECRET=7bbe9c2d56e204a1543726f378f42d0907ee5b3c960bb63f239f0944bb838acd --save



cordova plugin rm cordova-fabric-plugin 

https://alchemylanguage-nodejs-rezility-185.mybluemix.net/

    "cordova-plugin-app-event": {
        "source": {
            "type": "registry",
            "id": "cordova-plugin-app-event"
        },
        "is_top_level": false,
        "variables": {}
    }

==========================================================================================
Deep linking key 
Popat - 4B:F6:E2:20:70:2C:DC:87:94:F8:AA:BF:5A:2F:B5:F1:C4:16:E5:3F:A5:13:FE:4B:6B:6C:E9:4A:3E:94:5A:6B
sourabh - cd:65:45:81:95:b2:30:a8:7c:5c:4f:5d:1b:fa:d8:dd
C:\Program Files\Java\jdk1.8.0_51\bin>keytool -list -v -keystore "C:\Users\Popat.Kharat\.android\\debug.keystore"

hash key-
keytool -exportcert -alias BeHome -keystore "C:\Users\Popat.Kharat\.android\\debug.keystore" | "C:\Workspace\OpenSSL\\bin\\openssl" sha1 -binary |"C:\Workspace\OpenSSL\\bin\\openssl" base64

(sourabh's machine hash key) => FO0m0W+W8LVL50P0Kn1MFKRXHnw=
(manish's hash key) => ga0RGNYHvNM5d0SLGQfpQWAPGJ8=
(Popat )- wxDweMo6I8Otb1cmTBtT9PcSpG8=
Bmce+9aHdOoVtE7fS3B07tfj7Bc=
Follow these steps to create the build:

1. If the build is being created from a new machine, please create the key hash (needed for Facebook login functionality)

Add the key hash thus generated into the app created at Facebook developer center.

In case if you are not aware of how to create key hash, please follow the steps mentioned here for same:
http://javatechig.com/android/how-to-get-key-hashes-for-android-facebook-app

2. Open command prompt at source code folder. And execute command "npm update"
This will install all node dependencies.

3. Then execute "ionic platform add android"

4. Finally execute: "ionic build android"
This command will create an APK at "rezility-ionic\platforms\android\build\outputs\apk\android-debug.apk"

openssl pkcs12 -in behome_aps_dist.p12 -out behome_aps_dist.pem -nodes -clcerts
openssl x509 -in behome_aps_dist.cer -inform der -out behome_aps_dist.pem

            // if (data.additionalData.foreground === false) {
            //     push.getApplicationIconBadgeNumber(function (n) {
            //         console.log('success', n);
            //         push.setApplicationIconBadgeNumber(function () {
            //             console.log('setApplicationIconBadgeNumber - success');
            //         }, function () {
            //             console.log('error');
            //         }, n + 1);
            //     }, function () {
            //         console.log('error');
            //     });
            // }else{
            //      push.setApplicationIconBadgeNumber(function () {
            //             console.log('setApplicationIconBadgeNumber - success');
            //         }, function () {
            //             console.log('error');
            //         },0);
            // }

            https://www.pubnub.com/knowledge-base/discussion/234/how-do-i-test-my-pem-key

==========================================================================================
                                Database
==========================================================================================                
    db.foo.updateMany({}, {$set: {lastLookedAt: Date.now() / 1000}})

    db.users.updateMany({}, {$set: {token:"",apns_tokens:[],gcm_tokens:[],locations:[]}})


    RezilityDev
    mongoexport -h ds051655.mlab.com:51655 -d rezility-mongolab-ionic-dev -c users -u rezmongoionicdev -p rezilityNC123 -o "users.json"
    mongoimport -h ds051655.mlab.com:51655 -d rezility-mongolab-ionic-dev -c users -u rezmongoionicdev -p rezilityNC123 --file "users.json" --type json

    RezilityDemo
    mongoexport -h ds063124.mlab.com:63124 -d rezility-mongolab-demo -c users -u rezmongouser2 -p rezilityNC123 -o "users.json"
    mongoimport -h ds063124.mlab.com:63124 -d rezility-mongolab-demo -c users -u rezmongouser2 -p rezilityNC123 --file "users.json" --type json

    cordova plugin add cordova-plugin-google-analytics
    Google Analytics credentials
    Client ID: 975547819683-5135d6eeuqc8bug0jrf97tqaf1con1ir.apps.googleusercontent.com
    Tracking ID: UA-88753211-1

    mongoexport -h ds063124.mlab.com:63124 -d rezility-mongolab-demo -d rezility-mongolab-demo -u rezmongouser2 -p rezilityNC123 -o "database.json"

    mongodump -h ds063124.mlab.com:63124 -d rezility-mongolab-demo -d rezility-mongolab-demo -u rezmongouser2 -p rezilityNC123 -o "database.json"

    Steps to reset data of any user

    1 - Take backup of the user collection using the following command.  
    mongoexport -h ds063124.mlab.com:63124 -d rezility-mongolab-demo -c users -u rezmongouser2 -p rezilityNC123 -o "users.json"
    2 - Copy the _id value of the user and keep it safe we will need it. We will call it OLD_ID 
    3 - Delete the user from the users collection. 
    4 - Open the users.json file and remove the id value of the user. For example - _id":{"$oid":"58456fd517687f936227cd63"}, and save the user json.  
    5 - import the user using the following command. 
    mongoimport -h ds063124.mlab.com:63124 -d rezility-mongolab-demo -c users -u rezmongouser2 -p rezilityNC123 --file "users.json" --type json
    6 - Check the database and copy the new _id value. We will call it NEW_ID. You can find it using the following command in case you have multiple.
    db.getCollection('users').find({$or: [{email:"adamjones@gmail.com"},{email:"tina@gmail.com"},{email:"janesmith@gmail.com"}]});
    7 - Update the login and push notification tokens using the command below. 
    db.users.updateMany({_id:ObjectId("NEW_ID")}, {$set: {token:"",apns_tokens:[],gcm_tokens:[]}});
    8 - Update the activityfeeds to use the new id using below command. 
    db.getCollection('activityfeeds').updateMany({user_id:ObjectId("OLD_ID")},{$set:{user_id:ObjectId("NEW_ID")}});
    9 -  Delete all chat records. Run the below query and remove all records. 
    db.getCollection('chats').find({$or: [ {user_id: ObjectId("OLD_ID")}, {receiver_id: ObjectId("OLD_ID")}]});
    
    Translate - L4S4B1FpRD7ZJawUHlqnvA%3D%3D
    58454ed31d0db59f42e9a5af_58454ed31d0db59f42e9a5a7

    https://julienrenaux.fr/2015/08/24/ultimate-angularjs-and-ionic-performance-cheat-sheet
    https://www.lucidchart.com/techblog/2016/05/04/angular-2-best-practices-change-detector-performance/
    https://blog.budacode.com/2016/06/27/angular-2-best-practises/
    https://github.com/valor-software/tslint-config-valorsoft/
    https://www.npmjs.com/package/codelyzer
    http://tombuyse.com/improving-the-performance-of-your-ionic-application/

    http://www.codebelt.com/typescript/generate-documentation-for-typescript/


    //TODO = Whitelisting => https://cordova.apache.org/docs/en/latest/guide/appdev/whitelist/index.html

    http://coenraets.org/keypoint/phonegap-performance/#10
    https://github.com/ftlabs/fastclick

    var semantriaConsumerKey = "8e1ba8b7-0ed2-46fd-b8ed-85469283d8c5";      //  Put your Semantira Consumer Key here.  You may signup for a free demo at:  https://www.lexalytics.com/demo
    var semantriaConsumerSecret = "e1560343-fb62-4d88-8995-45a7c24cefdc";   //  Put your Semantira Consumer Secret here.  You may signup for a free demo at:  https://www.lexalytics.com/demo
    var semantriaAppName = "PubNub";


    manish - 586f4bad9154b1401afe1266
    Peter - ObjectId("586f4bad9154b1401afe1262")
    586f4bad9154b1401afe1266_586f4bad9154b1401afe1262
    Susan - ObjectId("586f4bad9154b1401afe1263")
    586f4bad9154b1401afe1266_586f4bad9154b1401afe1263
    Sid - 586f4bad9154b1401afe1266_586f4bad9154b1401afe125c

    export default request => {
    let xhr = require('xhr');

    /*
      TODO: add your developer token here
      TODO: https://languagecloud.sdl.com/translation-toolkit/login
    */
    let clientToken = 'L4S4B1FpRD7ZJawUHlqnvA%3D%3D';
    let apiUrl = 'https://lc-api.sdl.com/translate';

    // return if the block does not have anything to analyze
    const text = request.message.content;
    const from = "eng";
    const to = "spa";

    if (!text || !from || !to) {
        return request.ok();
    }

    const payload = JSON.stringify({ text, from, to });

    let httpOptions = {
        as: 'json',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: 'LC apiKey=' + clientToken
        },
        body: payload,
        method: 'post'
    };
    return xhr.fetch(apiUrl, httpOptions)
        .then((response) => {
            return response.json()
                .then((parsedResponse) => {
                    request.message.translation = parsedResponse.translation;
                      request.message.content = parsedResponse.translation;
                    console.log(request.message);
                    return request;
                })
                .catch((err) => {
                    console.log('error happened on JSON parse', err);
                    return request;
                });
        })
        .catch((err) => {
            console.log('error happened for XHR.fetch', err);
            return request;
        });
};

    ===== Chat Archive 

    export default (request) => {
    //console.log("Request " + request.message);

    const user_id = request.message.sender_uuid;
    const property_manager_id = "58454ed31d0db59f42e9a5aa";
    const content =  request.message.content + " ###Chat Hook#####";
    const sender_uuid = request.message.sender_uuid;
    const receiver_uuid = request.message.receiver_uuid;
    const shared_channel_id = request.message.shared_channel_id; 
    const date =  request.message.date;
    const tags = request.message.tagsArray;
        const xhr = require("xhr");
        const http_options = {
            "method": "POST",
            "headers": {
            "Content-Type": "application/json"
            },
            "body": JSON.stringify({user_id,property_manager_id,content,sender_uuid,receiver_uuid,shared_channel_id,date,tags})
        };   
    //console.log(http_options);
    console.log("====",request.message);
        const url = "https://rezility-dev.herokuapp.com/api/chatarchives";
        return xhr.fetch(url, http_options).then((x) => {
            const body = JSON.parse(x.body);
            //console.log(body);
            return request.ok();
        });
    
    };




Keystore - 
alias name - rezility
password - rezilityNC!
CN=Manish Oswal, OU=Enterprise Community, O=Extentia, L=Pune, ST=Maharashtra, C=IN

keytool -genkey -v -keystore rezility.keystore -alias rezility -keyalg RSA -keysize 2048 -validity 10000

openssl pkcs12 -in RezDevAPNS.p12 -out RezDevAPNSP12.pem -nodes -clcerts
openssl pkcs12 -in RezPRODAPNS.p12 -out RezPRODAPNSP12.pem -nodes -clcerts

openssl x509 -in RezDevAPNS.cer -inform der -outform pem -out RezDevAPNScer.pem
openssl x509 -in RezPRODAPNS.cer -inform der -outform pem -out RezPRODAPNS.pem



export BUILD_ENV=demo
set BUILD_ENV=demo

release SHA1: - 29:99:43:59:1C:79:04:8C:98:E1:5D:AB:AD:CB:04:EE:D1:C9:B2:FB


open /Applications/Google\ Chrome.app/ --args --disable-web-security --user-data-dir
release key store = KZlDWRx5BIyY4V2rrcsE7tHJsvs=

project = RBT AND Sprint = "March 24 2017 - 30 days to go"  and status = Completed  ORDER BY updatedDate desc
project = RBT AND status not in (Closed, Completed) and assignee != pkoradia ORDER BY priority DESC, updatedDate DESC
project = RBT AND Sprint = 889 AND status not in (Closed, Completed) and assignee != pkoradia ORDER BY priority DESC, updatedDate DESC


Get Place Details
https://maps.googleapis.com/maps/api/place/details/json?key=AIzaSyA472HpeBmbI-6bkDFhACR2IAk4Je0Oqbs&placeid=ChIJ31qsiXfDt4kROegszKbJkBE

Get Auto COmpolet

https://maps.googleapis.com/maps/api/place/autocomplete/json?key=AIzaSyA472HpeBmbI-6bkDFhACR2IAk4Je0Oqbs&sensor=false&types=address&components=country:us&input=11201



    first_name?: string;
    last_name?: string;
    user_email?:string;

          first_name: '',
      last_name:'',
      user_email:''


      


      Debounce 
      ng-model-options="{debounce: 350}"
      https://forum.ionicframework.com/t/debounce-on-input/16984
      

      project = RBT AND status not in (Closed,Completed, Pending) and "Epic Link" not in (REZ-746) ORDER BY priority DESC, updated DESC





Your system information:

Cordova CLI: 6.5.0 
Ionic CLI Version: 2.2.1
Ionic App Lib Version: 2.2.0
ios-deploy version: 1.9.0 
ios-sim version: 5.0.13 
OS: macOS Sierra
Node Version: v6.10.1
Xcode version: Xcode 8.3.2 Build version 8E2002



Your system information:

Cordova CLI: 6.5.0 
Ionic Framework Version: 2.2.0
Ionic CLI Version: 2.2.1
Ionic App Lib Version: 2.2.0
Ionic App Scripts Version: 1.1.4
ios-deploy version: 1.9.0 
ios-sim version: 5.0.13 
OS: macOS Sierra
Node Version: v6.10.1
Xcode version: Xcode 8.3.2 Build version 8E2002

ionic plugin add phonegap-plugin-push --variable SENDER_ID="975547819683" --save

ionic plugin add ionic-plugin-deeplinks --variable URL_SCHEME=rezility --variable DEEPLINK_SCHEME=https --variable DEEPLINK_HOST=rezility-qa.herokuapp.com --variable DEEPLINK_2_SCHEME=https --variable DEEPLINK_2_HOST=rezility-uat.herokuapp.com --variable DEEPLINK_3_SCHEME=https --variable DEEPLINK_3_HOST=rezility-dev.herokuapp.com --variable DEEPLINK_4_SCHEME=https --variable DEEPLINK_3_HOST=rezility-demo.herokuapp.com --variable DEEPLINK_5_HOST=https --variable DEEPLINK_3_HOST=api.rezility.com  --variable  ANDROID_PATH_PREFIX=\* --save

ionic plugin add cordova-plugin-facebook4 --variable APP_ID="1931075873790998" --variable APP_NAME="Rezility" --save

ionic plugin add cordova-plugin-googlemaps --variable API_KEY_FOR_ANDROID="AIzaSyBMqI16sxcd8uTFU1X-4uPoQsH7fQHXe3Y" --variable API_KEY_FOR_IOS="AIzaSyDw1XhlBcOkmGVZvQxmXvkCWNBnVEiQLos" --save