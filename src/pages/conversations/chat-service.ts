import { Injectable } from '@angular/core';
import { HttpService } from '../../providers/http-service';
import { UserService } from '../../providers/user-service';
import { ENVIRONMENT } from '../../shared/environment';
import { CONSTANTS } from '../../shared/config';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';

@Injectable()
export class ChatService {
    constructor(public http: HttpService, public userService: UserService) {
        // console.log('Hello ChatService Provider')
    }

    createOrEditConversation(params: IGroup, isEdit: boolean = false): Observable<any> {
        // console.log('In createGroup, isEdit:', isEdit)
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chat'
        if (isEdit) {
            url += '/updategroupdetails'
        }
        return this.http.post(url, params).map((res: any) => res.json())
    }

    updateConnectionStatus(params: IUpdateConnectionStatusRequestParams): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chat/updateconnectionstatus';
        return this.http.post(url, params).map((res: any) => res.json())
    }

    updateProviderConnectionStatus(params: IUpdateProviderConnectionRequestParams): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chat/updateproviderconnection';
        return this.http.post(url, params).map((res: any) => res.json())
    }

    updateConversationStatus(params: IUpdateConversationStatusRequestParams): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chat/updateconversationstatus';
        return this.http.post(url, params).map((res: any) => res.json())
    }

    chatArchives(params: IArchive): Observable<any> {
        // console.log('In chatarchives')
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chatarchives'
        return this.http.post(url, params).map((res: any) => res.json())
    }
    changePushNotificationSetting(params: { _id: string, notification: boolean }): Observable<any> {
        // console.log('In changePushNotificationSetting')
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chat/updateconversation'
        return this.http.post(url, params).map((res: any) => res.json())
    }

    getUserConversation(params: IGetUserConversationRequest): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chat/getconversationdetails'
        return this.http.post(url, params).map((res: any) => res.json());
    }

    getConversationExtraData(params: { shared_channel: string }): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chat/detectconversationlanguages '
        return this.http.post(url, params).map((res: any) => res.json());
    }

    searchConversation(params: ISearchConversationRequest): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chat/getsearchresultforconversation'
        return this.http.post(url, params).map((res: any) => res.json());
    }

    getUserGroups(userId: string): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chat/getusergroups'
        let requestObj = {
            "user_id": userId
        }
        return this.http.post(url, requestObj).map((res: any) => res.json())
    }

    getGroupDetails(params: IGetGroupDetailsRequest): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chat/getgroupmemberdetails'
        let requestObj = {
            user_id: params.user_id,
            shared_channel: params.shared_channel
        }
        return this.http.post(url, requestObj).map((res: any) => res.json())
    }

    checkForSharedChannel(params: { user_id: string, receiver_id: string }): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chat/checkforsharedchannel';
        return this.http.post(url, params).map((res: any) => res.json())
    }

    removeMemberFromGroup(params: IGroupRemoveRequest): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chat/removesinglememberfromgroup';
        return this.http.post(url, params).map((res: any) => res.json())
    }

    deleteGroupConversation(shared_channel: string, user_id: string) {
        let params = {
            shared_channel: shared_channel,
            user_id: user_id
        };
        let url = ENVIRONMENT.APP_BASE_URL + '/api/chat/deleteuserorgroup';
        return this.http.post(url, params).map((res: any) => res.json())
    }

    updateVerificationRequest(params: { user_id: string, action: string }): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/servicelocations/updateverificationrequest';
        return this.http.post(url, params).map((res: any) => res.json())
    }

    getMessageContent(messageOb: Map<string, string>, expectedLangPrefix?: string): string {
        let langPrefix = CONSTANTS.DEFAULT_LANGUAGE;
        expectedLangPrefix = expectedLangPrefix || this.userService.getCurrentLang();
        if (typeof messageOb === 'string') {
            return messageOb;
        }
        if (messageOb.hasOwnProperty(expectedLangPrefix)) {
            langPrefix = expectedLangPrefix;
        }
        return messageOb[langPrefix];
    }

    getNotificationLang(inputLanguages) {
        let languages = inputLanguages || [];
        let curLang = this.userService.getCurrentLang();
        let returnLang = CONSTANTS.DEFAULT_LANGUAGE;

        switch (languages.length) {
            case 2:
                languages = languages.filter((lang) => {
                    return (lang !== curLang) ? true : false;
                });
                returnLang = languages[0] || CONSTANTS.DEFAULT_LANGUAGE;
                break;
            case 1:
                returnLang = languages[0];
                break;
        }
        return returnLang;
    }

}

