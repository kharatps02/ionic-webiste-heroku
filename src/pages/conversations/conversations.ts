import { Component, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { NavController, Events, LoadingController, Platform, AlertController, ItemSliding, Content } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';

import { NewMessage } from '../conversations/new-message/new-message';
import { PublicProfile } from './public-profile/public-profile';
import { ChatBox } from '../conversations/chat-box/chat-box';
import { BaseConversations } from './base-conversations';
import { UserService } from '../../providers/user-service';
import { PubNubService } from '../../providers/pubnub-service';
import { ChatService, IConversation } from './chat-service';
import { AnalyticsService } from '../../providers/analytics-service';
import { LoaderService } from '../../providers/loader-service'
import { CONSTANTS } from '../../shared/config';
import { TranslateService } from "@ngx-translate/core";
import { HousingProviderOptions } from "./housing-provider-options/housing-provider-options";

@Component({
  selector: 'page-conversations',
  templateUrl: 'conversations.html'
})

export class Conversations extends BaseConversations implements OnDestroy {
  private zone: NgZone;
  public placeholderIamges = CONSTANTS.PLACEHOLDER_IMAGES;
  public connectionStatus = CONSTANTS.CONNECTION_STATUS;
  public groupType: string = CONSTANTS.CONVERSATION_TYPE.GROUP;
  @ViewChild(Content) content: Content;
  constructor(public navCtrl: NavController, public userService: UserService,
    public pubNubService: PubNubService, public chatService: ChatService, public events: Events, public loadingCtrl: LoadingController,
    public analyticsService: AnalyticsService, public platform: Platform, public loaderService: LoaderService, public translateService: TranslateService,
    private alertCtrl: AlertController, private keyboard: Keyboard) {

    super(userService, pubNubService, translateService, chatService, loaderService);
    this.zone = new NgZone({ enableLongStackTrace: false });
  }

  ngOnDestroy() {
    this.ionViewWillUnload();
  }

  ngAfterViewInit() {
    // TODO - Need to move from here
    let elem = <HTMLElement>document.querySelector('.tabbar');
    elem.style.display = 'flex';
    // TODO - Need to move from here once Keyboard issue fixed 
    this.keyboard.close();
  }

  ionViewDidEnter() {
    //console.log("Conversations ionViewDidEnter");
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.CONVERSATION);
    this.userService.setCurrentPage(CONSTANTS.PAGES.CONVERSATION);
    this.content.resize();
  }

  ionViewDidLoad() {
    //console.log("Conversations ionViewDidLoad");
    this.initUpdateConversationEvent();
    this.initSentConversationEvent();
    this.initPresenceEvent();
    this.initGroupCreatedEvent();
    this.initConversation();
    this.initUnBlockEvent();
    this.pubNubService.isConversationVist = true;
  }

  ionViewWillUnload() {
    //console.log("Conversations - Looks like I'm about to ionViewWillUnload :(");
    this.events.unsubscribe(CONSTANTS.APP_EVENTS.UPDATE_CONVERSATION);
    this.events.unsubscribe(CONSTANTS.APP_EVENTS.SENT_MESSAGE);
    this.events.unsubscribe(CONSTANTS.APP_EVENTS.CONV_PRESENCE_EVENT);
    this.events.unsubscribe(CONSTANTS.APP_EVENTS.GROUP_CREATED);
    this.events.unsubscribe(CONSTANTS.APP_EVENTS.REFRESH_CONVERSATION);

  }

  initConversation(): void {
    let showLoader = (this.userService.userObj.show_coach_marks.conversation) ? false : true;
    this.refreshConversation(this.refreshConversationDone, showLoader);
  }

  initUpdateConversationEvent(): void {
    this.events.subscribe(CONSTANTS.APP_EVENTS.UPDATE_CONVERSATION, (message, time) => {
      // console.log('In UPDATE_CONVERSATION Event Type ', event[1]);
      let timetoken = null;
      if (time && message.is_group) {
        timetoken = time;
      } else {
        // console.log('Using message timetoken');
        timetoken = message.timetoken;
      }
      this.updateConversations(message, timetoken);
    });
  }

  initSentConversationEvent(): void {
    this.events.subscribe(CONSTANTS.APP_EVENTS.SENT_MESSAGE, (event) => {
      // console.log('In initSentConversationEvent SENT_MESSAGE Type ', event[0]);
      this.updateSentConversations(event);

    });
  }

  initGroupCreatedEvent(): void {
    this.events.subscribe(CONSTANTS.APP_EVENTS.GROUP_CREATED, (event) => {
      // console.log('Inside GROUP_CREATED subscribe>', event);
      let conversation = event;
      if (!this.sharedChannelConversationIdMap[conversation.shared_channel]) {
        this.conversations.push(conversation);
      } else {
        this.sharedChannelConversationIdMap[conversation.shared_channel] = conversation;
        if (this.sharedChannelIdConversationIndexMap[conversation.shared_channel] !== undefined) {
          this.conversations[this.sharedChannelIdConversationIndexMap[conversation.shared_channel]].user_name = conversation.user_name;
        }
      }
      this.sortConversation(this.conversations, (conversations) => {
        this.conversations = conversations;
      });
    });
  }

  initUnBlockEvent(): void {
    this.events.subscribe(CONSTANTS.APP_EVENTS.REFRESH_CONVERSATION, () => {
      this.refreshConversation(this.refreshConversationDone, false);
    });
  }


  initPresenceEvent(): void {
    this.events.subscribe(CONSTANTS.APP_EVENTS.CONV_PRESENCE_EVENT, (presence) => {
      //Set user online status.
      //let presenceObj = presence[0];
      //console.log('In subscribePresenceEvent[ action - ' + presence.action + ']', presence);
      this.handlePresenceUpdate(presence);
      // If someone added you in group,someone accepted user invitation  
      this.handleStateupdate(presence);
    });
  }

  handleStateupdate(presenceObj) {
    if (presenceObj.action == 'state-change' && presenceObj.state !== undefined && presenceObj.channel === this.userService.userObj.user_id) {
      let showLoader = this.userService.getCurrentPage().currentPage === CONSTANTS.PAGES.CONVERSATION && !this.userService.userObj.show_coach_marks.conversation;
      
      switch (presenceObj.state.action) {
        case CONSTANTS.USER_STATES.GROUP_ADD:
        case CONSTANTS.USER_STATES.GROUP_REMOVE:
        case CONSTANTS.USER_STATES.GROUP_RENAME:
        case CONSTANTS.USER_STATES.VERIFICATION_REQUEST:
        case CONSTANTS.USER_STATES.VERIFICATION_CANCEL: {
          this.refreshConversation(this.refreshConversationDone, showLoader);
          break;
        }
        case CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED: {
          this.handleConnectionStatusUpdate(presenceObj);
          break;
        }
      }
    }
  }

  handleConnectionStatusUpdate(presenceObj) {
    let showLoader = this.userService.getCurrentPage().currentPage === CONSTANTS.PAGES.CONVERSATION && !this.userService.userObj.show_coach_marks.conversation;
    
    switch (presenceObj.state.connection_status) {      
      case CONSTANTS.CONNECTION_STATUS.INVITED:
      case CONSTANTS.CONNECTION_STATUS.IGNORE: {
        this.refreshConversation(this.refreshConversationDone,showLoader);
        break;
      }
      case CONSTANTS.CONNECTION_STATUS.CONNECTED: {
        if (presenceObj.state.connection_action &&
          (presenceObj.state.connection_action === CONSTANTS.CONNECTION_STATUS.BLOCKED ||
            presenceObj.state.connection_action === CONSTANTS.CONNECTION_STATUS.UNBLOCKED)) {
          this.updateConnectionStatus(presenceObj.uuid, presenceObj.state.connection_status);
        } else {
          this.refreshConversation(this.refreshConversationDone, showLoader);
        }
        break;
      }
      case CONSTANTS.CONNECTION_STATUS.CONNECTED_BLOCKED: {
        //Just update the status to connected blocked 
        this.updateConnectionStatus(presenceObj.uuid, presenceObj.state.connection_status);
        break;
      }
    }
  }

  updateConnectionStatus(userId: string, connectionStatus: number) {
    this.conversations.map((conversation, index) => {
      if (userId === conversation.user_id) {
        conversation.connection_status = connectionStatus;
      }
    });
  }

  handlePresenceUpdate(presenceObj) {
    if (this.conversations !== undefined) {
      this.conversations.map((conversation, index) => {
        // if (presenceObj.uuid === conversation.user_id && presenceObj.state != undefined) {
        //   conversation.isTyping = presenceObj.state.isTyping;
        //   // // console.log("Typing status changed ", conversation.isTyping);
        // }
        if (presenceObj.uuid === conversation.user_id && presenceObj.actualChannel === conversation.user_id + CONSTANTS.PRESENCE_POSTFIX) {
          if (presenceObj.action == "join") {
            conversation.presence = "online";
          }
          else if (presenceObj.action == "leave") {
            conversation.presence = "";
          }
        }
      });
    }
  }

  doRefreshConversation(refresher): void {
    // console.log('In doRefreshConversation');
    this.refreshConversation(() => {
      refresher.complete();
      this.updateSubscribeChannels();
      this.refreshConversationDone();
    });
  }

  openConversation(user): void {
    //console.log("In openConversation User object is ", user);
    user.badgeCount = 0;
    if (user.connection_status === CONSTANTS.CONNECTION_STATUS.INVITATION_RECEIVED) {
      this.viewInvite(user);
    } else if (user.connection_status === CONSTANTS.CONNECTION_STATUS.CONNECTED || user.connection_status === CONSTANTS.CONNECTION_STATUS.CONNECTED_BLOCKED || user.connection_status === CONSTANTS.CONNECTION_STATUS.INVITED) {
      this.navCtrl.push(ChatBox, { user: user });
    }
  }

  navigateToNewMessagePage(): void {
    this.navCtrl.push(NewMessage);
  }

  viewInvite(user) {
    if (user.group_type !== CONSTANTS.GROUP_TYPE.HOUSING_PROVIDER) {
      this.navCtrl.push(PublicProfile, { user: user });
    } else {
      this.navCtrl.push(HousingProviderOptions, { user: user });
    }
  }

  leaveGroup(conversation: IConversation, slidingItem: ItemSliding) {
    let alert = this.alertCtrl.create({
      title: this.translateService.instant('CONVERSATIONS.LEAVE_GROUP'),
      buttons: [{
        text: this.translateService.instant('CONVERSATIONS.OK'),
        handler: () => {
          slidingItem.close();
          this.exitGroup(conversation);
          alert.dismiss();
          return false;
        }
      },
      {
        text: this.translateService.instant('CONVERSATIONS.CANCEL'),
        role: 'cancel',
        handler: () => {
          slidingItem.close();
        }
      }],
      enableBackdropDismiss: false
    });
    alert.present();
  }

  deleteConversation(conversation: IConversation, slidingItem: ItemSliding, position: number) {
    let that = this;
    let alert = that.alertCtrl.create({
      title: this.translateService.instant('CONVERSATIONS.DELETE_GROUP'),
      buttons: [{
        text: this.translateService.instant('CONVERSATIONS.OK'),
        handler: () => {
          slidingItem.close();
          that.chatService.deleteGroupConversation(conversation.shared_channel, that.userService.userObj.user_id).subscribe((response: any) => {
            //console.log("Success", response);
            if (response.status !== 'ERROR') {
            }
          });
          that.conversations.splice(position, 1);
          alert.dismiss();
          return false;
        }
      },
      {
        text: this.translateService.instant('CONVERSATIONS.CANCEL'),
        role: 'cancel',
        handler: () => {
          slidingItem.close();
        }
      }],
      enableBackdropDismiss: false
    });
    alert.present();
  }

  archiveConversation(conversation: IConversation, index: number) {
    let that = this;
    //Archive Conversation
    that.conversations[index].status = CONSTANTS.CONVERSATION_STATUS.ARCHIVE;
    that.pubNubService.getTimeToken((pubnubtimetoken) => {
      that.pubNubService.setConversationLastState(conversation.shared_channel, 0, pubnubtimetoken);
      that.updateConversationStatus(conversation);
    });
  }
}
