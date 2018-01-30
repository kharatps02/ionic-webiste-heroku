import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Events, Content } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';
import { ChatBox } from '../chat-box/chat-box';
import { UserService, IUser } from '../../../providers/user-service';
import { ChatService, IConversation, IGroup, IGroupMember, IManageGroup, IGetUserConversationRequest, IGetUserConversationResponse } from '../chat-service';
import { ConnectionList } from '../connection-list';
import { PubNubService } from '../../../providers/pubnub-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { formatDate } from '../../../shared/util/date';
import { AnalyticsService } from "../../../providers/analytics-service";
import { TranslateService } from "@ngx-translate/core";

@Component({
    selector: 'page-group-chat',
    templateUrl: 'group-chat.html',
})

export class GroupChat {
    public conversationType = CONSTANTS.CONVERSATION_TYPE;
    public usersListCopy: IUser;
    public connectedUsersList: Array<IConversation>;
    public pageCount: number;
    public placeholderIamges = CONSTANTS.PLACEHOLDER_IMAGES;
    public group: {
        searchStr: string;
        name: string,
        members: Array<IGroupMember>,
        memberIds: Array<string>,
        profile_pic: string,
        isEditAction: boolean
    };
    private userData: IUser;
    private connectionList: ConnectionList;
    public selectedGroup: any;
    @ViewChild(Content) content: Content;
    constructor(public navCtrl: NavController, private navParams: NavParams, private userService: UserService,
        private analyticsService: AnalyticsService, public chatService: ChatService, public pubNubService: PubNubService, private events: Events,
        private translateService: TranslateService,
        public loaderService: LoaderService, private keyboard: Keyboard) {

        this.selectedGroup = this.navParams.get('selectedGroup');
        this.connectionList = new ConnectionList(chatService, pubNubService, translateService, loaderService);
        this.userData = this.userService.getUser();
        this.connectedUsersList = [];
        this.group = { searchStr: '', name: '', members: [], memberIds: [], profile_pic: '', isEditAction: false };
    }

    ionViewDidEnter() {
        this.analyticsService.trackScreenView(CONSTANTS.PAGES.GROUP_CHAT);
        this.initSearchMembers();
        this.initGroupMembers();
        this.content.resize();
    }

    initSearchMembers() {
        let members = [], memberIds = [];
        if (this.selectedGroup) {
            //Navigation from Conversation Settings
            this.pageCount = 3;
            if (this.selectedGroup.type === CONSTANTS.CONVERSATION_TYPE.GROUP) {
                this.group.isEditAction = true;
                this.group.profile_pic = this.selectedGroup.profile_pic;
                if (this.selectedGroup.name !== undefined) {
                    this.group.name = this.selectedGroup.user_name;
                }
                if (this.selectedGroup.members && this.selectedGroup.members.length > 0) {
                    this.selectedGroup.members.forEach(user => {
                        if (this.selectedGroup.user_id !== user.user_id) {
                            members.push(user);
                            memberIds.push(user.user_id);
                        }
                    });
                }
            } else {
                let tempUser = {
                    user_id: this.selectedGroup.user_id,
                    user_name: this.selectedGroup.user_name,
                    profile_pic: this.selectedGroup.profile_pic
                };
                members.push(tempUser);
                memberIds.push(tempUser.user_id);
            }
            this.group.members = members;
            this.group.memberIds = memberIds;
        } else {
            //Navigation from Create New Group
            this.pageCount = 2;
        }
    }

