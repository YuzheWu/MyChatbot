var config = require('./config');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var mongoose = require('mongoose');
//var Bot = require('./modules/Bot')
var ClientCtrl = require('./controllers/ClientCtrl');
var MessageHandler = require('./modules/MessageHandler');
var PostbackHandler = require('./modules/PostbackHandler');

// connect to database
mongoose.connect(config.mongo_url  + '/' + config.mongo_db);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen(3000);

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
            if(event.message || event.postback){
                ClientCtrl.check(userId, function(error, client){
                    console.log("Client here");
                    console.log(client._id);
                    if(!error && client){
                        if (event.message && event.message.text) {
                            MessageHandler.handle(client, event.message, function(error, data){
                                client.save();
                            });
                        }
                        else if (event.postback) {
                            PostbackHandler.handle(client, event.postback, function(error, data){
                                console.log("Message sent!");
                            });
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
