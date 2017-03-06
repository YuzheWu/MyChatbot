var PolyglotNode = require('node-polyglot');
var fs = require('fs');

var Polyglot = function(language){
	if(language != 'fr_FR'):
		language = 'en_GB'
    var polyglot = new PolyglotNode();
    polyglot.locale(language);
    var contents = fs.readFileSync('./messages/' + language + '.json');
    var jsonContent = JSON.parse(contents);
    polyglot.extend(jsonContent);
    return function(key){
        return polyglot.t(key);
    }
}

module.exports = Polyglot;
