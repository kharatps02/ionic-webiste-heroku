import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { GoogleMaps, Geocoder } from '@ionic-native/google-maps';
import { MapOverlays } from './map-overlays/map-overlays';
import { PinnedLocation } from './pinned-location/pinned-location';
import { SetPinnedLocation } from './set-pinned-location/set-pinned-location';
import { CoreModule } from '../../shared/core.module'
import { AroundmePage } from './aroundme';
import { ProviderDetails } from './provider-details/provider-details';
import { ProviderOptions } from './provider-options/provider-options';
import { HousingTypes } from './housing-types/housing-types';
import { HousingUnit } from './housing-unit/housing-unit';
import { AroundMeService } from './aroundme-service';
import { PendingConfirmation } from './pending-confirmation/pending-confirmation';
import { EditLocation } from "./edit-location/edit-location";
import { VerifyAddress } from "./verify-address/verify-address";
import { DiscontinuedProperty } from "./discontinued-property/discontinued-property";
import { ProviderService } from "./provider-service";
//import { VerifyAddressDirective } from "../../directives/verify-address.directive";
import { ImageCacheModule } from "../../shared/image-cache.module";


@NgModule({
    imports: [CoreModule, ImageCacheModule],
    exports: [],
    entryComponents: [AroundmePage, MapOverlays, PinnedLocation, SetPinnedLocation, ProviderDetails, HousingTypes, HousingUnit, ProviderOptions, PendingConfirmation,EditLocation, VerifyAddress,DiscontinuedProperty],
    declarations: [AroundmePage, MapOverlays, PinnedLocation, SetPinnedLocation, ProviderDetails, HousingTypes, HousingUnit, ProviderOptions, PendingConfirmation,EditLocation, VerifyAddress,DiscontinuedProperty],
    providers: [GoogleMaps, AroundMeService,ProviderService,Geocoder],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AroundMeModule { }