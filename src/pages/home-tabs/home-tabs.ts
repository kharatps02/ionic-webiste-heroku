import { Component, OnDestroy } from '@angular/core';
import { Events } from 'ionic-angular';
import { AroundmePage } from '../../pages/aroundme/aroundme';
import { ActivityPage } from '../../pages/activity/activity-feed';
import { Conversations } from '../../pages/conversations/conversations';
import { MyStuff } from '../../pages/my-stuff/my-stuff';
//import { ServiceRequest } from '../../pages/service-request/service-request';
import { PubNubService } from '../../providers/pubnub-service';
import { UserService, ICoachMarksSettings, ICoachMarksSettingsRequest } from '../../providers/user-service';
import { LoaderService } from '../../providers/loader-service';
import { CONSTANTS } from '../../shared/config';
import { TranslateService } from "@ngx-translate/core";
@Component({
  selector: 'page-home-tabs',
  templateUrl: 'home-tabs.html'
})

export class HomeTabs implements OnDestroy {
  public ActivityTab: Component;
  public ConversationTab: Component;
  public AroundmeTab: Component;
  public MyStuffTab: Component;
  //public ServiceRequestTab: Component;
  public showCoachMarks: ICoachMarksSettings;
  public selectedIndex: number = 0;
  constructor(public pubNubService: PubNubService, public userService: UserService,
    private translateService: TranslateService,
    public loaderService: LoaderService, private events: Events) {
    this.ActivityTab = ActivityPage;
    this.ConversationTab = Conversations;
    this.AroundmeTab = AroundmePage;
    this.MyStuffTab = MyStuff;
    //this.ServiceRequestTab = ServiceRequest;
  }

  onTabClick(tab) {
    this.selectedIndex = tab.index;
    if (this.selectedIndex !== 0) {
      this.events.publish(CONSTANTS.APP_EVENTS.STOP_TTS);
    }
  }

  setCoachMarks(page) {
    switch (page) {
      case 'feed':
        this.userService.userObj.show_coach_marks.feed = false;
        break;
      case 'conversation':
        this.userService.userObj.show_coach_marks.conversation = false;
        break;
      case 'around_me':
        this.userService.userObj.show_coach_marks.around_me = false;
        break;
      case 'profile':
        this.userService.userObj.show_coach_marks.profile = false;
        break;
    }

    if (!this.userService.userObj.show_coach_marks.feed && !this.userService.userObj.show_coach_marks.conversation &&
      !this.userService.userObj.show_coach_marks.around_me && !this.userService.userObj.show_coach_marks.profile) {
      this.userService.userObj.show_coach_marks.all = false;
    }

    let coachMarksSettingsRequest: ICoachMarksSettingsRequest;
    coachMarksSettingsRequest = Object.assign({ user_id: this.userService.userObj.user_id }, { show_coach_marks: this.userService.userObj.show_coach_marks });

    this.userService.setCoachMarkSettings(coachMarksSettingsRequest).subscribe((response) => {
      if (response.status === CONSTANTS.RESPONSE_STATUS.SUCCESS) {
        this.userService.userObj.show_coach_marks = response.show_coach_marks;
        // Set map clickable on Got it click of around you.
        if (page === 'around_me') {
          this.events.publish(CONSTANTS.APP_EVENTS.AROUND_YOU_COACH_MARK_GOT_IT_CLICK);
        }
      } else {
        this.loaderService.showToaster(this.translateService.instant('ERROR_MESSAGES.PROFILE_SAVE_DONE'));
      }
    });
  }
  ngOnDestroy() {
    // console.log("Home tab is killed!!");
    this.ActivityTab = null;
    this.ConversationTab = null;
    this.AroundmeTab = null;
    this.MyStuffTab = null;
  }
}



