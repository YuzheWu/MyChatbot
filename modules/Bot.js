var request = require('request');
var moment = require('moment');
var mongoose = require('mongoose');
var ClientCtrl = require('../controllers/ClientCtrl');
var MessageHandler = require('../modules/MessageHandler');
var PostbackHandler = require('../modules/PostbackHandler');
var async = require('async');
var querystring = require('querystring');
var _ = require("lodash");
//var config = require('./config');

var Bot = {};

Bot.parse = function(req, res){
    console.log("Bot here");
    if(req.body && req.body.entry[0].messaging){
        console.log("Events here");
        var events = req.body.entry[0].messaging;
        console.log(events.length);
        for(var i=0; i < events.length; i++){
            var event = events[i];
            var userId = event.sender.id;
            ClientCtrl.check(userId, function(error, client){
                console.log("Client here");
                console.log(client);
                if(!error && client){
                    if (event.message && event.message.text) {
                        MessageHandler.handle(client, event.message, function(error, data){
                            if(!error)
                                res.sendStatus(200);
                            else
                                res.send(error);
                        });
                    }
                    else if (event.postback) {
                        PostbackHandler.handle(client, message, function(error, data){
                            if(!error)
                                res.sendStatus(200);
                            else
                                res.send(error);
                        });
                    }
                }
                else
                    res.send(error);
            })

        }
    }
    else {
        console.log("Test");
        res.sendStatus(200);
    }
}

module.exports = Bot;
