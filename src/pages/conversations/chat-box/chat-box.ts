import { MediaCapture, MediaFile, CaptureError } from '@ionic-native/media-capture';
import { Transfer, FileUploadOptions } from '@ionic-native/transfer';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { NavController, NavParams, Events, Content, Platform, ActionSheetController } from 'ionic-angular';
import { Component, ElementRef, ViewChild, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TranslateService } from "@ngx-translate/core";
import 'rxjs/add/operator/debounceTime';

import { Conversations } from '../../conversations/conversations';
import { BaseChatBox } from './base-chat-box';
import { ConversationSetting } from '../conversation-setting/conversation-setting';
import { ShowImage } from '../show-image/show-image';
import { UserService } from '../../../providers/user-service';
import { PubNubService, IConnectionStatusChangeState, PubNubEvent } from '../../../providers/pubnub-service';
import { ChatService } from '../chat-service';
import { AnalyticsService } from '../../../providers/analytics-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { ENVIRONMENT } from '../../../shared/environment';

@Component({
    selector: 'page-chat-box',
    templateUrl: 'chat-box.html'
})

export class ChatBox extends BaseChatBox {
    public writeMessage = new FormControl();
    public groupType: string = CONSTANTS.CONVERSATION_TYPE.GROUP;
    public systemSenderId = "Rezility";
    public connectionStatus = CONSTANTS.CONNECTION_STATUS;
    public placeholderIamges = CONSTANTS.PLACEHOLDER_IMAGES;
    public isSettingsDisabled: boolean = false;
    public messageContentType = CONSTANTS.MESSAGE_CONTENT_TYPE_ID;
    @ViewChild(Content) content: Content;

    constructor(public pubNubService: PubNubService, public navCtrl: NavController,
        public userService: UserService, private navParams: NavParams, public events: Events, element: ElementRef,
        public translateService: TranslateService,
        public chatService: ChatService, public actionSheetCtrl: ActionSheetController, public platform: Platform,
        public analyticsService: AnalyticsService, public loaderService: LoaderService,
        private transfer: Transfer, private camera: Camera, private mediaCapture: MediaCapture) {
        super(pubNubService, userService, chatService, loaderService, translateService, events, element);
        this.selectedUser = this.navParams.get('user');
        this.mergeConversationExtraData(this.selectedUser.shared_channel);
        this.resetMessageModel();
    }

    ionViewDidLoad() {
        //console.log("Chat-Box - ionViewDidLoad", this.selectedUser);
        this.pubNubService.setConversationLastState(this.selectedUser.shared_channel, 0, this.selectedUser.timetoken);
        if (this.selectedUser && this.selectedUser.type !== CONSTANTS.CONVERSATION_TYPE.GROUP) {
            this.userService.setCurrentPage(CONSTANTS.PAGES.CHAT_BOX, this.selectedUser.shared_channel);
            let contactObj = {
                user_id: this.selectedUser.receiver_id,
                user_name: this.selectedUser.user_name,
                profile_pic: this.selectedUser.profile_pic
            };
            this.setContactIdDetailMap([contactObj]);
            //this.initTypingDetection();
            if (this.selectedUser && this.selectedUser.shared_channel
                && (this.selectedUser.connection_status === CONSTANTS.CONNECTION_STATUS.CONNECTED || this.selectedUser.connection_status === CONSTANTS.CONNECTION_STATUS.CONNECTED_BLOCKED)) {
                this.initChatBox();
            } else if (this.selectedUser.connection_status === CONSTANTS.CONNECTION_STATUS.INVITED) {

            } else if (this.selectedUser.connection_status === CONSTANTS.CONNECTION_STATUS.INVITATION_RECEIVED) {
                this.selectedUser.connection_status = CONSTANTS.CONNECTION_STATUS.CONNECTED;
                this.initChatBox();
            }
        } else {
            this.userService.setCurrentPage(CONSTANTS.PAGES.GROUP_CHAT, this.selectedUser.shared_channel);
            this.setContactIdDetailMap(this.selectedUser.members);
            this.initChatBox();
        }
    }

    ionViewWillLeave() {
        if (this.selectedUser && this.selectedUser.type === undefined || this.selectedUser.type != CONSTANTS.CONVERSATION_TYPE.GROUP) {
            this.userService.setCurrentPage(CONSTANTS.PAGES.CHAT_BOX, "");
        } else {
            this.userService.setCurrentPage(CONSTANTS.PAGES.GROUP_CHAT, "");
        }
        // console.log("Chat-Box - Looks like I'm about to leave :(");
    }

