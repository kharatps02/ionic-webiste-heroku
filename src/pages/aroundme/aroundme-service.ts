import { Injectable } from '@angular/core';
import { HttpService } from '../../providers/http-service';
import { ENVIRONMENT } from '../../shared/environment';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class AroundMeService {
    public mapOverlays: IGetMapOverlaysOptions;
    constructor(public http: HttpService) {
        this.mapOverlays = { google_places: null, service_interest: null, provider_overlay: null };
    }

    getUserAroundmeSettings(params: { user_id: string }): Observable<IGetMapOverlaysResponse> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/getuseraroundmesettings';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    updateUserAroundmeSettings(params: IUpdateUserAroundmeSettingsRequest): Observable<IGetMapOverlaysResponse> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/updateuseraroundmesettings';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    placeDetailById(params: { place_id: string }): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/getplacedetails';
        return this.http.post(url, params).map((res: any) => res.json());
    }


    getNearByPlaces(params: IGoogleNearByPlacesRequest): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/getnearbyplaces';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    getPlacePredictions(params): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/googleplacesautocomplete';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    getPinedLocations(params: { user_id: string }): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/getpinlocations';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    addDropPinLocation(params: IPinLocation): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/savepinlocation';
        return this.http.post(url, params).map((res: any) => res.json());
    }

    deletePinLocation(params: IPinLocation): Observable<any> {
        let url: string = ENVIRONMENT.APP_BASE_URL + '/api/deletepinlocations';
        return this.http.post(url, params).map((res: any) => res.json());
    }    

}



export interface OverlayOption {
    _id: string;
    name: string,
    flag?: boolean;
    type?: string;
}
export interface IUpdateUserAroundmeSettingsRequest {
    user_id: string;
    service_interest: Array<string>;
    google_places: Array<string>;
    provider_overlay: Array<string>;
}
export interface IGetMapOverlaysOptions {
    service_interest: Array<OverlayOption>;
    google_places: Array<OverlayOption>;
    provider_overlay: Array<OverlayOption>;
}

export interface IGetMapOverlaysResponse extends IGetMapOverlaysOptions {
    status?: string;
}

export interface IPinLocation {
    place_id?: string;
    user_id?: string;
    name?: string,
    address?: string,
    address_type?: string,
    position?: { lat: number, lng: number },
    url?: string,
    street_address1?: string;
    street_address2?: string;
    city?: string;
    state?: string;
    zipcode?: string
}



export interface IGenericResponse {
    status: string;
    message: string;
}

export interface IGoogleNearByPlacesRequest {
    lat: number;
    long: number;
    radius: number;
    types: string[];
}