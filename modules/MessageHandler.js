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
            client.address = "25 rue du petit musc";
            client.updateStatus("new_session", callback);
            break;

        case "new_session":
            console.log("new session");
            Sender({text: "Veuillez cliquer un button pour continuer"}, callback);
            break;

        case "start_address":
            console.log("start address");
            //Client.update({_id: client._id}, { $set: {conv_status: "choose_start_address"}}).exec(proposeAddress(userID, message.text));
            proposeAddress
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
    };

    function proposeAddress(userID, address){

        var req={
            input:address,
            types:'address',
            location:'48.853,2.35',
            radius:50000,
            key:'AIzaSyAk2UiZKxzTo1_58MqT9AT0NTvUjXTWl6Q',
        }
        req=querystring.stringify(req);
        var url='https://maps.googleapis.com/maps/api/place/autocomplete/json?'+req;
        request(url,function(error,response,body){
            body=JSON.parse(body);
            if(body.predictions.length){
                var nbRes=body.predictions.length;
                var msg={
                    "attachment":{
                        "type":"template",
                        "payload":{
                            "template_type":"generic",
                            "elements":[],
                        }
                    }
                };
                console.log(msg);
                for(var i=0;i<nbRes;i++){
                    if(body.predictions[i].description){
                        var text=body.predictions[i].description;
                        var box={
                            "title":text,
                            "subtitle":"",
                            "buttons":[
                                {
                                    "type":"postback",
                                    "title":"choisir",
                                    "payload":"address "+i,
                                }
                            ]
                        };
                        if(i==nbRes-1){
                            var bouton2={
                                "type":"postback",
                                "title":"reprendre",
                                "payload":"change_address",
                            };
                            box.buttons.push(bouton2);
                        }

                        msg.attachment.payload.elements.push(box);
                    }
                    else{
                        console.log('la barbe');
                    }
                }

                // Client.findById(userID, function (err, client) {
                //     for(var i=0;i<nbRes;i++) {
                //         if(body.predictions[i].description){
                //             client.pending_order.address_proposals.push(body.predictions[i].description);
                //         }
                //     }
                //     client.save();
                // });
                for(var i=0;i<nbRes;i++) {
                    if(body.predictions[i].description){
                        client.pending_order.address_proposals.push(body.predictions[i].description);
                    }
                }
                Sender(msg, callback);
            }
            else{
                var msg='Retapez une adresse';
                Sender({text:msg}, callback);
            }


            // Client.findById(userID, function (err, client) {
            //     //client.pending_order.address_proposals[i] = text;
            //     client.pending_order = {"address_proposals": test};
            //     client.save();
            //     //msg.attachment.payload.elements.push(box);
            // });
        });
    }

}




module.exports = MessageHandler;
