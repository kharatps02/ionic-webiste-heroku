import { Component, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { NavController, Platform, Events, Content } from 'ionic-angular';
import { GoogleMaps, GoogleMap, MyLocation, LatLngBounds, GoogleMapsAnimation, GeocoderRequest, GoogleMapsEvent, LatLng, MarkerOptions, Marker, Geocoder, GeocoderResult, GoogleMapOptions } from '@ionic-native/google-maps';
import { Keyboard } from '@ionic-native/keyboard';
import { Network } from '@ionic-native/network';

import { PinnedLocation } from './pinned-location/pinned-location';
import { MapOverlays } from './map-overlays/map-overlays';
import { SetPinnedLocation } from './set-pinned-location/set-pinned-location';
import { ProviderDetails } from './provider-details/provider-details';

import { AnalyticsService } from '../../providers/analytics-service';
import { UserService } from '../../providers/user-service';
import { AroundMeService, IPinLocation, IGetMapOverlaysOptions, IGoogleNearByPlacesRequest } from './aroundme-service';
import { LoaderService } from '../../providers/loader-service';
import { CONSTANTS } from '../../shared/config';
import { ProviderService, IBaseProperty, ISelectedProperty, IGetNearByPropertiesRequest, IBaseProvider } from "./provider-service";
import { TranslateService } from "@ngx-translate/core";
import { Subscription } from 'rxjs';


@Component({
  selector: 'page-aroundme',
  templateUrl: 'aroundme.html'
})

export class AroundmePage implements OnDestroy {
  private MAP_ZOOM_LEVEL: number = 15;
  private MAP_ZOOM_START_LEVEL: number = 3;
  private currentPosition: LatLng;
  private currentAddress: string;

  public map: GoogleMap;
  public mapElement: HTMLElement;
  public mapInitialised: boolean = false;
  public togglePinnedClass: boolean;
  public autocompletePlaces: any;
  public searchLocation: { query: string };
  public pinedLocation: IPinLocation;
  public togglePineedLocation: boolean = false;
  public isMapVisible: boolean = true;
  public tabMapClass: boolean = false;
  public selectedTab: string = 'mapView';
  public serviceProviders: Array<IBaseProvider> = [];
  public housingProviders: Array<IBaseProvider> = [];
  public selectedProperty: ISelectedProperty;
  public autoCompleteObserver: Subscription;
  public isPlaceSelected: boolean = false;
  @ViewChild(Content) content: Content;
  constructor(public navCtrl: NavController, private events: Events, public platform: Platform, private zone: NgZone,
    private aroundMeService: AroundMeService, private providerService: ProviderService, private translateService: TranslateService,
    private userService: UserService, private analyticsService: AnalyticsService,
    private loaderService: LoaderService, private keyboard: Keyboard, private geocoder: Geocoder,
    private googleMaps: GoogleMaps, private network: Network) {
    // Set default searchLocation empty
    this.searchLocation = { query: '' };
    // Set default pinedLocation empty  
    this.pinedLocation = { name: '', address: '' };
    this.togglePinnedClass = false;
    this.keyboard.close();
    this.initSelectPinnedLocationEvent();
    this.initCoachMarkClickEvent();
    this.setMapOverlaySettings();
    if (platform.is('cordova')) {
      //console.log("Get Provider by my current Location ");
    } else {
      //India 
      //-81.57008739999999, 
      //41.4003046
      //    -81.57008739999999, 
      //41.4003046
      //latitude: 39.2120554
      //longitude: -76.865926
      //41.476886,-81.6467857
      this.getProviders({ lat: 41.476886, lng: -81.6467857 }, [], true, (providers) => {
        // this.getProviders({ lat: 73.9026152, lng: 18.5479964 }, ["5859382a4cce7614b8b0bd66_23"], true, (providers) => {
      });
    }
  }

  ngAfterViewInit() {
    this.initMapView()

  }
  ionViewDidLoad() {
    this.initLanguageUpdateEvent();
  }

  ionViewDidEnter() {
    // Set isMapVisible to false when coack mark screen is over on map 
    if (this.userService.userObj.show_coach_marks.around_me) {
      this.isMapVisible = false;
      this.map.setClickable(false);
    }
    // this.initOverlaysOptions();
    this.userService.setCurrentPage(CONSTANTS.PAGES.AROUND_YOU);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.AROUND_YOU);
    this.initListView();

  }

  ionViewWillUnload() {
    console.log("Around ME- Looks like I'm about to ionViewWillUnload :(");
    this.events.unsubscribe(CONSTANTS.APP_EVENTS.ARROUND_YOU_ACTIONS);
    this.events.unsubscribe(CONSTANTS.APP_EVENTS.LANGUAGE_UPDATE);

  }

  ngOnDestroy() {
    this.map.remove();
    //this.ionViewWillUnload();
  }

  initSelectPinnedLocationEvent() {
    this.events.subscribe(CONSTANTS.APP_EVENTS.ARROUND_YOU_ACTIONS, (action, data) => {
      //this.loadMapByPinedLocation(location);
      this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
      if (CONSTANTS.ARROUND_YOU_ACTIONS.SELECT_SAVED_PIN === action) {
        this.currentAddress = this.searchLocation.query = data.address;
        this.currentPosition = data.position;
      }
      this.addMarkerOnMap({ position: this.currentPosition, title: this.currentAddress }, this.addMarkerDone);
    });
  }

  initCoachMarkClickEvent() {
    this.events.subscribe(CONSTANTS.APP_EVENTS.AROUND_YOU_COACH_MARK_GOT_IT_CLICK, () => {
      if (!this.userService.userObj.show_coach_marks.around_me) {
        this.map.setClickable(true);
        this.isMapVisible = true;
        this.getMyLocation();
      }
    });
  }

  initListView() {
    this.content.resize();
    this.setSelectedProperty(null);
  }

  initMapView() {
    this.content.resize();
    if (!this.mapInitialised && this.platform.is('cordova')) {
      this.initMap();
    }
    this.setSelectedProperty(null);
  }

  initMap(): void {
    let that = this;
    that.mapElement = document.getElementById('map');

    let startLocation: LatLng = new LatLng(37.09024, -95.712891);
    let layoutOption: GoogleMapOptions = {
      controls: {
        compass: false, myLocationButton: false, indoorPicker: true, zoom: false, mapToolbar: false
      },
      gestures: {
        scroll: true, tilt: true, rotate: true, zoom: true
      },
      camera: {
        target: startLocation, tilt: 40, zoom: that.MAP_ZOOM_START_LEVEL, bearing: 0, duration: 2000
      }
    };
    that.map = that.googleMaps.create(that.mapElement, layoutOption);
    that.map.on(GoogleMapsEvent.MAP_READY).subscribe((map) => {
      this.mapInitialised = true;
      this.getMyLocation();
    });

    that.map.on(GoogleMapsEvent.MAP_CLICK).subscribe((map) => {
      this.setSelectedProperty(null);
      this.keyboard.close();
    });

    that.map.on(GoogleMapsEvent.MAP_LONG_CLICK).subscribe((location) => {
      //console.log("Map is long clicked.\n" + JSON.stringify(location));
      that.currentPosition = location[0];
      let params: GeocoderRequest = {
        position: { lat: location[0].lat, lng: location[0].lng }
      };
      that.updateLocationDetailsByPosition(params);
    });
  }

  addNetworkEvents() {
    this.network.onConnect().subscribe(() => {
      if (!this.mapInitialised) {
        this.initMap();
      }
      this.enableMap();
    });

    this.network.onDisconnect().subscribe(() => {
      this.disableMap();
    });
  }

  getMyLocation(): void {
    let that = this;
    that.enableMap();

    // Don't show map when coach marker active
    if (!this.userService.userObj.show_coach_marks.around_me) {
      that.map.getMyLocation().then((location: MyLocation) => {
        // set map position as per currentPosition
        that.currentPosition = location.latLng;
        let geocode: GeocoderRequest = {
          position: {
            lat: location.latLng.lat,
            lng: location.latLng.lng
          }
        };
        that.updateLocationDetailsByPosition(geocode);
      }).catch((error) => {
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.LOCATION_NOT_FOUND'));
      });
    }
  }

  updateLocationDetailsByPosition(geocode: GeocoderRequest) {
    let that = this;
    that.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    that.geocoder.geocode(geocode).then((response: GeocoderResult[]) => {
      if (response && response.length > 0) {
        let result: GeocoderResult = response[0];
        let address = result.extra.lines.toString();
        let position = new LatLng(result.position.lat, result.position.lng);
        that.currentPosition = position;
        that.currentAddress = address;
        that.searchLocation.query = address;
        that.pinedLocation.zipcode = result.postalCode;
        that.pinedLocation.city = result.locality;
        that.pinedLocation.state = result.adminArea
        that.addMarkerOnMap({ position: position, title: address }, that.addMarkerDone);
      }
    }, error => {
      that.addMarkerOnMap({ position: that.currentPosition, title: that.currentAddress }, that.addMarkerDone);
      that.loaderService.showToaster(error);
    });
  }

  addMarkerOnMap(markerOptions: MarkerOptions, addMarkerDoneCallback): void {
    let that = this, latLng;
    that.setSelectedProperty(null);
    if (markerOptions.position) {
      latLng = new LatLng(markerOptions.position.lat, markerOptions.position.lng);
      markerOptions.position = latLng;
      console.log("Before Map Clear");
      that.map.clear().then(() => {
        console.log("After Map Clear");
        that.map.animateCamera({ target: latLng, zoom: that.MAP_ZOOM_LEVEL, tilt: 40, bearing: 0, duration: 1500 });
        if (markerOptions.title) {
          markerOptions.title = markerOptions.title.split(',').join("\n");
        }
        // set default marker icon image
        markerOptions.icon = { url: CONSTANTS.GOOGLE_MAP_DEFAULT_MARKER.ICON };
        markerOptions.animation = GoogleMapsAnimation.DROP;
        //// console.log('In addMarkerOnMap position,markerOptions', markerOptions.position, markerOptions);
        that.map.addMarker(markerOptions)
          .then((marker: Marker) => {
            marker.addEventListener(GoogleMapsEvent.MARKER_CLICK).subscribe(marker => {
              that.setSelectedProperty(null);
              marker[1].showInfoWindow();
            });
            marker.addEventListener(GoogleMapsEvent.INFO_CLICK).subscribe(marker => {
              marker[1].hideInfoWindow();
            });
            if (addMarkerDoneCallback) {
              addMarkerDoneCallback.call(that, latLng);
            }
          }).catch((error) => {
            console.log(error);
            that.loaderService.dismissLoader();
          });
      });

    }
  }

  addMarkerDone(latLng): void {
    let serviceInterest = [], goolgePlacesOverlaysOptions;
    let overlaysOptions: IGetMapOverlaysOptions = JSON.parse(JSON.stringify(this.aroundMeService.mapOverlays));
    if (overlaysOptions.service_interest) {
      overlaysOptions.service_interest.filter(option => {
        if (option.flag === true) {
          serviceInterest.push(option._id);
        }
      });
    }

    if (overlaysOptions.google_places) {
      goolgePlacesOverlaysOptions = overlaysOptions.google_places.filter(option => {
        return option.flag === true;
      });
    }

    this.getProviders(latLng, serviceInterest, overlaysOptions.provider_overlay[0].flag, (providers: Array<IBaseProvider>) => {
      let places = updatePlacerIcon(providers);
      if (goolgePlacesOverlaysOptions && goolgePlacesOverlaysOptions.length > 0) {
        this.getGooglePlaceNearBySearch(latLng, goolgePlacesOverlaysOptions, (googlePlaces) => {
          places = places.concat(googlePlaces);
          showPropertiesOnMap.call(this, places);
        });
      } else if (places && places.length > 0) {
        showPropertiesOnMap.call(this, places);
      } else {
        this.loaderService.dismissLoader();
      }
    });

    function updatePlacerIcon(places: Array<IBaseProvider>) {
      let icons = {
        'Multi Units Property': './assets/img/pin-building.png',
        'Single Home Property': './assets/img/pin-housing.png',
        Education: './assets/img/pin-education.png',
        "Employment Assistance": './assets/img/pin-employement-assistance.png',
        "Financial Counseling": './assets/img/pin-financial-counselling.png',
        "Child Care": './assets/img/pin-child-care.png',
        Health: './assets/img/pin-healthcare-sp.png',
        Training: './assets/img/pin-training.png',
        Transportation: './assets/img/pin-transportation.png',
        "Legal Services": './assets/img/pin-legal-services.png',
        Housing: './assets/img/pin-housing-sp.png',
        service_provider: './assets/img/service_provider.png',
        housing_provider: './assets/img/housing_provider.png'
      };

      places.map((place) => {
        if (place.location_type) {
          let icon = null;
          if (place.location_type === CONSTANTS.USER_TYPE.HOUSING_PROVIDER) {
            icon = icons[place.icon_type] || icons[CONSTANTS.USER_TYPE.HOUSING_PROVIDER]
          } else if (place.location_type === CONSTANTS.USER_TYPE.SERVICE_PROVIDER) {
            icon = icons[place.icon_type] || icons[CONSTANTS.USER_TYPE.SERVICE_PROVIDER]
          }
          place['icon'] = icon;
        }
        return place;
      });
      return places;
    }

    function showPropertiesOnMap(places) {
      if (places && places.length > 0) {
        this.showPropertiesOnMap(latLng, places, () => {
          this.loaderService.dismissLoader();
        });
      }
    }
  }

  showPropertiesOnMap(position: LatLng, places: Array<any>, showPropertiesOnMapCallback): void {
    let that = this, markers = [], bounds = new LatLngBounds([position]);

    function addMarker(place) {
      let latLng = new LatLng(place.location.latitude, place.location.longitude);
      let markerOptions: MarkerOptions = { position: latLng };
      if (place.name) {
        markerOptions['title'] = place.name;
      }
      if (place.icon) {
        markerOptions['icon'] = { url: place.icon, size: { width: 24, height: 29 } };
      }

      bounds.extend(latLng);
      that.map.addMarker(markerOptions).then((marker: Marker) => {
        markers.push(marker);
        marker.addEventListener(GoogleMapsEvent.MARKER_CLICK).subscribe(marker => {
          if (place.location_type) {
            that.setSelectedProperty(place);
          } else {
            that.setSelectedProperty(null);
            marker[1].showInfoWindow();
          }
        });
        marker.addEventListener(GoogleMapsEvent.INFO_CLICK).subscribe(marker => {
          marker[1].hideInfoWindow();
        });

        if (markers.length === places.length) {
          addedAllMarkers();
        }
      }).catch(e => {
        markers.push(null);
        if (markers.length === places.length) {
          addedAllMarkers();
        }
      });
    }

    function addedAllMarkers() {
      if (places && places.length > 1) {
        //Adjust zoom level only if we have results 
        // that.map.animateCamera({
        //   'target': bounds
        // });
      }
      if (showPropertiesOnMapCallback) {
        showPropertiesOnMapCallback();
      }
    }

    // Iterate the places and add marker on map 
    if (places && places.length > 0) {
      places.forEach((place) => {
        addMarker(place);
      });
    } else {
      if (showPropertiesOnMapCallback) {
        showPropertiesOnMapCallback();
      }
    }
  }

  getProviders(latLng, serviceInterest: Array<string>, isHousingPropertyNeeded: boolean, callback) {
    let params: IGetNearByPropertiesRequest;
    params = { user_id: this.userService.userObj.user_id, latitude: latLng.lat, longitude: latLng.lng, is_housing_property_needed: isHousingPropertyNeeded };
    if (serviceInterest && serviceInterest.length > 0) {
      params['service_interests'] = serviceInterest;
    }
    this.serviceProviders = [];
    this.housingProviders = [];
    this.providerService.getNearByProperties(params).subscribe((response) => {
      if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS && response.service_providers) {
        this.serviceProviders = response.service_providers || [];
        this.housingProviders = response.housing_providers || [];
        let providers: Array<IBaseProvider> = response.service_providers || [];
        providers = providers.concat(response.housing_providers || []);
        //this.loaderService.dismissLoader();
        if (callback) {
          callback(providers)
        }
      } else {
        //this.loaderService.dismissLoader();
        if (callback) {
          callback([])
        }
      }
    }, error => {
      this.loaderService.dismissLoader();
      this.loaderService.showToaster(error);
    });
  }

  setSelectedProperty(property) {
    let that = this;
    if (property) {
      that.zone.run(function () {
        that.selectedProperty = Object.assign(property, { selected: true });
      });
    } else {
      if (that.selectedProperty) {
        that.selectedProperty = null;
      }
    }
  }

  getGooglePlaceNearBySearch(currentPosition: LatLng, goolgePlacesOverlaysOptions, callback): void {
    let that = this;
    let types: Array<string> = [];

    goolgePlacesOverlaysOptions.forEach((option, index) => {
      types.push(option.type);
    });

    let params: IGoogleNearByPlacesRequest = {
      lat: currentPosition.lat,
      long: currentPosition.lng,
      radius: CONSTANTS.PLACE_NEAR_BY_SEARCH_MAP_RADIUS,
      types: types
    };
    let placesList = [];
    that.aroundMeService.getNearByPlaces(params).subscribe((response) => {

      let icons = {
        school: './assets/img/pin-schools.png',
        bank: './assets/img/pin-banks.png',
        convenience_store: './assets/img/pin-grocery-stores.png',
        hospital: './assets/img/pin-healthcare.png',
        restaurant: './assets/img/pin-restaurants.png',
        shopping_mall: './assets/img/pin-shopping.png'
      };
      placesList = response.places;
      placesList.forEach((place) => {
        let iconUrl = place.icon;
        place.types.forEach((types, index) => {
          if (types in icons) {
            iconUrl = icons[types];
          }
        });
        place['icon'] = iconUrl;
        place['location'] = { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng };
      });
      if (callback) {
        callback(placesList);
      }
    }, error => {
      that.loaderService.showToaster(error);
      if (callback) {
        callback(placesList);
      }
    });
  }

  autocompletePlacesSearch() {
    // console.log("Onupdate called ",this.searchLocation.query )
    let that = this, searchObj = null, autocompletePlacesTemp: Array<any> = [];
    if (that.searchLocation.query == '') {
      // Clear results when no input is provided 
      that.autocompletePlaces = [];
      return;
    } else if (that.searchLocation.query.length < 3) {
      //To show results till the user clears the input
      return;
    }
    if (!that.isPlaceSelected) {
      searchObj = { input: that.searchLocation.query };
      //, types: ['address'] , componentRestrictions: { country: 'US' }
      that.autoCompleteObserver = that.aroundMeService.getPlacePredictions(searchObj).subscribe((response: any) => {
        console.log("Got Response");
        autocompletePlacesTemp = [];
        let places = response.places.predictions;
        if (places) {
          places.forEach(function (place) {
            autocompletePlacesTemp.push(place);
          });
          // apply result on autocompletePlaces object 
          that.zone.run(function () {
            that.autocompletePlaces = autocompletePlacesTemp;
          });
        } else {
          that.autocompletePlaces = [];
        }
      }, error => {
        this.loaderService.showToaster(error);
      });
    }
  }

  onPlaceSelect(placeDetail): void {
    this.isPlaceSelected = true;
    this.autoCompleteObserver.unsubscribe();
    this.enableMap();
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));

    // console.log('In chooseItem', placeDetail);
    this.aroundMeService.placeDetailById({ place_id: placeDetail.place_id }).subscribe((place: any) => {
      if (place.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        this.currentPosition = new LatLng(place.location.lat, place.location.long);
        this.currentAddress = place.location.address;
        this.searchLocation.query = place.location.address;
        this.pinedLocation.zipcode = place.location.zipcode;
        this.pinedLocation.city = place.location.city;
        this.pinedLocation.state = place.location.state;
        this.pinedLocation.place_id = placeDetail.place_id
        // add marker on map 
        this.isPlaceSelected = false;
        this.addMarkerOnMap({ position: this.currentPosition, title: placeDetail.description }, this.addMarkerDone);
      } else {
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.ADDRESS_NOT_FOUND'));
      }
    }, error => {
      this.loaderService.showToaster(error);
      this.loaderService.dismissLoader();
    });
  }


  setPinedLocationModel(placeDetail): void {
    this.pinedLocation.zipcode = '';
    this.pinedLocation.city = '';
    this.pinedLocation.state = '';
    for (let i = 0; i < placeDetail.address_components.length; i++) {
      for (let j = 0; j < placeDetail.address_components[i].types.length; j++) {
        if (placeDetail.address_components[i].types[j] == CONSTANTS.GOOGLE_MAP_PLACE_DETAIL.POSTAL_CODE) {
          this.pinedLocation.zipcode = placeDetail.address_components[i].long_name;
        } else if (placeDetail.address_components[i].types[j] == CONSTANTS.GOOGLE_MAP_PLACE_DETAIL.CITY) {
          this.pinedLocation.city = placeDetail.address_components[i].long_name;
        } else if (placeDetail.address_components[i].types[j] == CONSTANTS.GOOGLE_MAP_PLACE_DETAIL.STATE) {
          this.pinedLocation.state = placeDetail.address_components[i].long_name;
        }
      }
    }
  }

  goToMapOverlaysPage(): void {
    this.navCtrl.push(MapOverlays);
  }

  loadMapByPinedLocation(pinLocation): void {
    // // console.log('In loadMapByPinedLocation', pinLocation);
    this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
    this.addMarkerOnMap({ position: pinLocation.position, title: pinLocation.address }, this.addMarkerDone);
    this.currentPosition = pinLocation.position;
    this.currentAddress = this.searchLocation.query = pinLocation.address;
  }

  openPinnedLocation(): void {
    this.navCtrl.push(PinnedLocation);
  }

  setPinnedLocation(): void {
    this.pinedLocation.position = this.currentPosition;
    this.pinedLocation.address = this.currentAddress || this.searchLocation.query;
    this.pinedLocation.name = '';
    this.navCtrl.push(SetPinnedLocation, { 'selectedlocation': this.pinedLocation });
  }

  hideKeyboard() {
    // console.log("hideKeyboard");
    this.keyboard.close();
  }

  disableMap() {
    this.setSelectedProperty(null);
    this.tabMapClass = true;
    this.togglePinnedClass = true;
    if (this.isMapVisible) {
      this.map.setClickable(false);
      this.isMapVisible = false;
    }
  }

  enableMap() {
    this.autocompletePlaces = [];
    this.keyboard.close();
    setTimeout(() => {
      if (!this.isMapVisible) {
        // setClickable to false when coach marker is on top of map 
        if (this.userService.userObj.show_coach_marks.around_me) {
          this.map.setClickable(false);
        } else {
          this.map.setClickable(true);
        }
        this.isMapVisible = true;
      }
      this.togglePinnedClass = false;
      this.tabMapClass = false;
    }, 500);
  }

  openDetailsView(property: IBaseProperty): void {
    this.navCtrl.push(ProviderDetails, { providerId: property._id, buildingId: property.building_id || '', buildingAddress: property.street_address1 });
  }

  setMapOverlaySettings() {
    this.aroundMeService.getUserAroundmeSettings({ user_id: this.userService.userObj.user_id }).subscribe((response) => {
      if (response.google_places || response.service_interest) {
        this.aroundMeService.mapOverlays.google_places = response.google_places;
        this.aroundMeService.mapOverlays.service_interest = response.service_interest;
        this.aroundMeService.mapOverlays.provider_overlay = response.provider_overlay;
      }
    });
  }

  initLanguageUpdateEvent() {
    this.events.subscribe(CONSTANTS.APP_EVENTS.LANGUAGE_UPDATE, () => {
      //this.loadMapByPinedLocation(location); 
      this.setMapOverlaySettings();
    });
  }
}




