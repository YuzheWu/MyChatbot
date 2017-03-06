var request = require('request');
var config = require('../config');
var querystring = require('querystring');
var async = require('async');

var Regex = require('./Regex');

var Sender = function(client){
    var recipientId = client._id;
    var Polyglot = require('../modules/Polyglot')(client.locale);
    var Format = require('../formats/' + client.locale);
    var msgs = {}
    msgs.send = function(message, callback) {
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
                callback(error);
            } else if (response.body.error) {
                callback(response.body.error);
            } else {
                callback(null);
            }
        });
    }

    msgs.newSession = function(callback) {
        message = {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: Polyglot("newSession") + " " + client.first_name,
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
        msgs.send(message, callback);
    };

    msgs.informations = function(callback){
        var message= {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: Polyglot('infosTrusk'),//"Trusk est une société qui fait blablabla",
                    buttons:[{
                        type: "web_url",
                        url: "http://trusk.com",
                        title: Polyglot('plusInfo')//"plus d'informations"
                    },
                    {
                        type: "postback",
                        title: Polyglot('Commander'),//"Commander",
                        payload: "new_order"
                    }]
                }
            }
        };
        msgs.send(message, callback);
    };

    msgs.demandStartAddress = function(callback) {
        var text = Polyglot('adresseDepart');//"Veuillez saisir l'adresse du départ, ex: 25 Rue du Petit Musc";
        msgs.send({text: text}, callback);
    }



    msgs.demandEndAddress = function(callback) {
        var text = Polyglot('adresseArrivee');//"Veuillez saisir l'adresse de l'arrivée, ex: 74 Rue Saint-Paul";
        msgs.send({text: text}, callback);
    }

    msgs.proposeAddress = function(callback, address){

        var req={
            input:address,
            types:'address',
            location:'48.853,2.35',
            radius:50000,
            key:config.key_googlemap,
        }
        req=querystring.stringify(req);
        var url=config.url_place+req;
        request(url,function(error,response,body){
            if(error) {
                callback(error);
            }
            else {
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
                    for(var i=0;i<nbRes;i++){
                        if(body.predictions[i].description){
                            var text=body.predictions[i].description;
                            var box={
                                "title":text,
                                "subtitle":"",
                                "buttons":[
                                    {
                                        "type":"postback",
                                        "title":Polyglot("choisir"),//"choisir",
                                        "payload":"address "+i,
                                    }
                                ]
                            };
                            msg.attachment.payload.elements.push(box);
                        }
                        else{
                            console.log('la barbe');
                        }
                    }
                        for(var i=0;i<nbRes;i++) {
                            if(body.predictions[i].description){
                                client.pending_order.address_proposals.push(body.predictions[i].description);
                            }
                        }
                    msgs.send({text : Polyglot("autreAdresse")}, function(error) {
                        if(error) {
                            console.log(error);
                        }
                        else {
                            msgs.send(msg, callback);
                        }
                    });
                }
                else{
                    var msg=Polyglot('changeAdresse');//'Retapez une adresse';
                    msgs.send({text: msg}, callback);
                }
            }
        });
    }

    msgs.serviceTypeMessage = function(callback) {
        message = {
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"button",
                "text":Polyglot("typeService"),//"Choisissez le type de service",
                "buttons":[
                  {
                      "type":"postback",
                      "title":Polyglot("livraisonObjets"),//"Livrason d'objets",
                      "payload":"regular_service"
                  },
                  {
                      "type":"postback",
                      "title":Polyglot("demenagement"),//"Déménagement",
                      "payload":"moving_service"
                  }
                ]
              }
            }
        }

        msgs.send(message, callback);
    }

    msgs.sendToCustomerService = function(callback) {
        text =Polyglot("serviceClient"); //"Veuillez contactez notre service client pour en discuter les détail: 01 76 34 00 78";
        var message={
          "attachment":{
            "type":"template",
            "payload":{
              "template_type":"button",
              "text":text,
              "buttons":[
                {
                  "type":"phone_number",
                  "title":"SC",
                  "payload":"+33634025870"
                }
              ]
            }
          }
        };
        msgs.send(message, callback);
    }

    // ask client to provide a list of objects
    msgs.demandItem = function(callback) {
        text =Polyglot("demandeListeObjets"); //"Tapez liste d'objets à transporter, eg: 3 chaises, 1 table, 2 canapés";
        msgs.send({text: text}, callback);
    }

    msgs.demandItemConfirmation = function(callback) {
            var items = client.pending_order.items;
            str_items = "" + items[0].quantity + " " + items[0].type + "(s)";
            for(var i = 1; i<items.length; i++) {
                str_items += ", " + items[i].quantity + " " + items[i].type + "(s)";
            }
            text = Polyglot("listeObjets") /*"Liste d'objets: "*/ + str_items;
            msgs.send({text: text}, function(error) {
                if(error) {
                    console.log(error);
                }
                else {
                    var message = {
                        "attachment":{
                          "type":"template",
                          "payload":{
                            "template_type":"button",
                            "text":Polyglot("autresObjets"),//"D'autres objets à ajouter?",
                            "buttons":[
                              {
                                  "type":"postback",
                                  "title":Polyglot("fin"),//"J'ai fini!",
                                  "payload":"finish_item_list"
                              }
                            ]
                          }
                        }
                    };

                    msgs.send(message, callback);
                }
            });
    }


    msgs.proposeOffers = function(callback) {
        msgs.send({text: Polyglot('deuxOptions')}, function(error) {
            if(!error) {
                var price_1 = client.pending_order.price_1/100 + " €";
                var message = {
                    "attachment": {
                        "type": "template",
                        "payload": {
                            "template_type": "generic",
                            "elements": [
                                {
                                    "title": Polyglot('TaT'),
                                    "subtitle": price_1,
                                    "image_url": config.url_pic_option_1,
                                    "buttons": [{
                                        "type": "postback",
                                        "title": Polyglot('choisir'),
                                        "payload": "confirm_option trottoir_a_trottoir"
                                    }]
                                },
                                {
                                    "title": Polyglot('PaP'),
                                    "subtitle": Polyglot('prixExact'),
                                    "image_url": config.url_pic_option_2,
                                    "buttons": [{
                                        "type": "postback",
                                        "title": Polyglot('choisir'),
                                        "payload": "porte_a_porte"
                                    }]
                                }
                            ]
                        }
                    }
                };
                msgs.send(message, callback);
            }
            else {
                callback(error);
            }
        });
    }

    msgs.demandFloor = function(callback) {
        text =Polyglot("numEtages"); //"Veuillez préciser numéro d'étage au départ et à l'arrivée, séparés par une virgule. Mettez <trottoir> si nécessaire.";
        msgs.send({text: text}, callback);
    }

    msgs.demandStartElevator = function(callback) {
        message = {
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"button",
                "text":Polyglot("ascDpt"),//"Ascenseur au départ?",
                "buttons":[
                  {
                      "type":"postback",
                      "title":Polyglot("Oui"),
                      "payload":"startElevator true"
                  },
                  {
                      "type":"postback",
                      "title":Polyglot("Non"),
                      "payload":"startElevator false"
                  },
                ]
              }
            }
        }
        msgs.send(message, callback);
    }

    msgs.showPrices = function(callback) {

        client.pending_order.status = "showPrices";

        var items = client.pending_order.items;
        var itemsStr = "";
        for(var i = 0; i<items.length; i++) {
            itemsStr += "\n" + items[i].quantity + " " + items[i]["type"];
        }
        var input = encodeURIComponent(itemsStr);
        var req={
            input: input,
            distance: client.pending_order.distance,
            token: config.key_trusk_items
        };
        req.startSidewalk = client.pending_order.startSidewalk;
        req.endSidewalk = client.pending_order.endSidewalk;
        if(!req.startSidewalk) {
            req.startFloors = client.pending_order.startFloors;
            req.startElevator = client.pending_order.startElevator;
        }
        if(!req.endSidewalk) {
            req.endFloors = client.pending_order.endFloors;
            req.endElevator = client.pending_order.endElevator;
        }
        var url_1 = config.url_trusk_items + querystring.stringify(req) + "&twoPeople=false";
        var url_2 = config.url_trusk_items + querystring.stringify(req) + "&twoPeople=true";

        async.series([
            function(seriesCallback) {
                request(url_1,function(error,response,body) {
                    if(!error){
                        body=JSON.parse(body);
                        client.pending_order.price_2 = body.price;
                        seriesCallback();
                    }
                    else {
                        callback(error);
                    }
                });
            },
            function(seriesCallback) {
                request(url_2,function(error,response,body) {
                    if(!error){
                        body=JSON.parse(body);
                        client.pending_order.price_3 = body.price;
                        seriesCallback();
                    }
                    else {
                        callback(error);
                    }
                });
            },
        ], function(error, results){
            if(error) {
                callback(error);
            }
            else {
                msgs.send({text: Polyglot('choixOption')}, function(error) {
                    if(!error) {
                        var price_1 = client.pending_order.price_1/100 + " €";
                        var price_2 = client.pending_order.price_2/100 + " €";
                        var price_3 = client.pending_order.price_3/100 + " €";
                        var message = {
                            "attachment": {
                                "type": "template",
                                "payload": {
                                    "template_type": "generic",
                                    "elements": [
                                        {
                                            "title": Polyglot('TaT'),
                                            "subtitle": price_1,
                                            "image_url": config.url_pic_option_1,
                                            "buttons": [{
                                                "type": "postback",
                                                "title": Polyglot('choisir'),
                                                "payload": "confirm_option trottoir_a_trottoir"
                                            }]
                                        },
                                        {
                                            "title": Polyglot('PaP1T'),
                                            "subtitle": price_2,
                                            "image_url": config.url_pic_option_2,
                                            "buttons": [{
                                                "type": "postback",
                                                "title": Polyglot('choisir'),
                                                "payload": "confirm_option porte_a_porte_1"
                                            }]
                                        },
                                        {
                                            "title": Polyglot('PaP2T'),
                                            "subtitle": price_3,
                                            "image_url": config.url_pic_option_3,
                                            "buttons": [{
                                                "type": "postback",
                                                "title": Polyglot('choisir'),
                                                "payload": "confirm_option porte_a_porte_2"
                                            }]
                                        }
                                    ]
                                }
                            }
                        };
                        msgs.send(message, callback);
                    }
                    else {
                        callback(error);
                    }
                });
            }
        });
    }

    msgs.demandDeliveryTime = function(callback){
      text = Polyglot("heureLivraison");//"A quelle heure voulez vous être livré?(HHMM)";
      msgs.send({text: text}, callback);
    }

    msgs.demandDateConfirmation = function(callback) {
        var date_local = client.pending_order.date_local;
        var message = {
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"button",
                "text": date_local.replace(Regex.momentFormat, Format.livraisonPrevuFormat),
                "buttons":[
                  {
                      "type":"postback",
                      "title":Polyglot("modifier"),
                      "payload":"modify_date"
                  },
                  {
                      "type":"postback",
                      "title":Polyglot("confirmer"),
                      "payload":"confirm_date"
                  },
                ]
              }
            }
        }
        msgs.send(message, callback);
    }

    msgs.demandEndElevator = function(callback) {
        var message = {
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"button",
                "text":Polyglot("ascArrivee"),//"Ascenseur à l'arrivée?",
                "buttons":[
                  {
                      "type":"postback",
                      "title":Polyglot("Oui"),
                      "payload":"endElevator true"
                  },
                  {
                      "type":"postback",
                      "title":Polyglot("Non"),
                      "payload":"endElevator false"
                  },
                ]
              }
            }
        }
        msgs.send(message, callback);
    }

    msgs.prenom = function(callback){
        var message= {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: Polyglot("prenom")+client.first_name+Polyglot("prenom2"),
                    buttons:[{
                        type: "postback",
                        title: Polyglot('confirmPrenom'),
                        payload: "first_name",
                    }]
                }
            }
        };
        msgs.send(message, callback);
    }

    msgs.recapCommande = function(urlReponse,callback){
     var items=[];
     items=client.pending_order.items;
     var listItems="";
     for(var i=0;i<items.length;i++){
       listItems=listItems+"\n"+items[i].quantity+" "+items[i].type;
     }
     //var détailsLivraison= Polyglot("détailsLivraison",{adDépart : client.pending_order.startAddress, adArrivee : client.pending_order.endAddress, date : client.pending_order.date, heure : client.pending_order.time});
     var détailsLivraison=Polyglot("depart")+client.pending_order.startAddress.split(",")[0]+"\n"+Polyglot("arrivee")+client.pending_order.endAddress.split(",")[0]+"\n"/*+Polyglot("dateHeure")*/+"le "+client.pending_order.date+Polyglot("a")+client.pending_order.time;
     //var détailsFact=Polyglot("détailsFact",{prenom : client.first_name, nom : client.last_name, mailAddress : client.mailAddress});
     var détailsFact=client.first_name+" "+client.last_name+"\n"+client.mail_address+"\n"+client.phone_number;
     console.log("je lis jusqu'ici");
     var message={
       "attachment":{
           "type":"template",
           "payload":{
             "template_type":"generic",
             "elements":[
               {
                 "title":Polyglot("commande"),//"Commande",
                 "subtitle": détailsLivraison,
                 "image_url":urlReponse,
                 "buttons":[
                   {
                     "type":"postback",
                     "title":Polyglot("modifier"),//"modifier",
                     "payload":"modifierCommande"
                   }
                 ]
               },
               {
                 "title":Polyglot("objets"),//'Objets',
                 "subtitle":listItems,
                 "buttons":[
                   {
                     "type":"postback",
                     "title":Polyglot("modifier"),
                     "payload":"modifierObjets",
                   }
                 ]
               },
               {
                 "title":Polyglot("facturation"),//"Facturation",
                 "subtitle":détailsFact,
                 "buttons":[
                   {
                     "type":"postback",
                     "title":Polyglot("modifier"),
                     "payload":"modifierFacture"
                   },
                   {
                     "type":"web_url",
                     url: "www.google.fr",
                     "title":Polyglot("payer"),
                   }
                 ]
               }
             ]
           }
         }
       };
       msgs.send(message, callback);
   };


    msgs.demandDeliveryDate = function(callback) {
        client.pending_order.status = "date";
        var message = {
            "attachment":{
              "type":"template",
              "payload":{
                "template_type":"button",
                "text":Polyglot("livraisonAujourdhui"),
                "buttons":[
                  {
                      "type":"postback",
                      "title":Polyglot("Oui"),
                      "payload":"deliver_today"
                  }
                ]
              }
            }
        }
        msgs.send(message, callback);
    }

    msgs.nom = function(callback){
        var message= {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: Polyglot("nom")+client.last_name+Polyglot("nom2"),
                    buttons:[{
                        type: "postback",
                        title: Polyglot('confirmNom'),
                        payload: "last_name",
                    }]
                }
            }
        };
        msgs.send(message, callback);
    }

    msgs.numTel = function(callback){
      var text = Polyglot("numTel");//'Quel est votre numéro de téléphone?';
      msgs.send({text: text}, callback);
    };

    msgs.adresseMail = function(callback){
      var text= Polyglot("adresseMail");//'Quelle est votre adresse mail?';
      msgs.send({text: text}, callback);
    };

    msgs.messageParticulier  =function(callback){
      msgs.send({text : Polyglot("commentaire")},callback);/*'Avez vous des commentaires particuliers pour votre déménageur?'*/
    };

    msgs.codePromo = function(callback){
      var message={
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: Polyglot("codePromo"),//"Si vous avez un code promo, écrivez le",
            buttons:[{
              type: "postback",
              title: Polyglot("pasCodePromo"),//"Je n'ai pas de code promo",
              payload: 'pasDeCodePromo',
            }]
          }
        }
      };
      msgs.send(message, callback);
    };

    msgs.adresseFact = function(callback){

        var startAddress=client.pending_order.startAddress;
        var endAddress=client.pending_order.endAddress;
        client.pending_order.address_proposals.push(startAddress);
        client.pending_order.address_proposals.push(endAddress);

        var message={
          "attachment":{
            "type":"template",
            "payload":{
              "template_type":"generic",
              "elements":[
                {
                  "title":startAddress,//"Adresse de Départ",
                  "subtitle":Polyglot("choisirAdDpt"),//"choisir la même adresse que celle de départ",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":Polyglot("choisir"),//"choisir",
                      "payload":"address 0"
                    }
                  ]
                },
                {
                  "title":endAddress,//"Adresse d'arrivée",
                  "subtitle":Polyglot("choisirAdArr"),//"Choisir la même adresse que celle d'arrivée",
                  "buttons":[
                    {
                      "type":"postback",
                      "title":Polyglot("choisir"),
                      "payload":"address 1",
                    }
                  ]
                }
              ]
            }
          }
        }
        //'choisissez l\'adresse de facturation ou écrivez en une autre'});
        msgs.send({text: Polyglot("choixAdresseFact")}, function(error) {
            if(error) {
                console.log(error);
            }
            else {
                msgs.send(message, callback);
            }
        });
    };





    return msgs;
};

module.exports = Sender;
