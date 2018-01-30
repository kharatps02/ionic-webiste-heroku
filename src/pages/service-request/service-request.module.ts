import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CoreModule } from '../../shared/core.module'
import { ImageCacheModule } from "../../shared/image-cache.module";
import { ServiceRequest } from './service-request';
import { ServiceRequestReported } from './create-request/request-reported/request-reported';
import { CreateRequest } from './create-request/create-request';
import { ServiceRequestService } from './service-request-service'
import { UploadService } from '../../providers/upload-service';
import { ServiceRequestDetails } from './service-request-details/service-request-details';
@NgModule({
    imports: [CoreModule, ImageCacheModule],
    exports: [],
    entryComponents: [ServiceRequest, ServiceRequestReported, CreateRequest, ServiceRequestDetails],
    declarations: [ServiceRequest, ServiceRequestReported, CreateRequest, ServiceRequestDetails],
    providers: [ServiceRequestService, UploadService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServiceRequestModule { }



