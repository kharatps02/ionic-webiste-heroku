import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CoreModule } from '../../shared/core.module'
import { ActivityPage } from './activity-feed';
import { ActivityService } from './activity-service';
import { ImageCacheModule } from "../../shared/image-cache.module";
import { ContactListPage } from "./contact-list/contact-list";
import { CreateFeedPage } from './create-feed/create-feed';
import { CreatePlacementFeedPage } from './create-placement-feed/create-placement-feed';
import { CropImageModal } from '../../shared/modals/crop-image/crop-image';
import { DescriptionFeedPage } from './create-placement-feed/description-feed/description-feed';
import { SelectImage } from './create-placement-feed/selectImage/select-image';
import { CreatePollFeedPage } from './create-poll-feed/create-poll-feed';
import { PollDescriptionPage } from './create-poll-feed/poll-description/poll-description';
import { SetDeliveryFeedModal } from "../../shared/modals/set-delivery-feed/set-delivery-feed";


@NgModule({
    imports: [CoreModule,ImageCacheModule],
    exports: [],
    entryComponents: [ActivityPage,ContactListPage,CreateFeedPage,CreatePlacementFeedPage, DescriptionFeedPage,CropImageModal,SelectImage, CreatePollFeedPage, PollDescriptionPage, SetDeliveryFeedModal],
    declarations: [ActivityPage,ContactListPage,CreateFeedPage,CreatePlacementFeedPage, DescriptionFeedPage,CropImageModal,SelectImage, CreatePollFeedPage, PollDescriptionPage, SetDeliveryFeedModal],
    providers: [ActivityService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ActivityFeedModule { }