import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Events, Content } from 'ionic-angular';
import { IConversation, ChatService, IGetUserConversationRequest, IGetUserConversationResponse, IGroupMember } from "../../conversations/chat-service";
import { ConnectionList } from "../../conversations/connection-list";
import { IUser, UserService } from "../../../providers/user-service";
import { PubNubService } from "../../../providers/pubnub-service";
import { LoaderService } from "../../../providers/loader-service";
import { TranslateService } from "@ngx-translate/core";
import { AnalyticsService } from "../../../providers/analytics-service";
import { CONSTANTS } from "../../../shared/config";
import { IShareFeedRequest, ActivityService } from "../activity-service";
import { IGenericResponse } from "../../aroundme/aroundme-service";


@Component({
  selector: 'page-contact-list',
  templateUrl: 'contact-list.html',
})
export class ContactListPage {

  private rezfeed_id: string;
  private feed_title: string;
  public conversationType = CONSTANTS.CONVERSATION_TYPE;
  public usersListCopy: IUser;
  public connectedUsersList: Array<IConversation>;
  public pageCount: number;
  public placeholderIamges = CONSTANTS.PLACEHOLDER_IMAGES;
  private receiverIds: Array<string>;
  private contacts: Array<IGroupMember>;
  private userData: IUser;
  private connectionList: ConnectionList;
  public selectedGroup: any;
  private searchStr: string;

  @ViewChild(Content) content: Content;
  constructor(private activityService: ActivityService, public navCtrl: NavController, private navParams: NavParams, private userService: UserService,
    private analyticsService: AnalyticsService, public chatService: ChatService, public pubNubService: PubNubService, private events: Events,
    private translateService: TranslateService,
    public loaderService: LoaderService) {
    this.receiverIds = [];
    this.contacts = [];
    this.rezfeed_id = this.navParams.get('rezfeed_id');
    this.feed_title = this.navParams.get('feed_title');
    this.connectionList = new ConnectionList(chatService, pubNubService, translateService, loaderService);
    this.userData = this.userService.getUser();
    this.connectedUsersList = [];
  }

  ionViewDidEnter() {
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.GROUP_CHAT);
    this.initContacts();
    this.content.resize();
  }


  initContacts() {
    let params: IGetUserConversationRequest = { user_id: this.userData.user_id, is_group_data_needed: false };
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.connectionList.getUserList(params, (error, response: IGetUserConversationResponse) => {
      this.connectionList.updatePresenceStatus(response.connected, () => {
        this.usersListCopy = JSON.parse(JSON.stringify(response.connected));
        this.searchUser('');
        this.loaderService.dismissLoader();
      });
    });
  }

  selectUser(user) {
    this.content.resize();
    user.selected = true;
    if (user.selected) {
      this.contacts.push(user);
      this.receiverIds.push(user.user_id);
    }
  }

  unSelectUser(user, index) {
    user.selected = false;
    this.contacts.splice(index, 1);
    this.receiverIds.splice(index, 1);
    this.searchUser(this.searchStr);
    this.content.resize();
  }


  searchUser(searchString): void {
    // Reset items back to all of the items    
    this.connectedUsersList = JSON.parse(JSON.stringify(this.usersListCopy));
    // if the value is an empty string don't filter the items
    this.connectedUsersList = this.connectedUsersList.filter((item) => {
      return ((item.user_name.toLowerCase().indexOf(searchString.toLowerCase()) > -1) && (this.receiverIds.indexOf(item.receiver_id) === -1));
    });
  }

  shareFeed() {
    let shareFeedRequest: IShareFeedRequest = {
      receiver_id: this.receiverIds,
      rezfeed_id: this.rezfeed_id,
      user_id: this.userData.user_id,
      feed_title: this.feed_title
    }
    console.log(shareFeedRequest);
    this.activityService.shareFeed(shareFeedRequest).subscribe((response:IGenericResponse) => {
      this.loaderService.showToaster(response.message);
      //this.loaderService.dismissLoader();
      this.navCtrl.pop();
    });
    //this.navCtrl.pop();
  }

}
