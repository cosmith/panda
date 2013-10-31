var fs = require('fs'); // file system

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
            this.yylineno = 0;//this.yylloc.first_line;
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


/**
 * Main runtime here
 */
var path = "";

// get file path
process.argv.forEach(function(val, index, array) {
    if (index === 2) path = val;
});

fs.readFile(path, 'utf-8', function (err, data) {
    if (err) throw err;

    var tokenized = lexer.tokenize(data);
    printTokens(tokenized);

    var parsed = parser.parse(tokenized);
    printAst(parsed);

    var scope = new Scope(null);
    scope.add("console"); // add global variables
    scope.add("require");
    var compiled = parsed.nodes.compile(scope, "");

    log("\n\nOutput");
    log("======\n");
    log(compiled);
    log("======\n");

    eval(compiled);
});



///////////////////////////////////////
// helpers
///////////////////////////////////////
var log = console.log;

function printTokens(tokens, full) {
    log('\nLexed input');
    log('===========\n');

    if (full) {
        log(tokens);
        return;
    }

    var cleaned = [],
        i;

    for (i = 0; i < tokens.length; i++) {
        cleaned.push(tokens[i].slice(0, 2).join(': '));
    }
    log(cleaned.join('\n'));
}


function printAst(ast) {
    log('\nParsed input');
    log('============\n');
    log(strAst(ast, 0).join('\n'));
}


function strAst(ast, indent) {
    var collection = [],
        index = 0,
        next,
        key;

    var dontShow = ["source", "start", "end", "push", "loc", "addNode", "compile"];

    for (key in ast) {
        if (ast.hasOwnProperty(key) && (dontShow.indexOf(key) === -1)) {
            next = ast[key];
            if (typeof next === 'object' && next !== null) {
                collection[index] = spaces(indent) + key +
                 ': {\n' + strAst(next, indent+1).join(',\n') +
                 ' \n' + spaces(indent) + '}';
            }
            else {
                collection[index] = [spaces(indent) + key + ': ' + String(next)];
            }
            index++;
        }
    }

    return collection;
}

function spaces(i) {
    return Array(i+1).join('    ');
}