var request = require('request');
var config = require('../config');

var Sender = function(recipientId){
    return function(message, callback){
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: config.page_access_token},
            method: 'POST',
            json: {
                recipient: {id: recipientId},
                message: message,
            }
        }, function(error, response, body) {
            if (error) {
                callback(error, null);
            } else if (response.body.error) {
                callback(response.body.error, null);
            } else {
                callback();
            }
        });
    }
};

module.exports = Sender;