export interface IMessage {
    content: Map<string, string>;
    shared_channel: string;
    shared_channel_id?: string;
    sender_uuid: string;
    receiver_uuid: string;
    timetoken: number;
    image?: string;
    video?: string;
    tags_array?: Array<string>;
    is_group?: boolean;
    content_type_id?: number;
    is_sys_msg?: boolean;
}

export interface IGetUserConversationRequest {
    user_id: string;
    is_group_data_needed: boolean;
}
export interface ISearchConversationRequest {
    user_id: string;
    search_by: string;
}

export interface IGetUserConversationResponse {
    connected: Array<IConversation>;
    invitation_sent: Array<IConversation>;
    invitation_received: Array<IConversation>;
    not_connected: Array<IConversation>;
    otherUsersList?: Array<IConversation>;
}

export interface IGetGroupDetailsRequest {
    user_id: string;
    shared_channel: string;
}

export interface IGroup {
    user_id: string;
    user_name?: string;
    name?: string;
    shared_channel?: string;
    receiver_id?: string;
    profile_pic?: string;
    members?: Array<string>;
    created_by: string;
    type?: string;
    group_type?: string;
    joining_time_token?: number;
    leaving_time_token?: number;
    resident_profile_pic?: string;
    is_advocate?: boolean;
    verification_address?: string;
    location_id?: string; 
}

export interface IGroupMember {
    user_id: string;
    user_name: string;
    profile_pic: string;
    presence?: string;
}

export interface IConversation {
    _id?: string;
    user_id?: string;
    user_name?: string;
    user_email?: string;
    first_name?: string;
    last_name?: string;
    profile_pic?: string;
    user_type?: string;
    name?: string;
    badgeCount?: number;
    shared_channel?: string;
    isTyping?: boolean;
    status?: string;
    receiver_id?: string;
    presence?: string;
    type?: string;
    latestMessageTimestamp?: string;
    latestMessage?: string;
    joining_time_token?: number;
    leaving_time_token?: number;
    notification?: boolean;
    connection_status?: number;
    timetoken?: number;
    selected?: boolean;
    group_type?: string;
    members?: Array<IGroupMember>;
    created_by?: string;
    verification_status?: string;
    is_advocate?: boolean;
    verification_address?: string;
    languages?: Array<string>;
}



export interface IArchive {
    user_id?: string;
    content: string;
    sender_uuid: string;
    receiver_uuid?: string;
    shared_channel: string;
    date: Date;
    tags?: Array<string>;
    image: string;
    video: string;
}

export interface IManageGroup {
    addedMembers?: Array<string>;
    removedMembers?: Array<string>;
}

export interface IUpdateProviderConnectionRequestParams {
    shared_channel: string;
    user_id: string;
    connection_status: number;
    receiver_id?: string;
    is_advocate: boolean;

}

export interface IUpdateConnectionStatusRequestParams extends IUpdateProviderConnectionRequestParams {
    receiver_id: string;
    receiver_username: string;
}

export interface IUpdateConversationStatusRequestParams {
    shared_channel: string;
    user_id: string;
    status: string;
}

export interface IGroupRemoveRequest {
    shared_channel: string;
    user_id: string;
    member_id: string;
    leaving_time_token: number;
    name: string;
}
