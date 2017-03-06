var config = require('./config');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var mongoose = require('mongoose');
var moment = require('moment-timezone');
var ClientCtrl = require('./controllers/ClientCtrl');
var MessageHandler = require('./modules/MessageHandler');
var PostbackHandler = require('./modules/PostbackHandler');

// connect to database
// mongoose.connect(config.mongo_url  + '/' + config.mongo_db);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen(config.server_port);

// Server frontpage
app.get('/', module.exports = function (req, res) {
        res.send('This is TestBot Server');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'testbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

// handler receiving messages
app.post('/webhook', function (req, res) {
    if(req.body && req.body.entry[0].messaging){
        var events = req.body.entry[0].messaging;
        for(var i=0; i < events.length; i++){
            var event = events[i];
            var userId = event.sender.id;
            if((event.message && event.message.text) || event.postback){
                //console.log('Event here');
                ClientCtrl.check(userId, function(error, client){
                    console.log("Client here");
                    console.log(client._id);
                    if(!error && client){
                        if((moment().unix() - client.timestamp_last_msg > config.session_expire_toleration) && (client.conv_status != 'inactive')) {
                            client.conv_status = 'inactive';
                            console.log('inactive');
                            client.save();
                            var Sender = require('./modules/Sender')(client);
                            var Polyglot = require('./modules/Polyglot')(client.locale);
                            if(client.pending_order && client.pending_order.status) {
                                Sender.send(require("./modules/actMsg").actMsg(client.locale), function(error) {
                                    if(error) {
                                        console.log(error);
                                    }
                                });
                            }
                            else {
                                Sender.send({text: Polyglot("sessionExpired")}, function(error) {
                                    if(error) {
                                        console.log(error);
                                    }
                                });
                            }
                        }
                        else {
                            client.timestamp_last_msg = moment().unix();
                            if (event.message && event.message.text) {
                                MessageHandler.handle(client, event.message, function(err){
                                    client.save();
                                    if(!err) {
                                        console.log("Message handled!");
                                    }
                                    else {
                                        console.log(err);
                                    }
                                    // client.save();
                                    // console.log("Message handled!");
                                });
                            }
                            else if(event.postback) {
                                PostbackHandler.handle(client, event.postback, function(err, data){
                                    client.save();
                                    if(!err) {
                                        console.log("Message handled!");
                                    }
                                    else {
                                        console.log(err);
                                    }
                                    // client.save();
                                    // console.log("Postback handled!");
                                });
                            }
                        }
                    }
                })
            }
        }
    }
    else {
        console.log("Test");
    }
    res.sendStatus(200);
})
