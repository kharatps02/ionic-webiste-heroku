import { Injectable } from '@angular/core';
import { ENVIRONMENT } from '../../shared/environment';
import { HttpService } from '../../providers/http-service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { IGenericResponse } from "../aroundme/aroundme-service";
import { IBranch } from '../../providers/user-service';
@Injectable()
export class ActivityService {
    httpService: HttpService;
    constructor(httpClient: HttpService) {
        this.httpService = httpClient;
    }

    getActivityFeeds(params: IGetActivityFeedsParams): Observable<IGetActivityFeedsResponse> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/activityfeeds/findbyuserid';
        return this.httpService.post(url, params).map((res: any) => res.json());
    }

    submitPoll(params: ISubmitPollParams): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/activityfeeds/votepoll';
        return this.httpService.post(url, params).map((res: any) => res.json());
    }

    updateActionTakenCount(params: IUpdateActionTakenCountParams): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/rezpolls/updateactiontakencount';
        return this.httpService.post(url, params).map((res: any) => res.json());
    }

    updateFeedLike(params: ILikeFeedParams) {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/activityfeeds/likefeed';
        return this.httpService.post(url, params).map((res: any) => res.json());
    }

    shareFeed(params: IShareFeedRequest) {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/rezpolls/sharefeed';
        return this.httpService.post(url, params).map((res: any) => res.json());
    }

    getUserSegments(params: IGetUserSegmentRequest) {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/usersegments/findbyuserid';
        return this.httpService.post(url, params).map((res: any) => res.json());
    }

    getImageLibraryData(organization_id: string, imageType: string): Observable<any> {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/servicelocations/getorganizationimages';
        return this.httpService.post(url, { organization_id: organization_id, action_type: imageType }).map((res: any) => res.json());
    }

    createFeed(data: ICreateFeed) {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/activityfeeds';
        return this.httpService.post(url, data).map((res: any) => res.json());
    }

    createPollFeed(data: ICreatePollFeed) {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/rezpolls';
        return this.httpService.post(url, data).map((res: any) => res.json());
    }

}

export interface IPageState {
    pageNumber: number,
    pageSize: number,
    total: number
}

export interface IActivityFeed {
    _id: string;
    user_id: string;
    sender_ref_id: string;
    source: string;
    type: string;
    template: string;
    header: {
        leftIconUrl: string,
        leftIconName: string,
        title: string,
        bgImageUrl: string
    };
    body: {
        headLineText: string;
        imageUrl: string;
        detailText: string;
        question: string;
        optionType: string;
        options: Array<IActivityFeedOption>;
        temp_answer?: Array<string>;
        answer: Array<string>;
    };
    actionButtonName: string;
    openIn: string;
    openInUrl: string;
    status: number
    timestampAgo: string;
    timestamp: Date;
    segmentName: string;
    user_segment: string;
    refferal_id: string;
    is_multiselect: boolean;
    is_action_taken: boolean;
    actions: number;
    total_actions: number
    is_allow_conversation: boolean;
    profile_attributes: string;
    shared_channel: string;
    rezfeed_id: string;
    created_at?: Date;
    updated_at?: Date;
    created_by?: string;
    updated_by: string;
    sender_contact: string;
    is_like?: boolean;
    branch_id?: string;
    building_id?: string;
    total_likes?: number;
    is_system_feed?: boolean;
    lowData?: boolean;
    isReading?: boolean;
}

export interface IActivityFeedOption {
    id?: string;
    text?: string;
    vote?: number;
    name?: string;
    selected?: boolean;
}

export interface IGetActivityFeedsParams {
    user_id: string;
    per_page: number;
    page_number: number;
}

export interface IGetActivityFeedsResponse {
    status: string;
    per_page: number;
    page_number: number;
    total: number;
    activityfeed: Array<IActivityFeed>
}

export interface ISubmitPollParams {
    _id: string;
    user_id: string;
    answer_option: Array<string>;
    template: string;
    profile_attributes: string;
    action_type: string;
    feed_title: string;
}

export interface IUpdateActionTakenCountParams {
    rezfeed_id: string;
    user_id: string;
    action_type: string;
    feed_title: string;
}

export interface ILikeFeedParams extends IUpdateActionTakenCountParams {
    is_like: boolean;
    feed_title: string;
}

export interface ILikeFeedResponse extends IGenericResponse {
    total_likes: number;
}

export interface IShareFeedRequest {
    rezfeed_id: string;
    user_id: string;
    receiver_id: Array<string>;
    feed_title: string;
}

export interface IGetUserSegmentRequest {
    branch_id: string;
    user_id: string;
    user_type: string;
}

export interface IUserSegment {
    _id: string;
    name: string;
    targets?: string;
    segment_category ?: string;
    parent_feed_id?: string;
}

export interface IFeedTemplate {
    _id?: string,
    user_segment: string,
    template?: string,
    header?: {
        leftIconUrl?: string,
        leftIconName?: string,
        title?: string,
        bgImageUrl?: string
    },
    body?: {
        headLineText: string,
        detailText: string,
        imageUrl: string,
        question?: string,
        optionType?: string,
        options?: {
            id: string,
            text: string,
            vote: number
        },
        answer?: Array<string>
    },
    // user_id?: string,
    //poll_id?: string,
    source?: string,
    type?: string,
    // openIn?: string,
    openInUrl?: string,
    //status?: number,
    //timestampAgo?: string,
    timestamp?: string,
    poll?: IPollInfo
    profile_attributes?: string,
    is_allow_conversation?: boolean,
    scheduled_date?: Date
}

export interface ICreateFeed extends IFeedTemplate {
    organization_id?: string,
    branch_id?: IBranch,
    feed_owner_id?: string,
    created_by?: string,
    sender_ref_id?: string,
    is_campaign_feed?: boolean,
    parent_feed_id?: string
}

export interface ICreatePollFeed extends IPollInfo {
    organization_id?: string,
    branch_id?: IBranch,
    feed_owner_id?: string,
    created_by?: string,
    sender_ref_id?: string,
    is_campaign_feed?: boolean,
    parent_feed_id?: string
}

export interface IPlacementInfo {
    title?: string,
    description?: string,
    url?: string,
    allowConversation?: boolean
}

export interface IPollInfo {
    question?: string,
    answer_options?: Array<string>,
    is_multiselect?: boolean
    count_answer_option?: number
    user_segment?: string,
    template?: string
    scheduled_date?: Date

}

export interface IScheduledInfo {
    selectedScheduled?: string,
    scheduledDate?: any,
    scheduledTime?: any
}
