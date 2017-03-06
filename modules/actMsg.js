

exports.actMsg = function(language) {
    var Polyglot = require('./Polyglot')(language);
    return {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text":Polyglot("inactive_session"),//"Choisissez le type de service",
            "buttons":[
              {
                  "type":"postback",
                  "title":Polyglot("continuePendingOrder"),//"Livrason d'objets",
                  "payload":"continue_order"
              },
              {
                  "type":"postback",
                  "title":Polyglot("restartOrder"),//"Déménagement",
                  "payload":"restart_order"
              }
            ]
          }
        }
    };
}
