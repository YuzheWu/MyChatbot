var moment = require('moment-timezone');
var Client = require('../models/Client');

exports.checkFloor = function(text) {
    var regex = /^ *([1-9][0-9]*|sidewalk) *, *([1-9][0-9]*|sidewalk) *$/;
    return regex.test(text);
}

exports.checkDate = function(text) {
    var regex = /^[0-9]{2}\/[0-9]{2}$/;
    if(!regex.test(text)) {
        return null;
    }
    var date = moment(text, 'DD/MM');
    if(date.isValid()) {
        return date.format().substring(5,10);
    }
    else {
        return null;
    }
}

exports.checkTime = function(text) {
    var regex = /^ *(?:(?:((?:[01][0-9]|2[0-3])|[0-9])[^0-9apm]*((?:[0-5][0-9]){0,1}))|(?:((?:[0][0-9]|1[01])|[0-9])[^0-9apm]*((?:[0-5][0-9]){0,1}) *(am))|(?:((?:[0][1-9]|1[0-2])|[1-9])[^0-9apm]*((?:[0-5][0-9]){0,1}) *(pm))) *$/i;
    if(!regex.test(text)) {
        return null;
    }
    return text.replace(regex, function(str, p1, p2, p3, p4, p5, p6, p7, p8) {
        if(p5) {
            if(p3.length == 1) {
                p3 = 0 + p3;
            }
            if(p4 == "") {
                p4 = '00';
            }
            return p3 + p4;
        }
        else if (p8) {
            if(parseInt(p6) < 12) {
                p6 = parseInt(p6) + 12 + "";
            }
            if(p7 == "") {
                p7 = '00';
            }
            return p6 + p7;
        }
        else {
            if(p1.length == 1) {
                p1 = 0 + p1;
            }
            if(p2 == "") {
                p2 = '00';
            }
            return p1 + p2;
        }
    });
}

exports.livraisonPrevuFormat = function(str, p1, p2, p3, p4, p5) {
    result = 'Delivery scheduled on ' + + p3 + '/' + p2 + '/' + p1 + ' at ';
    if(p4 < 12) {
        result += p4 + ":" + p5 + " am";
    }
    else {
        if(p4 == 12){
            result += p4 + ":" + p5 + " pm";
        }
        else{
            result += (p4-12) + ":" + p5 + " pm";
        }
    }
    return result;
}


exports.checkPhoneNumber = function(text) {
    return true;
}

exports.checkEmailAddress = function(text) {
    var regex = /^[a-z0-9._-]+@[a-z0-9._-]+\.[a-z]{2,6}$/;
    return regex.test(text);
}

exports.livraisonPrevuFormat = function(str, p1, p2, p3, p4, p5) {
    result = 'Delivery scheduled on ' + p3 + '/' + p2 + '/' + p1 + " at ";
    if(p4 < 12) {
        result += p4 + ":" + p5 + " am";
    }
    else {
        if(p4 > 12) {
            p4 -= 12;
        }
        result += p4 + ":" + p5 + " pm";
    }
    return result;
}
