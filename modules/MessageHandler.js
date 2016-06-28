var config = require('../config');
var request = require('request');
var moment = require('moment');
var mongoose = require('mongoose');
var Client = require('../models/Client');
var ClientCtrl = require('../controllers/ClientCtrl');
var async = require('async');
var querystring = require('querystring');
var _ = require("lodash");

var MessageHandler = {};

MessageHandler.handle = function(client, message, callback){
    console.log("Message here");
    var Sender = require('../modules/Sender')(client._id);
    var Polyglot = require('../modules/Polyglot')(client.locale);

    switch (client.conv_status) {
        case "inactive":
            client.updateStatus("new_session");
            Sender({text: "test"}, callback);
            break;

        case "new_session":
            console.log("new session");
            Sender({text: "Veuillez cliquer un button pour continuer"}, newSession(callback));
            break;

        case "start_address":
            console.log("start address");
            //Client.update({_id: client._id}, { $set: {conv_status: "choose_start_address"}}).exec(proposeAddress(userID, message.text));
            break;

        default:
            Sender({text: "This is a default message"}, callback);
    }

    function newSession(callback) {
        message = {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: Polyglot("newSession"),
                    buttons:[{
                        type: "postback",
                        title: "informations",
                        payload: "info"
                    },
                    {
                        type: "postback",
                        title: "Commander",
                        payload: "new_order",
                    }]
                }
            }
        };
        Sender(message, callback);
    };
}

module.exports = MessageHandler;
