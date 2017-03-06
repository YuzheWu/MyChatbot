module.exports = {
    app_name : 'trusk-bot',
    locale : 'fr',
    supported_locales : ['en', 'fr'],
    server_port : 8080,

    // config database
    mongo_url : 'mongodb://localhost',
    mongo_db : 'bot-test',

    // config APIs
    key_googlemap: , // google map API key
    url_distance: 'https://maps.googleapis.com/maps/api/distancematrix/json?',
    url_geocode: 'https://maps.googleapis.com/maps/api/geocode/json?',
    url_timezone: 'https://maps.googleapis.com/maps/api/timezone/json?',
    url_place: 'https://maps.googleapis.com/maps/api/place/autocomplete/json?',
    key_trusk_items: , // trusk API key
    url_trusk_items: 'https://items.trusk.com/match?',

    // config urls and pictures
    url_info: 'http://trusk.com',
    url_pic_option_1: 'https://trusk.com/favicons/android-chrome-192x192.png',
    url_pic_option_2: 'https://trusk.com/favicons/android-chrome-192x192.png',
    url_pic_option_3: 'https://trusk.com/favicons/android-chrome-192x192.png',
    url_payment: 'www.google.fr',

    session_expire_toleration : 60,
    default_timezone: 'Europe/Paris',

    // PAGE_ACCESS_TOKEN
    page_access_token: 'EAAIZC2dZAb7kMBAPpdlncRSftf6LvHd5LTPAgJhhRuzlkrWmB7wZBHgiWultsTp1OrB9HLZCMcAaJmvAlajFxP0y1NODEzJztO399ktuZC2ZCgoJC8eDTiZBfTLhNigIlGBxWYWITxI4eF9yTrTZCAKmNvMT0YDyfRZCvyUgBm7YOTAZDZD'
};
