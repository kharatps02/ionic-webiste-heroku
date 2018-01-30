import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CoreModule } from '../../shared/core.module'
import { MyStuff } from './my-stuff';
import { Settings } from './settings/settings';
import { Profile } from './profile/profile';
import { EditProfile } from './profile/edit-profile/edit-profile';
import { TellFeedback } from './tell-feedback/tell-feedback';
import { Verifications } from './profile/edit-profile/verifications/verifications';
import { Address } from './profile/edit-profile/address/address';
import { ChangePassword } from './settings/change-password/change-password';
import { BlockedUsers } from './settings/blocked-users/blocked-users';
import { ImageCacheModule } from '../../shared/image-cache.module';
//import { LocalizedDatePipe } from "../../directives/localized-date-pipe.directive";

@NgModule({
    imports: [CoreModule,ImageCacheModule],
    exports: [],
    entryComponents: [MyStuff, Settings, Profile, Address, EditProfile, TellFeedback,
        Verifications, ChangePassword, BlockedUsers],
    declarations: [MyStuff, Settings, Profile, Address, EditProfile, TellFeedback,
        Verifications, ChangePassword, BlockedUsers],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MyStuffModule { }