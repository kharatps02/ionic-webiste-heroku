import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Events, Content, AlertController } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';
import { PublicProfile } from './../public-profile/public-profile';
import { ChatBox } from '../../conversations/chat-box/chat-box';
import { Conversations } from '../../conversations/conversations';
import { GroupChat } from '../group-chat/group-chat';
import { ConnectionList } from '../connection-list';
import { UserService, IUser } from '../../../providers/user-service';
import { PubNubService } from '../../../providers/pubnub-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';

import { ChatService, IConversation, IGetUserConversationRequest, ISearchConversationRequest, IGetUserConversationResponse } from '../chat-service';
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'page-new-message',
  templateUrl: 'new-message.html',
})
export class NewMessage {

  public placeholderIamges = CONSTANTS.PLACEHOLDER_IMAGES;
  public connectionStatus = CONSTANTS.CONNECTION_STATUS;
  public connectedUsersList: Array<IConversation>;
  public otherUsersList: Array<IConversation>;
  public searchStr: string;
  private connectionList: ConnectionList;
  private userData: IUser;
  private publicProfile: PublicProfile;
  @ViewChild(Content) content: Content;
  constructor(public navCtrl: NavController, public navParams: NavParams, private userService: UserService, public chatService: ChatService,
    public pubNubService: PubNubService, public loaderService: LoaderService, public events: Events, private alertCtrl: AlertController,
    private translateService: TranslateService,
    public analyticsService: AnalyticsService, private keyboard: Keyboard) {
    this.connectionList = new ConnectionList(chatService, pubNubService, translateService, loaderService);
    this.userData = this.userService.getUser();
    this.connectedUsersList = [];
    this.searchStr = '';
    this.publicProfile = new PublicProfile(navCtrl, navParams, userService, chatService, loaderService, pubNubService, translateService, analyticsService, events, alertCtrl);
  }

  ionViewDidEnter() {
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.NEW_MESSAGE);

    this.inItUserList();
  }

  ionViewDidLoad() {
    this.initPresence();
  }

  ionViewWillUnload() {
    // console.log("new-message- Looks like I'm about to ionViewWillUnload :(");
    this.events.unsubscribe(CONSTANTS.APP_EVENTS.NEW_MSG_PRESENCE_EVENT);
  }

  inItUserList(showLoader: boolean = true) {
    let params: IGetUserConversationRequest = { user_id: this.userData.user_id, is_group_data_needed: false };
    if (showLoader) {
      this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    }

    this.connectionList.getUserList(params, (error, response: IGetUserConversationResponse) => {
      let otherUsersList = [];
      this.connectedUsersList = response.connected;
      otherUsersList = response.invitation_sent || [];
      otherUsersList = otherUsersList.concat(response.invitation_received);
      this.otherUsersList = otherUsersList;
      this.connectionList.updatePresenceStatus(this.connectedUsersList);
      this.loaderService.dismissLoader();
    });
  }

  initPresence() {
    this.events.subscribe(CONSTANTS.APP_EVENTS.NEW_MSG_PRESENCE_EVENT, (presence) => {
      //let presenceObj = presence[0];
      //console.log('In NewMessage subscribePresenceEvent[ action - ' + presence.action + ']', presence);
      if ((presence.action == 'state-change' && presence.state !== undefined && presence.channel === this.userService.userObj.user_id)
        && (presence.state.action == CONSTANTS.USER_STATES.CONNECTION_STATUS_CHANGED && (presence.state.connection_status === CONSTANTS.CONNECTION_STATUS.INVITED
          || presence.state.connection_status === CONSTANTS.CONNECTION_STATUS.CONNECTED
          || presence.state.connection_status === CONSTANTS.CONNECTION_STATUS.IGNORE))) {
        // console.log('Called CONSTANTS.APP_EVENTS.NEW_MSG_PRESENCE_EVENT ');
        this.inItUserList(false);
      } else {
        //Set user online status.
        this.connectedUsersList.map((user, index) => {
          if (presence.uuid === user.user_id && presence.actualChannel === user.user_id + "present-pnpres") {
            if (presence.action == "join") {
              user.presence = "online";
            }
            else if (presence.action == "leave") {
              user.presence = "";
            }
          }
        });
      }
    });
  }

  navigateToConversationPage(): void {
    this.searchStr = '';
    this.navCtrl.setRoot(Conversations)
  }

  searchUser(): void {
    // set val to the value of the searchbar
    let searchStr = this.searchStr;
    // if the value is an empty string don't filter the items
    if (searchStr && searchStr.trim() != '') {
      let params: ISearchConversationRequest = { user_id: this.userData.user_id, search_by: searchStr };
      this.connectedUsersList = [];
      this.otherUsersList = [];
      this.connectionList.searchConversation(params, (error, response: IGetUserConversationResponse) => {
        this.connectedUsersList = response.connected;
        this.otherUsersList = response.otherUsersList;
        this.connectionList.updatePresenceStatus(this.connectedUsersList);
      });
    } else {
      this.inItUserList(false);
    }
  }

  openConversation(conversation: IConversation) {
    //console.log('openConversation', conversation.connection_status);
    conversation.type = CONSTANTS.CONVERSATION_TYPE.SINGLE;
    switch (conversation.connection_status) {
      case CONSTANTS.CONNECTION_STATUS.INVITED:
        this.viewSentInvite(conversation);
        break;
      case CONSTANTS.CONNECTION_STATUS.INVITATION_RECEIVED:
        this.viewReceivedInvite(conversation);
        break;
      case CONSTANTS.CONNECTION_STATUS.CONNECTED:
      case CONSTANTS.CONNECTION_STATUS.CONNECTED_BLOCKED:
        this.openChatBox(conversation);
        break;
    }
  }

  inviteOrCancelInvite(conversation: IConversation, position: number) {
    conversation.type = CONSTANTS.CONVERSATION_TYPE.SINGLE;
    this.publicProfile.inviteOrCancelInvite(conversation, true, () => {
      if (conversation.connection_status === CONSTANTS.CONNECTION_STATUS.NOT_CONNECTED && this.searchStr.trim().length === 0) {
        this.otherUsersList.splice(position, 1);
      }
    });
  }

  viewSentInvite(conversation: IConversation) {
    this.navCtrl.push(ChatBox, { user: conversation });
  }

  viewReceivedInvite(conversation: IConversation) {
    this.navCtrl.push(PublicProfile, { user: conversation });
  }

  openChatBox(conversation: IConversation) {
    this.navCtrl.push(ChatBox, { user: conversation }).then(() => {
      this.navCtrl.remove((this.navCtrl.length() - 2), 1);
    });
  }

  createNewGroup() {
    this.searchStr = '';
    this.navCtrl.push(GroupChat);
  }

  hideKeyboard() {
    this.keyboard.close();
  }
}
