var config = require('../config');
var request = require('request');
var moment = require('moment');
var mongoose = require('mongoose');
var Client = require('../models/Client');
var ClientCtrl = require('../controllers/ClientCtrl');
var async = require('async');
var querystring = require('querystring');
var _ = require("lodash");

var PostbackHandler = {};

PostbackHandler.handle = function(client, postback, callback){
    console.log("Postback here");
    var Sender = require('../modules/Sender')(client._id);
    var Polyglot = require('../modules/Polyglot')(client.locale);

    function informations(recipientId, callback){
        var message= {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Trusk est une société qui fait blablabla",
                    buttons:[{
                        type: "web_url",
                        url: "http://trusk.com",
                        title: "plus d'informations"
                    },
                    {
                        type: "postback",
                        title: "Commander",
                        payload: "new_order"
                    }]
                }
            }
        };
        Sender(message, callback);
    };

    var payload_components = postback.payload.split(" ");
    switch(payload_components[0]) {
        case "info":
            if(client.conv_status === "new_session") {
                informations(client._id, callback);
            }
            break;

        case "new_order":
            if(client.conv_status === "new_session") {
                client.initOrder(function(error, client){
                    Sender({text: Polyglot('adresseDepart')}, callback);
                });
            }
            break;

        default:
            console.log("Postback received: " + JSON.stringify(postback));
            callback();
    }
}

module.exports = PostbackHandler;
