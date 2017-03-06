var moment = require('moment-timezone');
var Client = require('../models/Client');

exports.checkFloor = function(text) {
    var regex = /^ *([1-9][0-9]*|trottoir) *, *([1-9][0-9]*|trottoir) *$/;
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
    regex = /^([01][0-9]|2[0-3])[0-5][0-9]$/
    return regex.test(text)
}

exports.checkPhoneNumber = function(text) {
    return true;
}

exports.checkEmailAddress = function(text) {
    var regex = /^[a-z0-9._-]+@[a-z0-9._-]+\.[a-z]{2,6}$/;
    return regex.test(text);
}

exports.livraisonPrevuFormat = function(str, p1, p2, p3, p4, p5) {
    result = 'Livraison prévu à ' + p4 + ':' + p5 + ' le ' + p3 + '/' + p2 + '/' + p1;
    return result;
}
