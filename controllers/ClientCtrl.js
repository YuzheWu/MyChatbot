var _ = require('lodash');
var moment = require('moment-timezone');
var config = require('../config');
var async = require('async');
var mongoose = require('mongoose');
var request = require('request');
var Client = require('../models/Client');

var ClientCtrl = {};

ClientCtrl.check = function(userId, callback){
    console.log("Check here");
    Client.findById(userId, function (err, client) {
        if(!client) {
            var profileUrl = "https://graph.facebook.com/v2.6/" + userId + "?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=" + config.page_access_token;
            request(profileUrl, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    body = JSON.parse(body);
                    var client = new Client;
                    client._id = userId;
                    client.first_name = body.first_name;
                    client.last_name = body.last_name;
                    client.conv_status = "inactive";
                    client.locale = body.locale == 'fr_FR' ? 'fr_FR' : 'en_GB';
                    client.timezone = body.timezone;
                    client.gender = body.gender;
                    client.timestamp_last_msg = moment().unix();
                    client.save(function(err, client, numAffected) {
                        callback(null, client);
                    });
                }
                else {
                    callback(error, null);
                }
            });
        }
        else {
            callback(null, client);
        }
    });
}

// ClientCtrl.update = function(userId, update, callback){
//     Client.update({_id: userId}, update, {overwrite: true}).exec(callback);
// }

module.exports = ClientCtrl;
