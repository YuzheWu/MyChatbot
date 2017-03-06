var config = require('../config');
var request = require('request');
var moment = require('moment-timezone');
var mongoose = require('mongoose');
var Client = require('../models/Client');
var ClientCtrl = require('../controllers/ClientCtrl');
var async = require('async');
var querystring = require('querystring');
var _ = require("lodash");
var Regex = require('./Regex');

var MessageHandler = {};

MessageHandler.handle = function(client, message, callback){
    console.log("Message here");
    var Sender = require('../modules/Sender')(client);
    var Setter = require('../modules/Setter')(client);
    var Polyglot = require('../modules/Polyglot')(client.locale);
    var Format = require('../formats/' + client.locale);


    switch (client.conv_status) {
        case "inactive":
            client.conv_status="new_session";
            Sender.newSession(callback);
            break;

        case "new_session":
            Sender.send({text: Polyglot("continuer")}, callback);
            break;

        case "start_address":
            client.conv_status="choose_start_address";
            client.pending_order=0;
            client.pending_order.start_address=null;
            Sender.proposeAddress(callback, message.text);
            //Client.update({_id: client._id}, { $set: {conv_status: "choose_start_address"}}).exec(proposeAddress(userID, message.text));
            break;

        case "choose_start_address":
            client.pending_order.address_proposals = [];
            Sender.proposeAddress(callback, message.text);
            break;

        case "start_street_number":
            if(isNaN(message.text)) {
                Sender.send({text: Polyglot("pasUnNombre")}, callback);
            }
            else {
                client.pending_order.startAddress = message.text + " " + client.pending_order.startAddress;
                client.updateStatus("end_address");
                Setter.setTimeZone(callback); // set timezone
                Sender.demandEndAddress(callback);
            }
            break;

        case "end_street_number":
            if(isNaN(message.text)) {
                Sender.send({text: Polyglot("pasUnNombre")}, callback);
            }
            else {
                client.pending_order.endAddress = message.text + " " + client.pending_order.endAddress;
                client.updateStatus("choose_service_type");
                Setter.setDistance(callback); // set distance between pick-up and drop-off addresses.
                Sender.serviceTypeMessage(callback);
            }
            break;

        case "end_address":
            client.conv_status= "choose_end_address";
            Sender.proposeAddress(callback, message.text);
            break;

        case "choose_end_address":
            client.pending_order.address_proposals = [];
            Sender.proposeAddress(callback, message.text);
            break;

        case "list_item":
        case "confirm_item_list":

            var array = message.text.split(",");
            //var regex = /[0-9]{1,2} .+/g;
            var len = array.length;
            var itemsStr = array.reduce(function(total, item){
                return total + "\n" + item;
            }, "");
            var input = encodeURIComponent(itemsStr);
            var req={
                input: input,
                distance: 0,
                endSi: true,
                startSidewalk: true,
                token: "2NV2b95cM2W9aeDwzNAnnUpmGMY3EC"
            };
            req=querystring.stringify(req);
            var url='https://items.trusk.com/match?'+req;
            request(url,function(error,response,body) {
                body=JSON.parse(body);
                if(body.items.length === len) {
                    client.conv_status="confirm_item_list";
                    addItem(body);
                    Sender.demandItemConfirmation(callback)
                    //sendMessage(userID, {text: "Type d'objet inconnu ou format incorrecte. Retapez."});
                }
                else if(body.items.length>0) {
                    client.conv_status="confirm_item_list";
                    Sender.send({text: (len - body.items.length) + Polyglot("entreeInconnues")},callback);
                    addItem(body);
                    Sender.demandItemConfirmation(callback);
                }
                else{
                    Sender.send({text: Polyglot("entreeInconnues")}, callback);
                    if(client.conv_status === "confirm_item_list") {
                        Sender.demandItemConfirmation(callback);
                    }

                }
            });
            break;

        case "floor":
            if(Format.checkFloor(message.text)) {
                var floor_fields = message.text.replace(/ /g, "").split(",");
                if(floor_fields[0] === Polyglot("trottoir")) {
                    client.pending_order.startSidewalk = true;
                }
                else {
                    client.pending_order.startSidewalk = false;
                    client.pending_order.startFloors = floor_fields[0];
                }
                if(floor_fields[1] === Polyglot("trottoir")) {
                    client.pending_order.endSidewalk = true;
                }
                else {
                    client.pending_order.endSidewalk = false;
                    client.pending_order.endFloors = floor_fields[1];
                }
                if(client.pending_order.startSidewalk) {
                    if(client.pending_order.endSidewalk) {
                        client.updateStatus("confirm_offer_type");
                        Sender.showPrices(callback);
                    }
                    else {
                        client.updateStatus("endElevator");
                        Sender.demandEndElevator(callback);
                    }
                }
                else {
                    client.updateStatus("startElevator");
                    Sender.demandStartElevator(callback);
                }
            }
            else {
                Sender.send({text: Polyglot('mauvaisFormat')}, callback);
            }
            break;

        case "delivery_date":
            if(Format.checkDate(message.text)){
                var date = Format.checkDate(message.text);
                var thisYear = moment.tz(client.pending_order.startTimezone).format().substring(0,4);
                console.log(thisYear);
                console.log(moment.tz(thisYear + "-" + date, client.pending_order.startTimezone).unix());
                console.log(moment().unix());
                console.log(moment.tz(thisYear + "-" + date, client.pending_order.startTimezone) + 86400 < moment());
                if(moment.tz(thisYear + "-" + date, client.pending_order.startTimezone).unix() + 86400 < moment().unix()) {
                    date = (parseInt(thisYear) + 1) + "-" + date;
                }
                else{
                    date = thisYear + "-" + date;
                }
                client.updateStatus("delivery_hour");
                client.pending_order.date = date;
                Sender.demandDeliveryTime(callback);
            }
            else {
                Sender.send({text: Polyglot("mauvaiseDate")}, callback);
            }
            break;

        case "delivery_hour":
            var time = message.text;
            if(Format.checkTime(time)) {
                // verify that the time is in the future
                time = Format.checkTime(time);
                var date = client.pending_order.date;
                var hour = time.substring(0,2);
                var minute = time.substring(2,4);
                var dateFormatted = date + 'T' + hour + ":" + minute + ":00";
                var date_local = moment.tz(dateFormatted, client.pending_order.startTimezone);
                if(!date_local.isValid() || !date_local.isAfter(moment())) {
                    Sender.send({text: Polyglot("heurePassee")}, callback);
                }
                else {
                    client.updateStatus("wait_date_confirmation");
                    client.pending_order.time = time;
                    client.pending_order.date_local = date_local.format();
                    Sender.demandDateConfirmation(callback);
                }
            }
            else {
                Sender.send({text: Polyglot("mauvaiseHeure")}, callback);
            }
            break;

        case 'commentaire':
            client.conv_status='codePromo';
            client.pending_order.status = "codePromo"
            client.pending_order.commentaire=message.text;
            Sender.codePromo(callback);
            break;

        case 'promotionCode':
            client.pending_order.promotionCode=message.text;
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

        case "first_name":
            client.first_name=message.text;
            client.conv_status='last_name';
            Sender.nom(callback);
            break;

        case "last_name":
            client.conv_status="PhoneNumber";
            client.last_name=message.text;
            Sender.numTel(callback);
            break;

        case 'PhoneNumber':
            var phoneNumber=message.text;
            if(phoneNumber.length==10||phoneNumber.length==12){
                client.conv_status='MailAddress';
                client.phone_number=phoneNumber;
                Sender.adresseMail(callback);
            }
            else{
              Sender.send({text:Polyglot("mauvaisNumero")}, callback);
            }
            break;


        case 'MailAddress':
            var email=message.text;
            if(Format.checkEmailAddress(email)){
              client.mail_address=email;
              client.conv_status='adresseFact';
              Sender.adresseFact(callback);
            }
            else{
              Sender.send({text: Polyglot("mauvaisMail")},callback);
            }
            break;

        case 'adresseFact':
            sender.proposeAddress(callback, message.text);
            break;

        default:
            Sender.send({text: Polyglot("messageDefaut")}, callback);
    }



    function addItem(apiRes) {
        for(var i in apiRes.items){
            client.pending_order.items.push({type: apiRes.items[i]["object"], quantity: apiRes.items[i].quantity});
        }
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

module.exports = MessageHandler;
