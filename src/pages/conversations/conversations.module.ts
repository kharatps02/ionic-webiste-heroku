import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CoreModule } from '../../shared/core.module'
import { Conversations } from './conversations';
import { NewMessage } from './new-message/new-message';
import { ChatBox } from './chat-box/chat-box';
import { GroupChat } from './group-chat/group-chat';
import { ConversationSetting } from './conversation-setting/conversation-setting';
import { ShowImage } from './show-image/show-image';
import { PublicProfile } from './public-profile/public-profile';
//import { Autoresize } from '../../directives/auto-resize.directive';
//import { KeyboardAttachDirective } from '../../directives/keyboard-attach.directive';
import { ChatService } from './chat-service';
import { ImageCacheModule } from "../../shared/image-cache.module";
import { HousingProviderOptions } from "./housing-provider-options/housing-provider-options";

@NgModule({
    imports: [CoreModule,ImageCacheModule],
    exports: [],
    entryComponents: [Conversations, NewMessage, ChatBox, GroupChat, ConversationSetting, ShowImage, PublicProfile, HousingProviderOptions],
    declarations: [Conversations, NewMessage, ChatBox, GroupChat, ConversationSetting, ShowImage, PublicProfile, HousingProviderOptions],
    providers: [ChatService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ConversationModule { }