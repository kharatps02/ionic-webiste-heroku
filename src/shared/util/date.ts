'use strict';
import * as moment from 'moment';
import { DatePipe } from '@angular/common';

export let formatDate = function (inPutDate: any, translateService: any): string {
    let givenDate: Date, currentDate: Date, dayDiff: number, responseStr: string, monthsInShort: Array<string>, periods: string;
    monthsInShort = [
        translateService.instant('MONTHS_IN_SHORT.JAN'),
        translateService.instant('MONTHS_IN_SHORT.FEB'),
        translateService.instant('MONTHS_IN_SHORT.MAR'),
        translateService.instant('MONTHS_IN_SHORT.APR'),
        translateService.instant('MONTHS_IN_SHORT.MAY'),
        translateService.instant('MONTHS_IN_SHORT.JUN'),
        translateService.instant('MONTHS_IN_SHORT.JUL'),
        translateService.instant('MONTHS_IN_SHORT.AUG'),
        translateService.instant('MONTHS_IN_SHORT.SEP'),
        translateService.instant('MONTHS_IN_SHORT.OCT'),
        translateService.instant('MONTHS_IN_SHORT.NOV'),
        translateService.instant('MONTHS_IN_SHORT.DEC'),
    ];
    periods = translateService.instant('TIMESTAMP.AM');
    givenDate = new Date(inPutDate);
    currentDate = new Date();
    // var a = moment(givenDate);
    // var b = moment(currentDate);
    // console.log(a.diff(b, 'days'));
    dayDiff = moment(currentDate).diff(moment(givenDate), 'days');
            
    if (dayDiff === 0 && (currentDate.getDate() - givenDate.getDate() === 0)) {
        responseStr = localDate(givenDate,translateService.currentLang);
    } else if (dayDiff <= 1) {
        responseStr = translateService.instant('TIMESTAMP.DAY_AGO');
    }
    else {
        responseStr = monthsInShort[givenDate.getMonth()] + ' ' + givenDate.getDate();
    }
    return responseStr;
}

export function localDate(value: any, currentLang: any){
    const datePipe: DatePipe = new DatePipe(currentLang);
    let pattern = 'hh:mm a';
    if (currentLang.split('-')[0] === 'zh'){
      pattern = 'hh:mm';
    }
    return datePipe.transform(value, pattern);
}

export let dateDifference = function(currentDate:any,givenDate:any) : number {
    return moment(currentDate).diff(moment(givenDate), 'days')
}

