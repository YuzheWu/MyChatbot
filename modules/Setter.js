var request = require('request');
var config = require('../config');
var querystring = require('querystring');
var moment = require('moment-timezone');

var Setter = function(client) {
    var Polyglot = require('../modules/Polyglot')(client.locale);
    var setter = {};

    // set timezone and ask end address
    setter.setTimeZone = function(callback) {
        var queryGeocode = {
            address : client.pending_order.startAddress,
            key : config.key_googlemap
        }
        var urlGeocode = config.url_geocode + querystring.stringify(queryGeocode);
        request(urlGeocode,function(error,response,body) {
            if(!error) {
                body=JSON.parse(body);
                client.pending_order.startLat = body.results[0].geometry.location.lat;
                client.pending_order.startLng = body.results[0].geometry.location.lng;
                var queryTimezone = {
                    location: client.pending_order.startLat + ',' + client.pending_order.startLng,
                    timestamp: moment().unix(),
                    key: config.key_googlemap
                }
                var urlTimezone = config.url_timezone + querystring.stringify(queryTimezone);
                request(urlTimezone,function(error,response,body) {
                    console.log(body);
                    if(!error && body) {
                        body=JSON.parse(body);
                        client.pending_order.startTimezone = body.timeZoneId;
                        callback();
                    }
                    else {
                        console.log('test failed');
                        console.log(body);
                        client.pending_order.startTimezone = config.default_timezone;
                        callback();
                    }
                });
            }
            else {
                console.log('test failed 2');
                client.pending_order.startTimezone = config.default_timezone;
                callback(error);
            }
        });
    }

    setter.setDistance = function(callback) {
        var url = config.url_distance;
        var query = {
            origins: client.pending_order.startAddress,
            destinations: client.pending_order.endAddress,
            key: config.key_googlemap
        }
        url += querystring.stringify(query);
        request(url, function (error, res, body) {
            if (!error && body) {
                body = JSON.parse(body);
                client.pending_order.distance = body.rows[0].elements[0].distance.value;
                callback();
            }
            else{
                callback(error);
            }
        });
    }

    return setter;
}

module.exports = Setter;
