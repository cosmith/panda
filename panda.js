var fs = require('fs'); // file system

var Lexer = require('./lexer');
var parser = require('./grammar').parser;
parser.yy = require('./nodes');


var lexer = new Lexer();


// Adapted from the coffeescript source
// https://github.com/jashkenas/coffee-script/blob/master/lib/coffee-script/coffee-script.js
parser.lexer = {
    lex: function() {
        var tag, token;
        token = this.tokens[this.pos++];
        if (token) {
            tag = token[0], this.yytext = token[1], this.yylloc = token[2];
            this.yylineno = 0;//this.yylloc.first_line;
        } else {
            tag = '';
        }
        return tag;
    },

    setInput: function(tokens) {
        this.tokens = tokens;
        return this.pos = 0;
    },

    upcomingInput: function() {
        return "";
    }
};

parser.yy.parseError = function(message, arg) {
    message = "unexpected " + (arg.token === 1 ? 'end of input' : arg.token) + ',';
    message += " expected " + arg.expected;
    message += " (at line " + arg.line + ")";
    throw new SyntaxError(message);
};


fs.readFile('./test_grammar.pa', 'utf-8', function (err, data) {
    if (err) throw err;

    var tokenized = lexer.tokenize(data);
    parser.parse(tokenized);
});
