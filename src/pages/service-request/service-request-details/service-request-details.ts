import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, ActionSheetController, Events, Content } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Camera } from '@ionic-native/camera';
import { LoaderService } from '../../../providers/loader-service';
import { ChatService, IMessage } from '../../conversations/chat-service';
import { CONSTANTS } from '../../../shared/config';
import { ServiceRequestService, IServiceRequestDetails, ISaveMessage } from './../service-request-service';
import { UserService, IUser } from '../../../providers/user-service';
import { PubNubService, PubNubEvent } from '../../../providers/pubnub-service';
import { UploadService, IUploadOptions } from '../../../providers/upload-service';
@Component({
  selector: 'service-request-details',
  templateUrl: 'service-request-details.html'
})
export class ServiceRequestDetails {
  private serviceRequestId: string;
  public selectedTab: string = 'details';
  public serviceRequestDetails: IServiceRequestDetails;
  public userData: IUser;
  public messages: Array<any> = [];
  public messageModel: string;
  public pictureModel: string;
  public placeholderIamges = CONSTANTS.PLACEHOLDER_IMAGES;
  public messageContentType = CONSTANTS.MESSAGE_CONTENT_TYPE_ID;
  public contactIdDetailMap: Map<string, any>;
  @ViewChild(Content) content: Content;
  constructor(public navCtrl: NavController, private serviceRequestService: ServiceRequestService, private navParams: NavParams, private camera: Camera,
    private translateService: TranslateService, private userService: UserService, private loaderService: LoaderService, public events: Events,
    private pubNubService: PubNubService, public actionSheetCtrl: ActionSheetController, private uploadService: UploadService, private chatService: ChatService) {
    this.selectedTab = 'details';
    this.serviceRequestId = this.navParams.get('_id');
    this.userData = this.userService.getUser();
    this.serviceRequestDetails = {
      _id: '',
      address: '',
      description: '',
      incident_number: '',
      photos: [],
      property_id: '',
      status: '',
      type: '',
      type_id: '',
      user_name: ''
    };
    this.contactIdDetailMap = new Map<string, any>();
    this.contactIdDetailMap[this.userData.user_id] = { user_name: this.userData.user_name, profile_pic: this.userData.profile.profile_pic };
  }

  ionViewDidEnter() {
    this.init();
  }

  ionViewDidLoad() {
    this.initServiceRequestMessageEvent();
  }

  ionViewWillUnload() {
    this.events.unsubscribe(CONSTANTS.APP_EVENTS.SERVICE_REQUEST_MESSAGE);
  }

  initServiceRequestMessageEvent() {
    this.events.subscribe(CONSTANTS.APP_EVENTS.SERVICE_REQUEST_MESSAGE, (message, time) => {
      //console.log('In SERVICE_REQUEST_MESSAGE Event Type ', message);
      if (this.serviceRequestDetails.conversation && this.serviceRequestDetails.conversation.shared_channel === message.shared_channel
        && this.userData.user_id !== message.sender_uuid) {
        this.messages.push(this.createMessage(message));
        this.scrollToBottom();
      }
    });
  }

