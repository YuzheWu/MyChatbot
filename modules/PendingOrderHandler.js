var config = require('../config');
var request = require('request');
var moment = require('moment-timezone');
var mongoose = require('mongoose');
var Client = require('../models/Client');
var ClientCtrl = require('../controllers/ClientCtrl');
var async = require('async');
var querystring = require('querystring');
var _ = require("lodash");

var PendingOrderHandler = {};

PendingOrderHandler.handle = function(client, callback) {
    var Sender = require('../modules/Sender')(client);
    var Polyglot = require('../modules/Polyglot')(client.locale);
    switch (client.pending_order.status) {
        case "list_item":
            client.updateStatus("list_item");
            Sender.demandItem(callback);
            break;

        case "choose_offer_type":
            client.updateStatus("choose_offer_type");
            // propose offers, with price shown for trottoir_a_trottoir
            Sender.proposeOffers(callback);
            break;

        case "floor":
            client.updateStatus("floor");
            Sender.demandFloor(callback);
            break;

        case "showPrices":
            client.updateStatus("confirm_offer_type");
            Sender.showPrices(callback);
            break;

        case "date":
            client.updateStatus("delivery_date");
            Sender.demandDeliveryDate(callback);
            break;

        case "commentaire":
            client.updateStatus("commentaire");
            Sender.messageParticulier(callback);
            break;

        case "codePromo":
            client.conv_status='codePromo';
            Sender.codePromo(callback);
            break;

        case "factureInfo":
            client.updateStatus("first_name");
            Sender.prenom(callback);
            break;

        case "recapCommande":
            client.conv_status='recapCommande';
            imageTrajet(function(error, data){
                if(!error){
                    console.log(data);
                    Sender.recapCommande(data,callback);
                }
            });
            break;

    }

    function imageTrajet(callback){
     var urlReponse="";
     var queryGeocode = {
       address : client.pending_order.endAddress,
       key : config.key_googlemap
     }
     var urlGeocode = 'https://maps.googleapis.com/maps/api/geocode/json?' + querystring.stringify(queryGeocode);
     request(urlGeocode,function(error,response,body) {
       if(!error) {
         body=JSON.parse(body);
         var req={
           origin:client.pending_order.startLat+","+client.pending_order.startLng,
           destination:body.results[0].geometry.location.lat+","+body.results[0].geometry.location.lng,
           size:"191x100"
         };
         url="https://gpath.trusk.com/?"+querystring.stringify(req);
         console.log(url);
         request(url,function(error,response,body){
           body=JSON.parse(body);
            urlReponse=body.images.withPolylines;
           callback(null,urlReponse);
         });
       }
     });
   };



}

module.exports = PendingOrderHandler;