    ionViewWillUnload() {
        // console.log("Chat-box- Looks like I'm about to ionViewWillUnload :(");
        this.pubNubService.historyEventEmitter = new EventEmitter<PubNubEvent>();
        this.events.unsubscribe(CONSTANTS.APP_EVENTS.NEW_MESSAGE);
        this.events.unsubscribe(CONSTANTS.APP_EVENTS.KEYBOARD);
        this.events.unsubscribe(CONSTANTS.APP_EVENTS.CHAT_BOX_PRESENCE_EVENT);
        this.events.unsubscribe(CONSTANTS.APP_EVENTS.CLOSE_IMAGE_PREVIEW);
        this.events.unsubscribe(CONSTANTS.APP_EVENTS.CHAT_BOX_CONNECTION_STATUS_CHANGED)
    }

    ionViewDidEnter() {
        // console.log("Chat-Box - ionViewDidEnter");
        this.content.resize();
        let that = this;
        that.analyticsService.trackScreenView(CONSTANTS.PAGES.CHAT_BOX);
        if ((this.selectedUser.connection_status === CONSTANTS.CONNECTION_STATUS.INVITED &&
            this.selectedUser.type !== CONSTANTS.CONVERSATION_TYPE.GROUP) ||
            this.selectedUser.group_type === CONSTANTS.USER_TYPE.SERVICE_PROVIDER ||
            this.selectedUser.group_type === CONSTANTS.USER_TYPE.HOUSING_PROVIDER) {
            this.isSettingsDisabled = true;
        }

        // console.log("Chat-Box - Looks like I'm about to enter :(");
    }

    initChatBox() {
        this.initCloseImagePreview();
        this.initNewMesssageEvent();
        this.initPresenceEvent();
        this.initKeyboardEvent();
        this.initConnectionStatusEvent();
        this.pageState = null;
        this.loadSelectedUserHistory(this.selectedUser.shared_channel, (error, isAllMessageLoaded = true) => {
            if (!error) {
                this.scrollToBottom();
                this.chatBoxInfiniteScrollEnabled = !isAllMessageLoaded;
            } else {
                this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
            }
        });
    }