    initGroupMembers() {
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
            this.group.members.push(user);
            this.group.memberIds.push(user.user_id)
        }
    }

    unSelectUser(user, index) {
        user.selected = false;
        this.group.members.splice(index, 1);
        this.group.memberIds.splice(index, 1);
        this.searchUser(this.group.searchStr);
        this.content.resize();
    }


    searchUser(searchString): void {
        // Reset items back to all of the items    
        this.connectedUsersList = JSON.parse(JSON.stringify(this.usersListCopy));
        // if the value is an empty string don't filter the items
        this.connectedUsersList = this.connectedUsersList.filter((item) => {
            return ((item.user_name.toLowerCase().indexOf(searchString.toLowerCase()) > -1) && (this.group.memberIds.indexOf(item.receiver_id) === -1));
        });
    }

    createGroup() {
        this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
        this.pubNubService.getTimeToken((pubnubtimestoken) => {
            this.createGroupPubnub(pubnubtimestoken);
        });
    }

    createGroupPubnub(timestamp: number): void {
        let that = this, groupObject: IGroup, sharedChannel: string, conversationObj: IConversation;
        let joining_time_token = timestamp;
        if (this.selectedGroup && this.selectedGroup.type === CONSTANTS.CONVERSATION_TYPE.GROUP) {
            sharedChannel = this.selectedGroup.shared_channel;
            joining_time_token = this.selectedGroup.joining_time_token;
        } else {
            sharedChannel = that.userData.user_id + '_' + new Date().getTime();
        }

        groupObject = {
            user_id: that.userData.user_id,
            name: that.group.name,
            shared_channel: sharedChannel,
            members: that.group.memberIds,
            created_by: that.userData.user_id,
            type: CONSTANTS.CONVERSATION_TYPE.GROUP,
            joining_time_token: timestamp,
            leaving_time_token: null
        };

        if (groupObject.name.trim().length > 0 && groupObject.members.length > 0) {

            that.chatService.createOrEditConversation(groupObject, this.group.isEditAction).subscribe((result) => {

                if (result.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
                    let groupUpdates: IManageGroup = { addedMembers: [], removedMembers: [] };
                    if (this.group.isEditAction) {
                        groupUpdates = that.manageGroupUpdates(groupObject.members);
                    } else {
                        groupUpdates.addedMembers = groupObject.members;
                    }

                    if (groupUpdates.removedMembers && groupUpdates.removedMembers.length > 0) {
                        this.pubNubService.removeChannelFromGroup(groupUpdates.removedMembers, groupObject.shared_channel, groupObject.name, timestamp);
                    }
                    if ((groupUpdates.addedMembers && groupUpdates.addedMembers.length > 0) || groupObject.name !== this.selectedGroup.name) {
                        that.pubNubService.addChanneltoGroup(groupUpdates.addedMembers, groupObject.shared_channel, groupObject.name, that.userService.userObj.user_id, that.userService.deviceToken, that.userService.pushPlatform);
                    }

                    // Notify group name change to members except addedMembers and removedMembers
                    if (this.group.isEditAction && this.group.name !== this.selectedGroup.user_name) {
                        let remainingMembers = [];
                        if (groupUpdates.addedMembers.length > 0 || groupUpdates.removedMembers.length > 0) {
                            groupObject.members.forEach((memberId) => {
                                if (groupUpdates.addedMembers.indexOf(memberId) === -1
                                    && groupUpdates.removedMembers.indexOf(memberId) === -1) {
                                    remainingMembers.push(memberId);
                                }
                            });
                        } else {
                            remainingMembers = groupObject.members;
                        }
                        // console.log('remainingMembers', remainingMembers);
                        if (remainingMembers.length > 0) {
                            this.pubNubService.setUserStateGroup(remainingMembers, CONSTANTS.USER_STATES.GROUP_RENAME,
                                groupObject.shared_channel, groupObject.name);
                        }
                    }


                    conversationObj = {
                        name: groupObject.name,
                        user_id: groupObject.shared_channel,
                        user_name: groupObject.name,
                        user_email: groupObject.name,
                        shared_channel: groupObject.shared_channel,
                        receiver_id: groupObject.shared_channel,
                        members: this.group.members,
                        type: groupObject.type,
                        timetoken: timestamp,
                        joining_time_token: joining_time_token,
                        leaving_time_token: null
                    };

                    if (!this.group.isEditAction) {
                        this.pubNubService.setPushNotificationChannels([sharedChannel]);
                        if (!!this.userService.userObj.notification_enabled) {
                            this.pubNubService.registerDevice([sharedChannel], this.userService.deviceToken, this.userService.pushPlatform);
                        }
                        conversationObj["joining_time_token"] = timestamp;
                        conversationObj["latestMessage"] = this.translateService.instant('ERROR_MESSAGES.GRP_JOINED');
                        conversationObj["latestMessageTimestamp"] = formatDate(this.pubNubService.getDateTime(timestamp), this.translateService);
                        conversationObj["connection_status"] = CONSTANTS.CONNECTION_STATUS.CONNECTED;
                        conversationObj["leaving_time_token"] = null;
                    }

                    that.navCtrl.remove((that.navCtrl.length() - this.pageCount), this.pageCount, { animate: false, progressAnimation: false }).then(() => {
                        that.navCtrl.push(ChatBox, { user: conversationObj }).then(() => {
                            that.events.publish(CONSTANTS.APP_EVENTS.GROUP_CREATED, conversationObj, "Group Created");
                            that.loaderService.dismissLoader();
                        });
                    });

                } else {
                    this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
                    this.loaderService.dismissLoader();
                }
            }, error => {
                this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
                this.loaderService.dismissLoader();
            });
        } else {
            this.loaderService.dismissLoader();
        }
    }

    manageGroupUpdates(memberIds: Array<string>): IManageGroup {
        let removedMembers: Array<string> = [];
        let existingMembers: Array<string> = [];
        let addedMembers: Array<string> = [];
        this.selectedGroup.members.forEach((member) => {
            if (memberIds.indexOf(member.user_id) == -1 && member.user_id !== this.userData.user_id) {
                removedMembers.push(member.user_id);
            }
            existingMembers.push(member.user_id);
        });

        memberIds.forEach((memberId) => {
            if (existingMembers.indexOf(memberId) == -1 && memberId !== this.userData.user_id) {
                addedMembers.push(memberId);
            }
        });
        return { addedMembers: addedMembers, removedMembers: removedMembers };
    }

    changeProfile() {
        // TODO 
    }
    hideKeyboard() {
        this.keyboard.close();
    }
}



