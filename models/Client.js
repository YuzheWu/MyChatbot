var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Sender = require('../modules/Sender');

var itemSchema = new Schema({
    type: String,
    quantity: Number
})


var orderSchema = new Schema({
    _id : String,
    status : String,
    service_type: String,
    address_proposals : Array,
    startAddress : String,
    startLat : Number,
    startLng : Number,
    startTimezone: String,
    startFloors : String,
    startElevator : Boolean,
    startSidewalk : Boolean,
    startContact : String,
    endAddress : String,
    endFloors : String,
    endElevator : Boolean,
    endSidewalk : Boolean,
    distance : Number,
    endContact : String,
    date : String,
    time : String,
    date_local : String,
    items : Array,
    option : String, // "trottoir_a_trottoir" or "porte_a_porte"
    twoPeople : Boolean,
    promotionCode: String,
    price_1 : Number, // price trottoir à trottoir
    price_2 : Number, // price porte à porte 1 trusker
    price_3 : Number, // price porte à porte 2 truskers
    price : Number,
    offer_type : String,
    comment : String
});

var clientSchema = new Schema({
    _id: {
        type: String
    },
    timestamp_last_msg: {
        type: String  // unix time in seconds
    },
    first_name: {
        type: String
    },
    last_name: {
        type: String
    },
    conv_status: {
        type: String
    },
    pending_order: {
        type: orderSchema
    },
    last_order: {
        type: Object
    },
    locale: {
        type: String
    },
    timezone: {
        type: Number
    },
    gender: {
        type: String
    },
    phone_number: {
        type: String
    },
    address: {
        type: String
    },
    mail_address : {
        type: String
    },
    cardNumber : {
        String,
    }
});

clientSchema.methods.updateStatus = function(newStatus){
    var that = this;
    that.conv_status = newStatus;
}

clientSchema.methods.initOrder = function(){
    var that = this;
    that.pending_order = {};
    that.pending_order.address_proposals = [];
}

var Client = mongoose.model('Client', clientSchema);

module.exports = Client;