    mergeConversationExtraData(shared_channel: string) {
        this.chatService.getConversationExtraData({ shared_channel: shared_channel }).subscribe((response) => {
            if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
                Object.assign(this.selectedUser, { languages: response.languages });
            }
        })
    }
    initTypingDetection() {
        let that = this, instance = null;
        that.writeMessage.valueChanges.debounceTime(400).subscribe(writeMessage => {
            // When to start Typing ?, Content is not empty and was not typing before
            if (that.messageModel.trim().length != 0 && !that.pubNubService.isCurrentUserTyping) {
                that.pubNubService.startTyping(that.selectedUser.receiver_id)
                stopTypingScheduler();
                //// console.log("Typing 1 check")
            }
            // When to reschedule ?, when the input is not empty and you are typing
            else if (that.messageModel.trim().length != 0 && that.pubNubService.isCurrentUserTyping) {
                stopTypingScheduler();
                //// console.log("Typing 2 check")
            }
            // When to stop typing ?, You erase the input : You were typing and the input is now empty
            else if (that.pubNubService.isCurrentUserTyping && that.messageModel.trim().length == 0) {
                stopTypingScheduler();
                //// console.log("Typing 3 check")
            } else {
                // console.log("Typing 4 check")
            }
        });
        function stopTypingScheduler() {
            if (instance != null) {
                clearTimeout(instance);
            }
            instance = setTimeout(function () {
                that.pubNubService.stopTyping(that.selectedUser.receiver_id)
            }, 5000);
        }
    }

    initKeyboardEvent() {
        this.events.subscribe(CONSTANTS.APP_EVENTS.KEYBOARD, () => {
            // console.log('ChatBox In Event CONSTANTS.APP_EVENTS.KEYBOARD subscribe');
            this.scrollToBottom();
        });
    }

    initCloseImagePreview() {
        // console.log('In initCloseImagePreview');
        this.events.subscribe(CONSTANTS.APP_EVENTS.CLOSE_IMAGE_PREVIEW, (data) => {
            this.onClosePresentShowImageModal(data);
        });
    }
    initNewMesssageEvent() {
        this.events.subscribe(CONSTANTS.APP_EVENTS.NEW_MESSAGE, (message) => {
            // console.log('ChatBox In Event APP_CONFIG.APP_EVENTS.NEW_MESSAGE subscribe', message);
            //let page: string = this.userService.getCurrentPage().currentPage;
            // If user is sending message on group then avoid duplicate message      
            let shared_channel = message.shared_channel || message.shared_channel_id;
            if (this.selectedUser.shared_channel == shared_channel) {
                this.messages.push(this.createMessage(message));
                this.scrollToBottom();
            }
        });
    }

    initPresenceEvent() {
        this.events.subscribe(CONSTANTS.APP_EVENTS.CHAT_BOX_PRESENCE_EVENT, (presence) => {
            //let presenceObj = presence[0];
            console.log('In Chat box subscribePresenceEvent[ action - ' + presence.action + ']', presence.channel, '-', this.userData.user_id);
            if (this.selectedUser !== undefined) {
                if (presence.uuid === this.selectedUser.user_id && presence.state != undefined && presence.state.isTyping !== undefined) {
                    this.selectedUser.isTyping = presence.state.isTyping;
                    // console.log("Typing status changed ", this.selectedUser.isTyping);
                }
                if (presence.uuid === this.selectedUser.user_id && presence.actualChannel === this.selectedUser.user_id + CONSTANTS.PRESENCE_POSTFIX) {
                    if (presence.action == "join") {
                        this.selectedUser.presence = "online";
                    }
                    else if (presence.action == "leave") {
                        this.selectedUser.presence = "";
                    }
                }
                if (presence.action == 'state-change' && presence.state !== undefined && presence.state.action == CONSTANTS.USER_STATES.GROUP_REMOVE
                    && this.selectedUser.shared_channel === presence.state.groupName && presence.channel === this.userData.user_id) {
                    console.log("Update removed user in chatbox ", presence.state.leaving_time_token);
                    this.selectedUser.leaving_time_token = presence.state.leaving_time_token;
                }
            }
        });
    }

    initConnectionStatusEvent() {
        this.events.subscribe(CONSTANTS.APP_EVENTS.CHAT_BOX_CONNECTION_STATUS_CHANGED, (event) => {
            //console.log('In app.component CONNECTION_STATUS_CHANGED', event);
            let stateObj: IConnectionStatusChangeState = event.state;
            if (stateObj && stateObj.action == CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED) {
                if (stateObj.connection_status === CONSTANTS.CONNECTION_STATUS.CONNECTED_BLOCKED) {
                    //console.log(stateObj.name + " has  Blocked You");
                    this.selectedUser.connection_status = CONSTANTS.CONNECTION_STATUS.CONNECTED_BLOCKED;
                } else if (stateObj.connection_status === CONSTANTS.CONNECTION_STATUS.CONNECTED) {
                    //console.log(stateObj.name + " has  UnBlocked You");
                    this.selectedUser.connection_status = CONSTANTS.CONNECTION_STATUS.CONNECTED;
                }
            }
        });
    }


    navigateBack() {
        this.navCtrl.setRoot(Conversations);
    }

    scrollToBottom() {
        let that = this;
        setTimeout(() => {
            if (that.content) {
                that.content.scrollTo(0, that.content.getContentDimensions().scrollHeight, 10);
            }
        });
    }

    navigatetoConversationSetting() {
        this.isSettingsDisabled = true;
        this.navCtrl.push(ConversationSetting, { selectedUser: this.selectedUser }).then(() => {
            this.isSettingsDisabled = false;
        });
    }

    uploadFileOnserver(fileURI, callback) {
        let fileUploadOptions: FileUploadOptions = {
            fileKey: 'file',
            fileName: getFileName(fileURI),
            httpMethod: 'POST'
        };

        if (fileUploadOptions.fileName.split('.').pop() == 'mp4') {
            Object.assign(fileUploadOptions, { mimeType: 'video/mp4' });
        }
        this.proceedUploadOnServer(fileURI, fileUploadOptions, callback);

        function getFileName(fileURI: string) {
            let fileName, fileExt;
            //// console.log(fileURI, "fileURI in getfile name");
            fileExt = fileURI.split('.').pop();
            fileName = new Date().getTime() + '.' + fileExt;
            return fileName;
        }
    }

    uploadVideoOnserver(fileURI, callback) {
        let fileUploadOptions: FileUploadOptions = {
            fileKey: 'file',
            fileName: fileURI.name,
            mimeType: fileURI.type,
            httpMethod: 'POST'
        };
        this.proceedUploadOnServer(fileURI, fileUploadOptions, callback);
    }

    proceedUploadOnServer(fileURI, fileUploadOptions, callback) {
        let uploadEndpoint: string;
        const fileTransfer = this.transfer.create();
        uploadEndpoint = ENVIRONMENT.APP_BASE_URL + '/listing/uploadImage';

        if (!fileUploadOptions.headers) {
            fileUploadOptions.headers = {
                'Authorization': 'Bearer ' + this.userService.http.token,
                source: CONSTANTS.UPLOAD_IMAGE_SOURCE.CHATS, user_id: this.userData.user_id
            };
        }
        // // console.log('In uploadFileOnserver fileUrl', fileURI, uploadEndpoint, fileUploadOptions);
        fileTransfer.upload(fileURI, uploadEndpoint, fileUploadOptions).then((data: any) => {
            //   // console.log('In uploadFileOnserver success', data)
            if (callback) {
                callback(null, JSON.parse(data.response));
            }
        }, (err) => {
            // console.log('In uploadFileOnserver err', err);
            this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.NO_NETWORK'));
            if (callback) {
                callback(err);
            }
        })
        fileTransfer.onProgress((state) => {
            // console.log(state);
        });
    }

    presentShowImageModal(image, isAttachment?: boolean, enableZoom: boolean = false) {
        this.navCtrl.push(ShowImage, { image_content: image, enableSendButton: isAttachment, enableZoom: enableZoom });
    }

    onClosePresentShowImageModal(data) {
        //// console.log('In onClosePresentShowImageModal', data);
        if (data.attachement) {
            this.messageModel = data.caption;
            if (data.caption && data.caption.trim().length > 0) {
                this.fileUpload(data.image, data.caption);
            } else {
                this.fileUpload(data.image, this.translateService.instant('MISC.IMAGE'));
            }
        }
    }

    fileUpload(imageData, caption?) {
        this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.UPLOADING'));
        this.uploadFileOnserver(imageData, (error, response) => {
            if (!error) {
                if (response.file_type == 'image/jpeg') {
                    this.pictureModel = response.image_url;
                    this.messageModel = caption;
                    this.sendMessage(this.messageModel);
                } else if (response.file_type == 'video/mp4') {
                    this.videoPath = response.image_url;
                }
            } else {
                this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
            }
            this.loaderService.dismissLoader();
        });
    }
    //NSPhotoLibraryAddUsageDescription
    takeFromCamera(source) {
        const options: CameraOptions = {
            quality: 100,
            destinationType: this.camera.DestinationType.FILE_URI,
            sourceType: source,
            allowEdit: false,
            encodingType: this.camera.EncodingType.JPEG,
            targetWidth: 1062,
            targetHeight: 600,
            mediaType: this.camera.MediaType.PICTURE,
            correctOrientation: true
        }

        if (source === this.camera.PictureSourceType.PHOTOLIBRARY) {
            options['saveToPhotoAlbum'] = false;
        } else {
            options['saveToPhotoAlbum'] = true;
        }

        this.camera.getPicture(options).then(imageData => {
            this.presentShowImageModal(imageData, true, false);
        }, error => {
            //this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
        });
    }

    takevideoCamera(source) {
        let options: any = {
            sourceType: this.camera.PictureSourceType.SAVEDPHOTOALBUM,
            mediaType: this.camera.MediaType.ALLMEDIA,
            destinationType: this.camera.DestinationType.FILE_URI
        };

        this.mediaCapture.captureVideo(options).then((videodata: MediaFile[]) => {
            this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.UPLOADING'));
            this.uploadVideoOnserver(videodata[0], (error, video_url) => {
                if (!error) {
                    this.videoPath = video_url;
                } else {
                    this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
                }
                this.loaderService.dismissLoader();
            });
        }, (err: CaptureError) => {
            //this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
        })
    }

    showActionSheet() {
        let buttons = [
            {
                text: this.translateService.instant("CONVERSATIONS.NEW_MSG.TAKE_PHOTO"),
                role: 'Take a photo',
                cssClass: 'take-photo',
                icon: 'icons-camera',
                handler: () => {
                    this.takeFromCamera(this.camera.PictureSourceType.CAMERA);
                }
            },
            {
                text: this.translateService.instant("CONVERSATIONS.NEW_MSG.ATTACH_PHOTO"),
                cssClass: 'take-photo',
                icon: 'icons-image-photo',
                handler: () => {
                    this.takeFromCamera(this.camera.PictureSourceType.PHOTOLIBRARY);
                }
            }
            // ,
            // {
            //     text: 'Take a  video',
            //     role: 'Take a  video',
            //     cssClass: 'take-photo',
            //     icon: 'icons-camera',
            //     handler: () => {
            //         this.takevideoCamera(Camera.PictureSourceType.PHOTOLIBRARY);
            //     }
            // }
        ];

        let actionSheet = this.actionSheetCtrl.create({
            cssClass: 'photo-sheet',
            buttons: buttons
        });
        actionSheet.present();
    }

}

