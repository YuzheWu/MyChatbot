var config = require('../config');
var request = require('request');
var moment = require('moment-timezone');
var mongoose = require('mongoose');
var Client = require('../models/Client');
var ClientCtrl = require('../controllers/ClientCtrl');
var async = require('async');
var querystring = require('querystring');
var _ = require("lodash");
var PendingOrderHandler = require("./PendingOrderHandler");

var PostbackHandler = {};

PostbackHandler.handle = function(client, postback, callback){
    console.log("Postback here");
    var Sender = require('../modules/Sender')(client);
    var Setter = require('../modules/Setter')(client);
    var Polyglot = require('../modules/Polyglot')(client.locale);
    var status = client.conv_status;

    var payload_components = postback.payload.split(" ");
    switch(payload_components[0]) {
        case "continue_order":
            if(status == "inactive") {
                PendingOrderHandler.handle(client, callback);
            }
            break;

        case "restart_order":
            if(status == "inactive") {
                client.updateStatus("start_address");
                client.initOrder();
                Sender.demandStartAddress(callback);
            }
            break;

        case "info":
            if(status == "new_session") {
                Sender.informations(callback);
            }
            break;

        case "new_order":
            if(status == "new_session") {
                client.updateStatus("start_address");
                client.initOrder();
                Sender.demandStartAddress(callback);
            }
            break;

        case "address":
            if(status == "choose_start_address") {
                client.pending_order.startAddress = client.pending_order.address_proposals[payload_components[1]];
                client.pending_order.address_proposals = [];
                if(containStrNo(client.pending_order.startAddress)) {
                    client.updateStatus("end_address");
                    Setter.setTimeZone(function() {
                        Sender.demandEndAddress(callback);
                    }); // set timezone
                    // Sender.demandEndAddress(callback);
                }
                else {
                    client.updateStatus("start_street_number");
                    Sender.send({text: Polyglot("preciserNumeroRue")}, callback);
                }
            }

            else if(status == "choose_end_address") {
                client.pending_order.endAddress = client.pending_order.address_proposals[payload_components[1]];
                client.pending_order.address_proposals = [];
                if(containStrNo(client.pending_order.endAddress)) {
                    client.updateStatus("choose_service_type");
                    Setter.setDistance(function(error) {
                        if(error) {
                            console.log(error);
                        }
                        else {
                            Sender.serviceTypeMessage(callback);
                        }
                    }); // set distance between pick-up and drop-off addresses.
                    // Sender.serviceTypeMessage(callback);
                }
                else{
                    client.updateStatus("end_street_number");
                    Sender.send({text: Polyglot("preciserNumeroRue")}, callback);
                }
            }

            else if(status=='adresseFact'){
                client.conv_status='recapCommande';
                client.pending_order.status = "recapCommande";
                client.address = client.pending_order.address_proposals[payload_components[1]];
                client.pending_order.address_proposals = [];
                imageTrajet(function(error, data){
                    if(!error){
                        console.log(data);
                        Sender.recapCommande(data,callback);
                    }
                });
            }
            break;

        case "moving_service":
            if(status === "choose_service_type") {
                client.updateStatus("sent_to_customer_service");
                client.pending_order.service_type = "moving_service";
                Sender.sendToCustomerService(callback);
            }
            break;

        case "regular_service":
            if(status === "choose_service_type" || status === "sent_to_customer_service") {
                client.updateStatus("list_item");
                client.pending_order.service_type = "regular_service";
                client.pending_order.status = "list_item";
                Sender.demandItem(callback);
            }
            break;

        case "finish_item_list":
            if(status === "confirm_item_list") {
                client.updateStatus("choose_offer_type");
                // set price for trottoir_a_trottoir option
                var items = client.pending_order.items;
                var itemsStr = "";
                for(var i = 0; i<items.length; i++) {
                    itemsStr += "\n" + items[i].quantity + " " + items[i]["type"];
                }
                var input = encodeURIComponent(itemsStr);
                var req={
                    input: input,
                    distance: client.pending_order.distance,
                    endSidewalk: true,
                    startSidewalk: true,
                    token: config.key_trusk_items
                };
                req=querystring.stringify(req);
                var url=config.url_trusk_items+req;
                request(url,function(error,res,body) {
                    if(!error) {
                        body=JSON.parse(body);
                        client.pending_order.price_1 = body.price;
                        client.pending_order.status = "choose_offer_type";
                        // propose offers, with price shown for trottoir_a_trottoir
                        Sender.proposeOffers(callback);
                    }
                    else {
                        callback(error);
                    }
                });
            }
            break;

        case "porte_a_porte":
            if(status === "choose_offer_type") {
                client.updateStatus("floor");
                client.pending_order.status = "floor";
                Sender.demandFloor(callback);
            }
            break;

        case "startElevator":
            if(status === "startElevator") {
                client.updateStatus("endElevator");
                client.pending_order.startElevator = payload_components[1];
                if(client.pending_order.endSidewalk) {
                    client.updateStatus("confirm_offer_type");
                    Sender.showPrices(callback);
                }
                else {
                    Sender.demandEndElevator(callback);
                }
            }
            break;

        case "endElevator":
            if(status === "endElevator") {
                client.updateStatus("confirm_offer_type");
                client.pending_order.endElevator = payload_components[1];
                Sender.showPrices(callback);
            }
            break;

        case "confirm_option":
            if(status === "confirm_offer_type" || status === "choose_offer_type") {
                client.updateStatus("delivery_date");
                client.pending_order.offer_type = payload_components[1];
                Sender.demandDeliveryDate(callback);
            }
            break;

        case "deliver_today":
            if(status === "delivery_date") {
                client.updateStatus("delivery_hour");
                var date = moment.tz(moment(), client.pending_order.timezone).format().substring(0,10);
                client.pending_order.date = date;
                Sender.send({text: Polyglot('heureLivraison')}, callback);
            }
            break;

        case "modify_date":
            if(status == "wait_date_confirmation"){
                client.updateStatus("delivery_date");
                Sender.demandDeliveryDate(callback);
            }
            break;

        case "confirm_date":
            if(status == "wait_date_confirmation"){
                client.updateStatus("commentaire");
                client.pending_order.status = "commentaire";
                Sender.messageParticulier(callback);
            }
            break;

        case 'first_name':
            if(status==='first_name'){
                client.updateStatus("last_name");
                Sender.nom(callback);
            }
            break;

        case 'last_name':
            if(status==='last_name'){
        		client.updateStatus("PhoneNumber");
        		Sender.numTel(callback);
			}
			break;

        case "pasDeCodePromo":
            if(!client.address) {
                client.updateStatus("first_name");
                client.pending_order.status = "factureInfo";
                Sender.prenom(callback);
            }
            else {
                client.conv_status='recapCommande';
                client.pending_order.status = "recapCommande";
                imageTrajet(function(error, data){
                    if(!error){
                        console.log(data);
                        Sender.recapCommande(data,callback);
                    }
                });
            }
            break;

        case "modifierFacture":
            client.updateStatus("first_name");
            Sender.prenom(callback);



        default:
            console.log("Postback received: " + JSON.stringify(postback));
            callback(null);

    }



    function containStrNo(address) {
        return !isNaN(address.split(" ")[0]);
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


};



module.exports = PostbackHandler;
