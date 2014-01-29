(function() {

var Lexer = require('./lexer');
var parser = require('./grammar').parser;
parser.yy = require('./nodes');
var Scope = require('./scope').Scope;

var lexer = new Lexer();

// Adapted from the coffeescript source
// https://github.com/jashkenas/coffee-script/blob/master/lib/coffee-script/coffee-script.js
parser.lexer = {
    lex: function() {
        var tag, token;
        token = this.tokens[this.pos++];
        if (token) {
            tag = token[0], this.yytext = token[1], this.yylloc = token[2];
            this.yylineno = this.yylloc.first_line;
        } else {
            tag = '';
        }
        return tag;
    },

    setInput: function(tokens) {
        this.tokens = tokens;
        this.pos = 0;
        return this.pos;
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


exports.tokenize = function (data) {
    return lexer.tokenize(data);
};

exports.parse = function (tokenized) {
    return parser.parse(tokenized);
};

exports.compile = function (data) {
    var scope = new Scope(null);
    scope.add("console"); // add global variables
    scope.add("require");
    scope.add("exports");
    scope.add("process");
    scope.add("document");
    scope.add("window");
    scope.add("setInterval");
    scope.add("clearInterval");
    scope.add("Math");
    scope.add("Image");

    var tokenized = lexer.tokenize(data);
    var parsed = parser.parse(tokenized);

    return parsed.nodes.compile(scope, "");
};

}(this));