  init() {
    if (this.serviceRequestId) {
      this.loaderService.createLoader(this.translateService.instant("ERROR_MESSAGES.PLEASE_WAIT"));
      this.serviceRequestService.getServiceRequestDetails({ _id: this.serviceRequestId }).subscribe((response) => {
        if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
          //console.log(response.service_request[0]);
          this.serviceRequestDetails = response.service_request[0];
          this.serviceRequestDetails.status_translated = this.translateService.instant("SERVICE_REQUESTS.REQUEST_LIST." + this.serviceRequestDetails.status.toUpperCase());
        }
        this.loaderService.dismissLoader();
      });
    }
  }

  onDetailsClick() {
    this.content.resize();
  }
  onConversationClick() {
    // Init contactIdDetailMap for display members picture
    if (this.serviceRequestDetails.providers) {
      this.setContactIdDetailMap(this.serviceRequestDetails.providers);
    }

    // Load existing history of selected incident
    if (this.serviceRequestDetails.conversation) {
      let languages = [this.userService.getCurrentLang()];
      this.serviceRequestDetails.providers.forEach((self) => {
        if (self.device_lang && languages.indexOf(self.device_lang) === -1) {
          languages.push(self.device_lang);
        }
      });
      this.serviceRequestDetails.conversation.languages = languages;
      this.loadSelectedIncidentHistory(this.serviceRequestDetails.conversation);
    }
    this.content.resize();
  }

  setContactIdDetailMap(userList: Array<any>) {
    userList.forEach(element => {
      this.contactIdDetailMap[element.user_id] = { profile_pic: element.profile_pic || '', user_name: element.user_name || '' };
    });
  }

  loadSelectedIncidentHistory(conversationObj) {
    let that = this;
    let leaving_time_token = null;
    if (conversationObj.leaving_time_token !== undefined && conversationObj.leaving_time_token > 0) {
      leaving_time_token = conversationObj.leaving_time_token;
    }
    this.pubNubService.historyresponse = null;
    this.pubNubService.chathistory(conversationObj.shared_channel, true, CONSTANTS.CONVERSATION_MAX_UNREAD_COUNT, conversationObj.joining_time_token, leaving_time_token).subscribe((event: PubNubEvent) => {
      let messages: Array<any> = [];
      for (let i = 0; i < event.value.messages.length; i++) {
        if (event.value.messages[i].entry !== undefined) {
          messages.push(that.createMessage(event.value.messages[i].entry));
        }
      }
      //console.log(messages);
      that.messages = messages;
      this.scrollToBottom();
    });
  }

  createMessage(message: IMessage): any {
    let messageObj, contactObj = {}, senderObj = this.contactIdDetailMap[message.sender_uuid];
    if (senderObj) {
      contactObj = { user_name: senderObj.user_name, profile_pic: senderObj.profile_pic };
    }
    messageObj = {
      content: this.chatService.getMessageContent(message.content),
      shared_channel: message.shared_channel,
      image: message.image,
      sender_uuid: message.sender_uuid,
      receiver_uuid: message.receiver_uuid,
      video: message.video,
      timetoken: message.timetoken / 10000,
      is_sys_msg: message.is_sys_msg || false,
      content_type_id: message.content_type_id || ''
    };


    Object.assign(messageObj, contactObj);
    return messageObj;
  }

  scrollToBottom() {
    let that = this;
    setTimeout(() => {
      if (that.content && that.content._scroll) {
        that.content.scrollTo(0, that.content.getContentDimensions().scrollHeight, 10);
      }
    });
  }

  sendMessage() {
    let conversation = this.serviceRequestDetails.conversation;
    if (conversation) {
      this.pubNubService.getTimeToken((pubnubtimestoken) => {
        let coreMessageObj = {
          content: null,
          sender_uuid: this.userData.user_id,
          image: this.pictureModel,
          receiver_uuid: conversation.shared_channel,
          shared_channel: conversation.shared_channel,
          timetoken: pubnubtimestoken,
          is_group: true,
          is_sys_msg: false,
          content_type_id: CONSTANTS.MESSAGE_CONTENT_TYPE_ID.SERVICE_REQUEST
        };
        this.pubNubService.getSupportedLanguageMsg(this.messageModel, conversation.languages, false).subscribe((msgContent) => {
          coreMessageObj.content = msgContent;

          this.pubNubService.publish(coreMessageObj.shared_channel, coreMessageObj).subscribe((event) => {
            // console.log('In sendInvitationMessageToAdmin Publish message', coreMessageObj, event);
            this.messages.push(this.createMessage(coreMessageObj));
            let saveMessage: ISaveMessage = {
              user_id: this.userData.user_id,
              content: coreMessageObj.content,
              shared_channel: coreMessageObj.shared_channel
            };
            this.serviceRequestService.saveMessage(saveMessage).subscribe(() => {
              // console.log('Saved message!');
            });
            this.scrollToBottom();
            this.resetMessageModel();
          });
        }, error => {
          this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
        });
      });
    }
  }

  resetMessageModel(): void {
    this.messageModel = '';
    this.pictureModel = '';

  }

  uploadDone(error, url: string) {
    if (!error) {
      this.pictureModel = url;
      this.sendMessage();
    }
    console.log(error, url);
  }

  showActionSheet() {
    let that = this;
    let uploadOptions:IUploadOptions = {
      sourceType: that.camera.PictureSourceType.CAMERA,
      bucketSource: CONSTANTS.UPLOAD_IMAGE_SOURCE.INCIDENTS, cropImage: false,
      targetHeight: 600,
      targetWidth: 1062
    };

    let buttons = [
      {
        text: this.translateService.instant("CONVERSATIONS.NEW_MSG.TAKE_PHOTO"),
        role: 'Take a photo',
        cssClass: 'take-photo',
        icon: 'icons-camera',
        handler: () => {
          that.uploadService.takeFromCamera(uploadOptions, (error, image) => {
            that.uploadDone.call(that, error, image);
          });
        }
      },
      {
        text: this.translateService.instant("CONVERSATIONS.NEW_MSG.ATTACH_PHOTO"),
        cssClass: 'take-photo',
        icon: 'icons-image-photo',
        handler: () => {
          uploadOptions.sourceType = that.camera.PictureSourceType.PHOTOLIBRARY;
          that.uploadService.takeFromCamera(uploadOptions, (error, image) => {
            that.uploadDone.call(that, error, image)
          });
        }
      }
    ];

    let actionSheet = this.actionSheetCtrl.create({
      cssClass: 'photo-sheet',
      buttons: buttons
    });
    actionSheet.present();
  }
}