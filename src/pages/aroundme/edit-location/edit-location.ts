import { Component, NgZone } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { AroundMeService, IPinLocation } from '../aroundme-service';
import { UserService } from '../../../providers/user-service';
import { LoaderService } from '../../../providers/loader-service';
import { CONSTANTS } from '../../../shared/config';
import { LatLng, GoogleMap, GoogleMaps, GoogleMapsEvent } from "@ionic-native/google-maps";
import { AnalyticsService } from "../../../providers/analytics-service";

@Component({
  selector: 'page-edit-location',
  templateUrl: 'edit-location.html'
})

export class EditLocation {
  public pinnedLocation: IPinLocation;
  public autocompletePlaces: any;
  public searchLocation: string;
  //private MAP_ZOOM_LEVEL: number = 15;
  private MAP_ZOOM_START_LEVEL: number = 3;
  private currentPosition: LatLng;
  public map: GoogleMap;

  constructor(private userService: UserService, private aroundMeService: AroundMeService, private navParams: NavParams,
    private googleMaps: GoogleMaps, private zone: NgZone, private analyticsService: AnalyticsService,
    public navCtrl: NavController, private loaderService: LoaderService) {
    this.pinnedLocation = this.navParams.get('pinnedLocation');
  }

  ngAfterViewInit() {
    this.initMapView()
  }
  ionViewDidLoad() {
    // console.log('Hello PinnedLocation Page');
  }


  initMapView() {

    let that = this;
    let layoutOption = {
      'controls': {
        'compass': false, 'myLocationButton': false, 'indoorPicker': true, 'zoom': false, 'toolbar': false
      },
      'gestures': {
        'scroll': true, 'tilt': true, 'rotate': true, 'zoom': true
      },
      'camera': {
        'latLng': this.pinnedLocation.position, 'tilt': 40, 'zoom': that.MAP_ZOOM_START_LEVEL, 'bearing': 0, 'duration': 2000
      }
    };
    //console.log(this.pinnedLocation.position);
    that.map = that.googleMaps.create('map-location', layoutOption);
    that.map.on(GoogleMapsEvent.MAP_READY).subscribe((map) => {
      //console.log('GoogleMapsEvent.MAP_READY', map);
    });
    that.map.on(GoogleMapsEvent.MAP_CLICK).subscribe((map) => {
      //this.keyboard.close();
    });

    that.map.on(GoogleMapsEvent.MAP_LONG_CLICK).subscribe((location) => {
      // console.log("Map is long clicked.\n" + JSON.stringify(location));
      that.currentPosition = location;
      // let params: GeocoderRequest = {
      //   position: { lat: location.lat, lng: location.lng }
      // };
      //that.updateLocationDetailsByPosition(params);
    });
  }
  ionViewDidEnter() {
    this.userService.setCurrentPage(CONSTANTS.PAGES.EDIT_PINNED_LOCATION);
    this.analyticsService.trackScreenView(CONSTANTS.PAGES.EDIT_PINNED_LOCATION);
    this.searchLocation = this.pinnedLocation.address;
    //this.loaderService.createLoader(this.translateService.instant('ERROR_MESSAGES.PLEASE_WAIT'));
  }

  save(pinedLocation: IPinLocation) {
    pinedLocation.user_id = this.userService.userObj.user_id;
    //navigate to saved location page 
  }

  onPlaceSelect(place) {

  }
  updatePin() {

  }

  autocompletePlacesSearch() {
    // console.log("Onupdate called ",this.searchLocation.query )
    let that = this, searchObj = null, autocompletePlacesTemp: Array<any> = [];
    if (that.searchLocation == '') {
      // Clear results when no input is provided 
      that.autocompletePlaces = [];
      return;
    } else if (that.searchLocation.length < 3) {
      //To show results till the user clears the input
      return;
    }
    searchObj = { input: that.searchLocation };
    //, types: ['address'] , componentRestrictions: { country: 'US' }
    that.aroundMeService.getPlacePredictions(searchObj).subscribe((response: any) => {
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

