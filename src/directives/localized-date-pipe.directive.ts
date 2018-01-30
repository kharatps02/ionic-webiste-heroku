import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'localizedDate',
  pure: true
})
export class LocalizedDatePipe implements PipeTransform {

  constructor(private translateService: TranslateService) {
  }

  transform(value: any, pattern: string = 'yMdhm'): any {
    const datePipe: DatePipe = new DatePipe(this.translateService.currentLang);
    if (this.translateService.currentLang.split('-')[0] === 'zh'){
      pattern = 'MM/dd/yy hh:mm';
    }
    return datePipe.transform(value, pattern);
  }

}
