import { Injectable } from '@angular/core';
import { HttpService } from '../../providers/http-service';
import { IConversation } from '../conversations/chat-service';
import { ENVIRONMENT } from '../../shared/environment';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch'

@Injectable()
export class ServiceRequestService {
    // This is fixed for all domains so have to update this when we add/remove types
    public serviceRequestTypeClassMap = {
        "5859382a4cce7614b8b0bd66_39": "icons-appliances",
        "5859382a4cce7614b8b0bd66_42": "icons-commonarea",
        "5859382a4cce7614b8b0bd66_38": "icons-plug",
        "5859382a4cce7614b8b0bd66_43": "icons-general",
        "5859382a4cce7614b8b0bd66_40": "icons-thermometer",
        "5859382a4cce7614b8b0bd66_44": "icons-general",
        "5859382a4cce7614b8b0bd66_41": "icons-plumbing"
    };
    constructor(public http: HttpService) {
       //console.log('Hello ServiceRequestService Provider');
    }

    getServiceRequestTypes() {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/getservicerequesttypes';
        return this.http.post(url, {}).map((res: any) => res.json());
    }

    reportServiceRequest(params: IServiceRequest) {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/incidents';
        return this.http.post(url, params).map((res: any) => res.json());
    }
    getServiceRequestList(params: IGetServiceRequestListRequest) {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/incidents/getuserservicerequests';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    getServiceRequestDetails(params: { _id: string }) {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/incidents/getservicerequestdetails';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    checkForResidences(params: { user_id: string }) {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/servicelocations/checkforresidences';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    getIncidentDateString() {
        let date = new Date(), dateStr = '';
        dateStr = date.getFullYear() % 100 + '' + numberInTwoDigit(date.getMonth() + 1) + '' + numberInTwoDigit(date.getDate());

        function numberInTwoDigit(input) {
            let outputstr = (input < 10) ? 0 + '' + input : input;
            return outputstr;
        }
        return dateStr;
    }

    createConversation(params: ICreateConversation) {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/incidentconversations';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    saveMessage(params: ISaveMessage) {
        let url = ENVIRONMENT.APP_BASE_URL + '/api/incidentmessages';
        return this.http.post(url, params).map((res: any) => res.json());
    }

}

export interface IServiceRequest {
    user_id: string;
    user_name: string;
    property_id: string;
    type: string;
    address: string;
    description: string;
    incident_date_string: string;
    photos: Array<string>;
    building_id: string;
    unit?: string;
}

export interface IServiceRequestDetails {
    _id: string;
    incident_number: string;
    user_name: string;
    status: string;
    status_translated?: string;
    property_id: string;
    photos: Array<string>;
    address: string;
    description: string;
    type: string;
    type_id: string;
    providers?: Array<any>;
    created_at?: string;
    conversation?: IConversation;
}

export interface IGetServiceRequestListRequest {
    user_id: string;
    per_page: number;
    page_number: number;
}

export interface IResidentProperty {
    public_name: string;
    property_id: string;
    building_id: string;
    unit: string;
    is_advocate: boolean;
    allow_service_requests: boolean;
}

export interface ICreateConversation {
    user_id: string;
    shared_channel: string;
    name: string;
    joining_time_token: string;
    leaving_time_token?: string;
    incident_id: string;
    members: Array<string>;
}

export interface ISaveMessage {
    user_id: string;
    shared_channel: string;
    content: string;
}