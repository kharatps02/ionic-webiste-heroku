export let CONSTANTS = {
    LOCAL_TOKEN_KEY: 'LTK',
    HAS_LOGGED_IN: 'HLI',
    HAS_APP_STARTED: 'HAS',
    DEVICE_TOKEN_KEY: 'DTK',
    LOCAL_CONVERSATION_COUNT_MAP: 'LCCM',
    AUTH_EVENTS: {
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    },
    APP_ID: '22062016',
    DEVICE_ID: 'web-dev1',
    DEFAULT_LANGUAGE: 'en',
    AVAILABLE_LANGUAGE: ['en', 'es', 'ko', 'ht', 'ru', 'zh-CN', 'zh-TW','pt'],
    GCM_SENDER_ID: '975547819683',
    ALL_USER_GROUP: 'rezility_all',
    APP_UPDATE_URL: {
        ANDROID: 'https://play.google.com/store/apps/details?id=com.enterprise.rezility',
        IOS: 'https://itunes.apple.com/us/app/rezility/id1209975627?ls=1&mt=8'
    },
    APP_UPDATE_STATUS_CODE: {
        NO_UPDATE: 0,
        NORMAL_UPDATE: 1,
        FORCE_UPDATE: 2
    },
    GOOGLE_MAP_DEFAULT_MARKER: {
        ICON: './assets/img/blue-pin.png',
        DROP_PIN_ICON: './assets/img/grey-pin.png'
    },
    CONVERSATION_MAX_UNREAD_COUNT: 25,
    ACTIVITY_FEED_SCROLL_TO_TOP_DURATION: 500,
    PLACE_NEAR_BY_SEARCH_MAP_RADIUS: 1000,
    APP_EVENTS: {
        NEW_MESSAGE: "newmessage",
        UPDATE_CONVERSATION: "updateconversation",
        SENT_MESSAGE: "sentmessage",
        ARROUND_YOU_ACTIONS: "arroundyouactions",
        NEW_MSG_PRESENCE_EVENT: "presence_new_msg",
        CHAT_BOX_PRESENCE_EVENT: "presence_chat_box",
        CONV_PRESENCE_EVENT: "presence_conversation",
        GROUP_SETTING_PRESENCE_EVENT: "presence_grp_settings",
        GROUP_CREATED: 'groupcreated',
        KEYBOARD: "keyboard",
        GROUP_EVENTS: "groupevents",
        CLOSE_IMAGE_PREVIEW: 'closeimagepreview',
        CONNECTION_STATUS_CHANGED: 'connectionstatuschanged',
        CHAT_BOX_CONNECTION_STATUS_CHANGED: 'chatboxconnectionstatuschanged',
        REFRESH_CONVERSATION: 'refreshconversation',
        REFRESH_GROUP_DETAILS: 'refreshgroupdetails',
        AROUND_YOU_COACH_MARK_GOT_IT_CLICK: 'aroundyoucoachmarkgotitclick',
        PROVIDER_PRESENCE_EVENT: "presence_provider",
        SERVICE_REQUEST_REPORTED: "servicerequestreported",
        SERVICE_REQUEST_MESSAGE: 'servierequestmessage',
        STOP_TTS: "stoptexttospeech",
        LANGUAGE_UPDATE: "languagerefresh"
    },
    ARROUND_YOU_ACTIONS: {
        SELECT_SAVED_PIN: 'selectsavepin',
        SAVE_FILTER: 'savefilter'
    },
    PAGES: {
        ACTIVITY_FEED: "ACTIVITY_FEED",
        CONVERSATION: "CONVERSATION",
        AROUND_YOU: "AROUND_YOU",
        MY_STUFF: "MY_STUFF",
        CHAT_BOX: "CHAT_BOX",
        GROUP_CHAT: "GROUP_CHAT",
        SERVICE_REQUESTS: "SERVICE_REQUESTS",
        MY_PINNED_LOCATION: "MY_PINNED_LOCATION",
        EDIT_PINNED_LOCATION: "EDIT_PINNED_LOCATION",
        SET_PIN_LOCATION: "SET_PINNED_LOCATION",
        MAP_OVERLAYS: "MAP_OVERLAYS",
        LOGIN: "LOGIN",
        DISCONTINUE_PROPERTY: "DISCONTINUE_PROPERTY",
        HOUSING_TYPES: "HOUSING_TYPES",
        HOUSING_UNIT: "SELECT UNIT",
        PENDING_CONFIRMATION: "PENDING_CONFIRMATION",
        PROVIDER_DETAIL: "PROVIDER_DETAIL",
        PROVIDER_OPTIONS: "PROVIDER_OPTIONS",
        VERIFY_ADDRESS: "VERIFY_ADDRESS",
        CONVERSATION_SETTINGS: "CONVERSATION_SETTINGS",
        NEW_MESSAGE: "NEW_MESSAGE",
        PUBLIC_PROFILE: "PUBLIC_PROFILE",
        VIEW_IMAGE: "VIEW_IMAGE",
        EDIT_PROFILE: "EDIT_PROFILE",
        ADDRESS_UPDATE: "ADDRESS_UPDATE",
        MY_STUFF_PROFILE: "MY_STUFF_PROFILE",
        MY_STUFF_SETTINGS: "MY_STUFF_SETTINGS",
        MY_STUFF_CHANGE_PASSWORD: "MY_STUFF_CHANGE_PASSWORD",
        MY_STUFF_BLOCKED_USERS: "MY_STUFF_BLOCKED_USERS",
        FEEDBACK: "FEEDBACK",
        REQUEST_PASSWORD: "REQUEST_PASSWORD",
        REQUEST_PASSWORD_ERROR: "REQUEST_PASSWORD_ERROR",
        REQUEST_PASSWORD_SUCCESS: "REQUEST_PASSWORD_SUCCESS",
        GET_STARTED: "GET_STARTED",
        SELECT_PASSWORD: "SELECT_PASSWORD",
        SIGN_UP: "SIGN_UP",
        CHOOSE_PASSWORD: "CHOOSE_PASSWORD",
        APP_ONBOARDING: "APP_ONBOARDING"
    },

    NETWORK: {
        UNKNOWN: "unknown",
        ETHERNET: "ethernet",
        WIFI: "wifi",
        TWOG: "2g",
        THREEG: "3g",
        FOURG: "4g",
        CELLULAR: "cellular",
        NONE: "none"
    },

    CONVERSATION_TYPE: {
        GROUP: 'group',
        SINGLE: 'single'
    },
    GROUP_TYPE: {
        NORMAL: 'normal',
        SERVICE_PROVIDER: 'service_provider',
        HOUSING_PROVIDER: 'housing_provider'
    },
    CONNECTION_STATUS: {
        NOT_CONNECTED: 0,
        INVITED: 1,
        INVITATION_RECEIVED: 2,
        CONNECTED: 3,
        BLOCKED: 4,
        IGNORE: 5,
        UNBLOCKED: 6,
        CONNECTED_BLOCKED: 7
    },
    MESSAGE_CONTENT_TYPE_ID: {
        SYSTEM_MESSAGE_TO_ADMIN: 1,
        SYSTEM_MESSAGE_TO_ALL: 2,
        SERVICE_REQUEST: 3
    },
    CONVERSATION_STATUS: {
        OPEN: 'open',
        ARCHIVE: 'archived'
    },
    DEFAULT_PAGE_SIZE: {
        CHAT_BOX: 100,
        FEED: 10,
        SERVICE_LIST: 25
    },

    USER_STATES: {
        GROUP_ADD: 'add',
        GROUP_REMOVE: 'remove',
        GROUP_RENAME: 'rename',
        CONNECTION_STATUS_CHANGED: 'connectionstatuschanged',
        VERIFICATION_REQUEST: 'verificatonrequest',
        VERIFICATION_CANCEL: 'verificatoncancel',
        SERVICE_REQUEST_REPORTED: 'servicerequestreported'
    },

    ANALYTICS_EVENT: {
        EVENT_CATEGORY_LINK: "Link",
        EVENT_ACTION: "Click",
        EVENT_CATEGORY_START_CONVERSATION: 'Start Conversation',
        SUBMIT_POLL_ANSWER: 'Submit Poll Answer'
    },

    GOOGLE_MAP_PLACE_DETAIL: {
        POSTAL_CODE: 'postal_code',
        STATE: 'administrative_area_level_1',
        CITY: 'locality'
    },
    NETWORK_TIMEOUT: 30000,
    LOADER_MESSAGE: {
        DURATION: 10000
    },
    RESPONSE_STATUS: {
        SUCCESS: 'SUCCESS',
        ERROR: 'ERROR'
    },
    TOASTER: {
        DURATION: '2000',
        POSITION_BOTTOM: 'bottom',
        POSITION_CENTER: 'center'
    },
    PLACEHOLDER_IMAGES: {
        PROFILE_PIC: "./assets/img/image-placeholder.jpg"
    },

    CHANGE_PASSWORD_MESSAGES: {
        MEDIUM_REGX: '^(((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]))((?=.*[a-z]))((?=.*[A-Z]))(?=.*[0-9]))(?=.{8,100})',
    },
    NOTIFICATION_ICON: 'ic_noti',
    NOTIFICATION_COLOR: 'black',
    PRIVACY_NOTICE_URL: "https://rezility.com/privacy-notice/",
    TERM_OF_USE_URL: "https://rezility.com/terms-of-use/",
    FAQ_URL: "https://rezility.com/about-us/faq/",
    CRYPTO_SALT: "#R@z!L!tY",
    USER_TYPE: {
        RESIDENT: 'resident',
        SERVICE_PROVIDER: 'service_provider',
        HOUSING_PROVIDER: 'housing_provider',
        ADMIN: 'rezility_admin',
        ORG_ADMIN: 'org_admin',
        ADVERTISEMENT_MANAGER: 'advertisement_manager',
    },
    UPLOAD_IMAGE_SOURCE: {
        PROFILE: 'profile',
        CHATS: 'chats',
        FEEDS: 'feeds',
        PROPERTIES: 'properties',
        INCIDENTS: 'incidents'
    },
    VERIFICATION_STATUS: {
        VERIFIED: 'verified',
        UNVERIFIED: 'unverified'
    },
    FEED_ACTIONS: {
        POLL: 'poll',
        FB_SHARE: 'fb_share',
        TWITTER_SHARE: 'twitter_share',
        CHAT: 'chat',
        MORE_INFO: 'more_info',
        PROFILE: 'profile',
        PROVIDER: 'provider'
    },

    FACEBOOk_PROFILE_URL: {
        PREFIX: 'https://graph.facebook.com/',
        POSTFIX: '/picture'
    },
    GOOGLE_TRANSLATION_BASE_URL: "https://translation.googleapis.com/language/translate/v2?format=text&key=AIzaSyDrij8RehiEZdbYRarCB9JHEjSye8J_5p4&&model=base",
    MESSAGES: {
        SERVICE_REQUEST_CREATED: "Service request has been created.",
        ADVOCATE_VERIFICATION_PREFIX: "Resident Advocate Requested: ",
        VERIFICATION_PREFIX: "Verification Requested: ",
        ACCEPTED_POSTFIX: "has been verified. You are connected. ",
        DENY_PREFIX: "Verification Denied: ",
        SENT_INVITE_NOT_POSTFIX: "has invited you to connect."
    },
    TEMPLATE: {
        POLL: 'Poll',
        PROFILE: 'Profile',
        PLACEMENT: 'Placement'
    },
    FEED_IMAGE_TYPES:{
        BG_IMAGES: 'images',
        LOGO: 'logos' 
    },
    DELIVERY_TYPE: {
        NOW: "now",
        SCHEDULE: "schedule"
    }
};
