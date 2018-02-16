
import { Observable } from "rxjs/Observable";
import { Injectable } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { ENVIRONMENT } from "../../shared/environment";
import { HttpService } from "../../providers/http-service";
import { IConversation, IMessage } from "../conversations/chat-service";
import { PubNubService } from "../../providers/pubnub-service";
import { CONSTANTS } from '../../shared/config';
import { LoaderService } from "../../providers/loader-service";

@Injectable()
export class ProviderService {

    constructor(public http: HttpService, public pubNubService: PubNubService,
        private loaderService: LoaderService, private translateService: TranslateService, ) {
        // console.log('[ In UserService ]');
    }

    connectToPropertyManager(params: IConnectPMRequest): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/servicelocations/connecttopropertymanager';
        return this.http.post(url, params).map((res: any) => res.json());
    }
    getNearByProperties(params: IGetNearByPropertiesRequest): Observable<IGetNearByPropertiesResponse> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/getnearbyproperties';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    getBuildingsByPropertyId(params: { property_id: string }): Observable<IBuildingResponse> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/servicelocations/getbuildingslist';
        return this.http.post(url, params).map((res: any) => res.json());
    }
    getUnitDetailsByBuildingId(params: { buildingId: string }): Observable<IGetNearByPropertiesResponse> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/getnearbyproperties';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    findPropertyById(params: { _id: string, user_id: string, building_id: string }): Observable<IFindPropertyByIdResponse> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/serviceLocations/findbypropertyid';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    toggleFollowStatus(params: IFollowProviderRequest): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/servicelocations/followproviders';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    toggleFavoriteStatus(params: IFavProviderRequest): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/servicelocations/favproviders';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    updatePeopleLiveInProperty(params: IDisconnectPropertyRequest): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/servicelocations/updatepeopleliveinproperty';
        return this.http.post(url, params).map((res: any) => res.json());
    }
    sendInvitationMessageToAdmin(groupObject, messagePrefixStr: string, addressStr: string) {
        this.pubNubService.getSupportedLanguageMsg(messagePrefixStr).subscribe((msgContent) => {

            // Concat original address and translated message for all supported languages (REZ-2392)
            for (const langKey in msgContent) {
                if (msgContent.hasOwnProperty(langKey)) {
                    msgContent[langKey] += addressStr;
                }
            }

            let coreMessageObj: IMessage = {
                content: msgContent,
                sender_uuid: groupObject.user_id,
                image: '',
                receiver_uuid: groupObject.shared_channel,
                shared_channel: groupObject.shared_channel,
                timetoken: groupObject.joining_time_token,
                tags_array: [],
                video: '',
                is_group: true,
                content_type_id: CONSTANTS.MESSAGE_CONTENT_TYPE_ID.SYSTEM_MESSAGE_TO_ADMIN
            };
            this.pubNubService.publish(coreMessageObj.shared_channel, coreMessageObj).subscribe((event) => {
            });
        }, error => {
            this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.SOMETHING_WENT_WRONG'));
        });

    }
}



export interface IBaseProviderRequest {
    user_id: string;
    provider_location_id: string;
}

export interface IFollowProviderRequest extends IBaseProviderRequest {
    is_following: boolean;
    provider_name: string;
}

export interface IFavProviderRequest extends IBaseProviderRequest {
    is_favorite: boolean;
    provider_name: string;
}

export interface IBasePropertyRequest extends IBaseProviderRequest {
    building_id: string;
    building_address: string;
}

export interface IDisconnectPropertyRequest extends IBasePropertyRequest {
    is_disconnect: boolean;
    is_address_verified: boolean;
    is_advocate: boolean;
    unit: string;
}

export interface IConnectPMRequest extends IBasePropertyRequest {
    unit: string;
    first_name: string;
    last_name: string;
    is_advocate: boolean;

}

export interface IGetNearByPropertiesRequest {
    user_id: string;
    longitude: number;
    latitude: number;
    is_housing_property_needed: boolean,
    service_interests?: Array<string>;
}

export interface IBaseResponse {
    status: string;
    message: string;
}

export interface IBuildingResponse extends IBaseResponse {
    buildings: Array<IBuilding>;
}

export interface IBuilding {
    _id: string;
    status: string;
    public_name: string;
    property_code: string;
    street_address1: string;
    units: Array<string>;

}

export interface IBaseProvider {
    _id: string;
    about: string;
    public_name: string;
    profile_pic: string;
    location_type: string;
    street_address1?: string;
    building_id?: string;
    location: {
        longitude: number;
        latitude: number;
        street_address1?: string;
        street_address2?: string;
        city?: string;
        state?: string;
        country?: string;
        zipcode?: string;
    };
    icon_type?: string;
}

export interface IBaseProperty extends IBaseProvider {
    contacts?: {
        phone_number: string;
        phone_number_label: string;
        fax: string
    };
    buildings?: Array<IBuilding>;
    is_favorite: boolean;
    is_following: boolean;
    is_single_house_owner?: boolean;
    units?: Array<string>;
    verification_status?: string;
    conversation?: IConversation;
}

export interface IProviderDetails extends IBaseProperty {
    email?: string;
    website?: string;
    banners: Array<string>,
    hours_of_operation: {
        monday: {
            start_time: string;
            end_time: string;
        },
        tuesday: {
            start_time: string;
            end_time: string;
        },
        wednesday: {
            start_time: string;
            end_time: string;
        },
        thursday: {
            start_time: string;
            end_time: string;
        },
        friday: {
            start_time: string;
            end_time: string;
        },
        saturday: {
            start_time: string;
            end_time: string;
        }
        sunday: {
            start_time: string;
            end_time: string;
        }
    };
    social_media_pages?: {
        twitter: string;
        facebook: string;
    }
    service_interests: Array<string>;
    provider_details?: Array<{
        _id?: string;
        user_name: string;
        profile_pic: string;
        user_id: string;
    }>;
    is_advocate: boolean;
    resident_unit: string;
}


export interface ISelectedProperty extends IBaseProperty {
    selected: boolean;
}



export interface IGetNearByPropertiesResponse extends IBaseResponse {
    service_providers: Array<IBaseProvider>;
    housing_providers: Array<IBaseProvider>;
}

export interface IFindPropertyByIdResponse {
    status: string;
    property: Array<IProviderDetails>;
}



