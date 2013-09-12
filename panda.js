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

parser.yy.parseError = function(message, _arg) {
    var token;
    token = _arg.token;
    message = "unexpected " + (token === 1 ? 'end of input' : token);
    throw new SyntaxError(message);
};


var pandaCode = [
'def test():',
'   in_block(1)',
'   another_thing("string")',
'   if 5 >= 4:',
'       do_stuff()',
'       stuff = true',
'   end',
'end'
].join('\n');

var tokenized = lexer.tokenize(pandaCode);

console.log(tokenized);

parser.parse(tokenized);
