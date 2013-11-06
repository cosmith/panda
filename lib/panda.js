(function(root) {
var Panda = function() {
   function require(path){ return require[path]; }


require['./scope'] = (function() {
var exports = {}, module = {exports: exports};
// Heavily inspired by coffee-script again
(function() {

var Scope;

exports.Scope = Scope = (function () {
    Scope.root = null;

    function Scope(parent) {
        this.parent = parent;

        if (!this.parent) {
            Scope.root = this;
        }

        // where we keep the variables names for this scope
        this.variables = {};
    }

    // add a variable to the scope
    Scope.prototype.add = function (name) {
        if (this.variables[name]) {
            throw "Error: Variable '" + name + "' already defined";
        }

        this.variables[name] = true;
    };

    // check the existence of a variable in this scope or any parent
    Scope.prototype.alreadyDefined = function (name) {
        return !!this.variables[name] || (this.parent && this.parent.alreadyDefined(name));
    };

    // generate a temporary variable name
    Scope.prototype.temporary = function (name, index) {
        return '_' + name + index;
    };

    // create a temporary variable with an available name
    Scope.prototype.addTempVar = function (name, reserve) {
        var index = 0,
            newName = name;

        while (this.alreadyDefined(newName)) {
            index++;
            newName = this.temporary(name, index);
        }

        if (reserve) {
            this.add(newName);
        }

        return newName;
    };

    return Scope;
}());

}(this));



    return module.exports; 
})();


require['./nodes'] = (function() {
var exports = {}, module = {exports: exports};
(function() {

var Scope = require('./scope').Scope;
var TAB = "    ";

// Our root node, containing all the representation of the program
exports.Nodes = function (nodes, loc) {
    var self = this;

    self.type = "root";
    self.nodes = nodes;
    self.loc = loc;

    self.addNode = function (node) {
        if (!nodes) {
            self.nodes = [];
        }
        self.nodes.push(node);
        return self;
    };

    self.compile = function (scope, indent) {
        var code = "",
            node,
            i;

        for (i = 0; i < self.nodes.length; i++) {
            node = self.nodes[i];

            code += node.compile(scope, indent);
            if (!(["comment", "if", "for", "emptyline"].indexOf(node.type) > -1)) {
                code += ";";
            }
            code += "\n";
        }

        return code;
    };
};

// Comments are copied in the output
exports.CommentNode = function (value, loc) {
    var self = this;

    self.type = "comment";
    self.value = value;
    self.loc = loc;

    self.compile = function (scope, indent) {
        return indent + '//' + String(value);
    };
};

// Empty lines too to preserve legibility
exports.EmptyLineNode = function (loc) {
    var self = this;

    self.type = "emptyline";
    self.loc = loc;

    self.compile = function (scope, indent) {
        return "";
    };
};

// Literal nodes that translate directly to javascript
exports.NumberNode = function (value, loc) {
    var self = this;

    self.type = "number";
    self.value = value;
    self.loc = loc;

    self.compile = function (scope, indent) {
        return indent + value;
    };
};

exports.StringNode = function (value, loc) {
    var self = this;

    self.type = "string";
    self.value = value;
    self.loc = loc;

    self.compile = function (scope, indent) {
        value = self.value.replace(/"/g, "\"");

        return indent + '"' + value + '"';
    };
};

exports.BooleanNode = function (value, loc) {
    var self = this;

    self.type = "boolean";
    self.value = Boolean(value);
    self.loc = loc;

    self.compile = function (scope, indent) {
        return indent + self.value;
    };
};

exports.NoneNode = function (loc) {
    var self = this;

    self.type = "none";
    self.value = null;
    self.loc = loc;

    self.compile = function (scope, indent) {
        return indent + "null";
    };
};

exports.ListNode = function (list, loc) {
    var self = this;

    self.type = "list";
    self.list = list;
    self.loc = loc;

    self.compile = function (scope, indent) {
        var code = "[",
            i;

        for (i = 0; i < self.list.length; i++) {
            code += self.list[i].compile(scope, '');
            if (i !== self.list.length - 1) {
                code += ", ";
            }
        }

        return code + "]";
    };
};

exports.RangeNode = function (start, end, numbers, loc) {
    var self = this;

    self.type = "range";
    self.start = start;
    self.end = end;
    self.numbers = numbers;
    self.loc = loc;

    self.compile = function (scope, indent) {
        var code = "(function () {\n",
            a = scope.addTempVar('a'),
            i = scope.addTempVar('i'),
            idt2 = indent + TAB,
            goingUp = null,
            direction,
            condition,
            startVal,
            endVal;

        if (self.numbers) {
            goingUp = self.start < self.end;
            startVal = self.start;
            endVal = self.end;
        }
        else {
            startVal = self.start.compile(scope, '');
            endVal = self.end.compile(scope, '');
        }

        if (goingUp === null) {
            condition = startVal + " < " + endVal + " ? ";
            condition += i + " <= " + endVal + " : " + i + " >= " + endVal;

            direction = startVal + " <= " + endVal;
            direction += " ? " + i + "++ : " + i + "--";
        }
        else {
            condition = i + (goingUp ? " <= " : " >= ") + endVal;

            direction = i + (goingUp ? "++" : "--");
        }

        code += idt2 + "var " + a + " = [];\n";
        code += idt2 + "for (var " + i + " = " + startVal + "; ";
        code += condition;

        code += "; " + direction + ") { " + a + ".push(" + i + ") }\n";
        code += idt2 + "return " + a + ";\n";
        code += indent + "})()";

        return indent + code;
    };
};

exports.OperatorNode = function (op, expr1, expr2, loc) {
    var self = this;

    self.type = "operator";
    self.op = op;
    self.expr1 = expr1;
    self.expr2 = expr2;

    self.compile = function (scope, indent) {
        var jsOps = ['+', '-', '*', '/', '+=', '-=', '*=', '/='],
            translation = {
                'OR': '||',
                'AND': '&&'
            },
            code = '';

        if (jsOps.indexOf(self.op) !== -1) {
            code = [self.expr1.compile(scope, ''), self.op, self.expr2.compile(scope, '')].join(' ');
        }
        else if (translation.hasOwnProperty(self.op)) {
            code = [
                self.expr1.compile(scope, ''), translation[self.op], self.expr2.compile(scope, '')
            ].join(' ');
        }
        else {
            throw self.op + " not implemented yet";
        }

        return indent + '(' + code + ')';
    };
};

exports.ComparisonNode = function (op, expr1, expr2, loc) {
    var self = this;

    self.type = "comparison";
    self.oplist = [op];
    self.exprlist = [expr1, expr2];

    self.addComparison = function (op, expr) {
        // we're concatenating backwards, starting from the right
        self.oplist = [op].concat(self.oplist);
        self.exprlist = [expr].concat(self.exprlist);

        return self;
    }

    self.compile = function (scope, indent) {
        var code = indent,
            op = '',
            i = 0;

        code += self.exprlist[0].compile(scope, '');;
        code += ' ' + self.oplist[0];

        for (i = 1; i < self.oplist.length; i++) {
            op = self.oplist[i];
            if (op === '==') op = '===';
            if (op === '!=') op = '!==';

            code += ' ' + self.exprlist[i].compile(scope, '')
            code += ' && ';
            code += self.exprlist[i].compile(scope, '') + ' ' + op;
        }

        code += ' ' + self.exprlist[self.exprlist.length - 1].compile(scope, '');

        return code;
    }
}

exports.UnaryNode = function (op, arg, loc) {
    var self = this;

    self.type = "unary";
    self.op = op;
    self.arg = arg;

    self.compile = function (scope, indent) {
        var jsOps = ['-'],
            translation = {
                'NOT': '!'
            },
            code = '';

        if (jsOps.indexOf(self.op) !== -1) {
            code = self.op + '(' + self.arg.compile(scope, '') + ')';
        }
        else if (translation.hasOwnProperty(self.op)) {
            code = translation[self.op] + '(' + self.arg.compile(scope, '') + ')';
        }
        else {
            throw "Not implemented yet";
        }

        return code;
    };
};

// method call
exports.CallNode = function (receiver, method, args, loc) {
    var self = this;

    self.type = "call";
    self.receiver = receiver;
    self.method = method;
    self.args = args;
    self.loc = loc;

    self.compile = function (scope, indent) {
        var code = "",
            argsList = [],
            i;

        // compile the arguments first
        for (i = 0; i < self.args.length; i++) {
            argsList.push(self.args[i].compile(scope, ''));
        }

        // methods that don't have a receiver are declared on the global context
        code = self.receiver ? self.receiver.compile(scope, '') + "." : "";
        code += self.method + "(" + argsList.join(', ') + ")";

        return indent + code;
    };
};

// local variables
exports.GetLocalNode = function (name, loc) {
    var self = this;

    self.type = "getlocal";
    self.name = name;
    self.loc = loc;

    self.compile = function (scope, indent) {
        if (!scope.alreadyDefined(self.name)) {
            throw "Error: variable '" + self.name + "' not defined.";
        }
        return indent + self.name;
    };
};

exports.DefLocalNode = function (name, value, loc) {
    var self = this;

    self.type = "deflocal";
    self.name = name;
    self.value = value;
    self.loc = loc;

    self.compile = function (scope, indent) {
        var code = "var ";

        scope.add(self.name);
        code += self.name + " = " + self.value.compile(scope, '');

        return indent + code;
    };
};

exports.SetLocalNode = function (name, value, loc) {
    var self = this;

    self.type = "setlocal";
    self.name = name;
    self.value = value;
    self.loc = loc;

    self.compile = function (scope, indent) {
        var code = self.name + " = ";
        if (!scope.alreadyDefined(self.name)) {
            throw "Error: variable '" + self.name + "' not defined.";
        }
        code += self.value.compile(scope, '');

        return indent + code;
    };
};

// function definition
exports.DefNode = function (name, params, body, loc) {
    var self = this;

    self.type = "def";
    self.name = name;
    self.params = params;
    self.body = body;
    self.loc = loc;

    self.compile = function (scope, indent) {
        var code = indent,
        i;

        if (self.name !== null) {
            // add the name of the function to the external scope
            scope.add(self.name);
            code += "var " + self.name + " = ";
        }

        // create the internal scope
        scope = new Scope(scope);
        // add the parameters to the function scope
        for (i = 0; i < self.params.length; i++) {
            scope.add(self.params[i]);
        }

        code += "function (";
        code += self.params.join(", ") + ") {";
        if (self.body.hasOwnProperty('compile')) {
            code += "\n" + self.body.compile(scope, indent + TAB);
        }
        code += indent + "}";

        if (self.name !== null) return code;
        else return '(' + code + ')';
    };
};

exports.ReturnNode = function (value, loc) {
    var self = this;

    self.type = "return";
    self.value = value;
    self.loc = loc;

    self.compile = function (scope, indent) {
        var code = "return ";
        code += self.value.compile(scope, '');

        return indent + code;
    };
};

// if - else
exports.IfNode = function (condition, body, loc) {
    var self = this;

    self.type = "if";
    self.ifBlocks = [{
        'cond': condition,
        'body': body,
        'finalElse': false
    }];
    self.loc = loc;

    self.addElse = function (condition, body, isFinalElse) {
        self.ifBlocks.push({
            'cond': condition,
            'body': body,
            'finalElse': isFinalElse
        });

        return self;
    };

    self.compile = function (scope, indent) {
        var code = indent + "if (",
            ifBlock,
            i;

        // first if statement
        code += self.ifBlocks[0].cond.compile(scope, '') + ") {\n";
        code += self.ifBlocks[0].body.compile(scope, indent + TAB);
        code += indent + "}";

        // following else ifs / else
        for (i = 1; i < self.ifBlocks.length; i++) {
            ifBlock = self.ifBlocks[i];

            if (ifBlock.finalElse) {
                code += "\n" + indent + "else {\n";
                code += ifBlock.body.compile(scope, indent + TAB);
            }
            else {
                code += "\n" + indent + "else if (";
                code += ifBlock.cond.compile(scope, '') + ") {\n";
                code += ifBlock.body.compile(scope, indent + TAB);
            }
            code += indent + "}";
        }

        return code;
    };
};

// for loop
exports.ForNode = function (variable, items, body, loc) {
    var self = this;

    self.type = "for";
    self.variable = variable;
    self.items = items;
    self.body = body;
    self.loc = loc;

    self.compile = function (scope, indent) {
        var k,
            things,
            code = "";

        if (!scope.alreadyDefined(self.variable)) {
            scope.add(self.variable);
            code += indent + "var " + self.variable + ";\n";
        }

        things = self.items.compile(scope, '');

        // iteration
        k = scope.addTempVar("k");
        code += indent + "for (var " + k + " = 0; ";
        code += k + " < " + things + ".length; " + k + " += 1) {\n";

        // body
        code += indent + TAB + self.variable + " = " + things + "[" + k + "];\n";
        code += self.body.compile(scope, indent + TAB);

        code += indent + "}";

        return code;
    };
};


exports.AccessorNode = function (accessed, item, loc) {
    var self = this;

    self.type = "accessor";
    self.accessed = accessed;
    self.item = item;
    self.loc = loc;

    self.compile = function (scope, indent) {
        var code;

        code = indent + self.accessed.compile(scope, '');
        code += '[' + self.item.compile(scope, '') + ']';

        return code;
    };
};


}(this));


    return module.exports; 
})();


require['./grammar'] = (function() {
var exports = {}, module = {exports: exports};
/* parser generated by jison 0.4.13 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var grammar = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"Root":3,"Expressions":4,"Expression":5,"Terminator":6,"NEWLINE":7,"Literal":8,"List":9,"Range":10,"Call":11,"Operator":12,"Comparison":13,"GetConstant":14,"SetConstant":15,"DefLocal":16,"SetLocal":17,"GetLocal":18,"Def":19,"Return":20,"If":21,"For":22,"Accessor":23,"(":24,")":25,"NUMBER":26,"STRING":27,"TRUE":28,"FALSE":29,"NONE":30,"COMMENT":31,"EMPTYLINE":32,"[":33,".":34,"]":35,"IDENTIFIER":36,"Arguments":37,"ExpressionList":38,",":39,"+":40,"-":41,"*":42,"/":43,"+=":44,"-=":45,"*=":46,"/=":47,"OR":48,"AND":49,"NOT":50,"ComparisonOperator":51,"==":52,"!=":53,"<":54,">":55,"<=":56,">=":57,"VAR":58,"=":59,"Block":60,"START_BLOCK":61,"END_BLOCK":62,"DEF":63,"ParamList":64,"RETURN":65,"IfBlock":66,"IF":67,"ELSE":68,"FOR":69,"IN":70,"$accept":0,"$end":1},
terminals_: {2:"error",7:"NEWLINE",14:"GetConstant",15:"SetConstant",24:"(",25:")",26:"NUMBER",27:"STRING",28:"TRUE",29:"FALSE",30:"NONE",31:"COMMENT",32:"EMPTYLINE",33:"[",34:".",35:"]",36:"IDENTIFIER",39:",",40:"+",41:"-",42:"*",43:"/",44:"+=",45:"-=",46:"*=",47:"/=",48:"OR",49:"AND",50:"NOT",52:"==",53:"!=",54:"<",55:">",56:"<=",57:">=",58:"VAR",59:"=",61:"START_BLOCK",62:"END_BLOCK",63:"DEF",65:"RETURN",67:"IF",68:"ELSE",69:"FOR",70:"IN"},
productions_: [0,[3,0],[3,1],[4,1],[4,3],[4,2],[4,2],[4,1],[6,1],[5,1],[5,1],[5,1],[5,1],[5,1],[5,1],[5,1],[5,1],[5,1],[5,1],[5,1],[5,1],[5,1],[5,1],[5,1],[5,1],[5,3],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[8,1],[10,6],[10,6],[11,2],[11,4],[37,2],[37,3],[9,2],[9,3],[38,1],[38,3],[12,3],[12,3],[12,3],[12,3],[12,3],[12,3],[12,3],[12,3],[12,3],[12,3],[12,2],[12,2],[51,1],[51,1],[51,1],[51,1],[51,1],[51,1],[13,3],[13,3],[16,4],[17,3],[18,1],[60,2],[60,3],[19,6],[19,5],[64,0],[64,1],[64,3],[20,2],[66,3],[66,5],[21,1],[21,3],[22,5],[23,4]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:
            this.$ = new n.Nodes(null, createLoc(_$[$0], _$[$0]));
        
break;
case 2:
            this.$ = new n.Nodes($$[$0], createLoc(_$[$0], _$[$0]));
            return this.$;
        
break;
case 3:
            this.$ = new n.Nodes([$$[$0]], createLoc(_$[$0], _$[$0]));
        
break;
case 4:
            this.$ = $$[$0-2].addNode($$[$0]);
        
break;
case 5:
            this.$ = $$[$0-1];
        
break;
case 6:
            this.$ = $$[$0];
        
break;
case 7:
            this.$ = [];
        
break;
case 25:
            this.$ = $$[$0-1];
        
break;
case 26:
            this.$ = new n.NumberNode($$[$0], createLoc(_$[$0], _$[$0]));
        
break;
case 27:
            this.$ = new n.StringNode($$[$0], createLoc(_$[$0], _$[$0]));
        
break;
case 28:
            this.$ = new n.BooleanNode(true, createLoc(_$[$0], _$[$0]));
        
break;
case 29:
            this.$ = new n.BooleanNode(false, createLoc(_$[$0], _$[$0]));
        
break;
case 30:
            this.$ = new n.NoneNode($$[$0], createLoc(_$[$0], _$[$0]));
        
break;
case 31:
            this.$ = new n.CommentNode($$[$0], createLoc(_$[$0], _$[$0]));
        
break;
case 32:
            this.$ = new n.EmptyLineNode(createLoc(_$[$0], _$[$0]));
        
break;
case 33:
            this.$ = new n.RangeNode($$[$0-4], $$[$0-1], true, createLoc(_$[$0-5], _$[$0]));
        
break;
case 34:
            this.$ = new n.RangeNode($$[$0-4], $$[$0-1], false, createLoc(_$[$0-5], _$[$0]));
        
break;
case 35:
            this.$ = new n.CallNode(null, $$[$0-1], $$[$0], createLoc(_$[$0-1], _$[$0]));
        
break;
case 36:
            this.$ = new n.CallNode($$[$0-3], $$[$0-1], $$[$0], createLoc(_$[$0-3], _$[$0]));
        
break;
case 37:
            this.$ = [];
        
break;
case 38:
            this.$ = $$[$0-1];
        
break;
case 39:
            this.$ = new n.ListNode([], createLoc(_$[$0-1], _$[$0]));
        
break;
case 40:
            this.$ = new n.ListNode($$[$0-1], createLoc(_$[$0-2], _$[$0]));
        
break;
case 41:
            this.$ = [$$[$0]];
        
break;
case 42:
            this.$ = $$[$0-2].concat($$[$0]);
        
break;
case 43:
            this.$ = new n.OperatorNode('+', $$[$0-2], $$[$0], createLoc(_$[$0-2], _$[$0]));
        
break;
case 44:
            this.$ = new n.OperatorNode('-', $$[$0-2], $$[$0], createLoc(_$[$0-2], _$[$0]));
        
break;
case 45:
            this.$ = new n.OperatorNode('*', $$[$0-2], $$[$0], createLoc(_$[$0-2], _$[$0]));
        
break;
case 46:
            this.$ = new n.OperatorNode('/', $$[$0-2], $$[$0], createLoc(_$[$0-2], _$[$0]));
        
break;
case 47:
            this.$ = new n.OperatorNode('+=', $$[$0-2], $$[$0], createLoc(_$[$0-2], _$[$0]));
        
break;
case 48:
            this.$ = new n.OperatorNode('-=', $$[$0-2], $$[$0], createLoc(_$[$0-2], _$[$0]));
        
break;
case 49:
            this.$ = new n.OperatorNode('*=', $$[$0-2], $$[$0], createLoc(_$[$0-2], _$[$0]));
        
break;
case 50:
            this.$ = new n.OperatorNode('/=', $$[$0-2], $$[$0], createLoc(_$[$0-2], _$[$0]));
        
break;
case 51:
            this.$ = new n.OperatorNode('OR', $$[$0-2], $$[$0], createLoc(_$[$0-2], _$[$0]));
        
break;
case 52:
            this.$ = new n.OperatorNode('AND', $$[$0-2], $$[$0], createLoc(_$[$0-2], _$[$0]));
        
break;
case 53:
            this.$ = new n.UnaryNode('NOT', $$[$0], createLoc(_$[$0-1], _$[$0]));
        
break;
case 54:
            this.$ = new n.UnaryNode('-', $$[$0], createLoc(_$[$0-1], _$[$0]));
        
break;
case 61:
            this.$ = new n.ComparisonNode($$[$0-1], $$[$0-2], $$[$0], createLoc(_$[$0-2], _$[$0]));
        
break;
case 62:
            // I can only make it work with a Comparison on the right, not sure why...
            this.$ = $$[$0].addComparison($$[$0-1], $$[$0-2]);
        
break;
case 63:
            this.$ = new n.DefLocalNode($$[$0-2], $$[$0], createLoc(_$[$0-3], _$[$0-1]));
        
break;
case 64:
            this.$ = new n.SetLocalNode($$[$0-2], $$[$0], createLoc(_$[$0-2], _$[$0]));
        
break;
case 65:
            this.$ = new n.GetLocalNode($$[$0], createLoc(_$[$0], _$[$0]));
        
break;
case 66:
            this.$ = [];
        
break;
case 67:
            this.$ = $$[$0-1];
        
break;
case 68:
            this.$ = new n.DefNode($$[$0-4], $$[$0-2], $$[$0], createLoc(_$[$0-5], _$[$0]));
        
break;
case 69:
            this.$ = new n.DefNode(null, $$[$0-2], $$[$0], createLoc(_$[$0-4], _$[$0]));
        
break;
case 70:
            this.$ = [];
        
break;
case 71:
            this.$ = [$$[$0]];
        
break;
case 72:
            this.$ = $$[$0-2].concat($$[$0]);
        
break;
case 73:
            this.$ = new n.ReturnNode($$[$0], createLoc(_$[$0-1], _$[$0]));
        
break;
case 74:
            this.$ = new n.IfNode($$[$0-1], $$[$0], createLoc(_$[$0-2], _$[$0]));
        
break;
case 75:
            this.$ = $$[$0-4].addElse($$[$0-1], $$[$0], false);
        
break;
case 77:
            this.$ = $$[$0-2].addElse(null, $$[$0], true);
        
break;
case 78:
            this.$ = new n.ForNode($$[$0-3], $$[$0-1], $$[$0], createLoc(_$[$0-4], _$[$0-1]));
        
break;
case 79:
            this.$ = new n.AccessorNode($$[$0-3], $$[$0-1], createLoc(_$[$0-3], _$[$0]));
        
break;
}
},
table: [{1:[2,1],3:1,4:2,5:3,6:4,7:[1,22],8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{1:[3]},{1:[2,2],6:40,7:[1,22]},{1:[2,3],7:[2,3],33:[1,53],34:[1,41],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],62:[2,3]},{1:[2,7],4:60,5:3,6:4,7:[1,22],8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],62:[2,7],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{1:[2,9],7:[2,9],25:[2,9],33:[2,9],34:[2,9],35:[2,9],39:[2,9],40:[2,9],41:[2,9],42:[2,9],43:[2,9],44:[2,9],45:[2,9],46:[2,9],47:[2,9],48:[2,9],49:[2,9],52:[2,9],53:[2,9],54:[2,9],55:[2,9],56:[2,9],57:[2,9],61:[2,9],62:[2,9]},{1:[2,10],7:[2,10],25:[2,10],33:[2,10],34:[2,10],35:[2,10],39:[2,10],40:[2,10],41:[2,10],42:[2,10],43:[2,10],44:[2,10],45:[2,10],46:[2,10],47:[2,10],48:[2,10],49:[2,10],52:[2,10],53:[2,10],54:[2,10],55:[2,10],56:[2,10],57:[2,10],61:[2,10],62:[2,10]},{1:[2,11],7:[2,11],25:[2,11],33:[2,11],34:[2,11],35:[2,11],39:[2,11],40:[2,11],41:[2,11],42:[2,11],43:[2,11],44:[2,11],45:[2,11],46:[2,11],47:[2,11],48:[2,11],49:[2,11],52:[2,11],53:[2,11],54:[2,11],55:[2,11],56:[2,11],57:[2,11],61:[2,11],62:[2,11]},{1:[2,12],7:[2,12],25:[2,12],33:[2,12],34:[2,12],35:[2,12],39:[2,12],40:[2,12],41:[2,12],42:[2,12],43:[2,12],44:[2,12],45:[2,12],46:[2,12],47:[2,12],48:[2,12],49:[2,12],52:[2,12],53:[2,12],54:[2,12],55:[2,12],56:[2,12],57:[2,12],61:[2,12],62:[2,12]},{1:[2,13],7:[2,13],25:[2,13],33:[2,13],34:[2,13],35:[2,13],39:[2,13],40:[2,13],41:[2,13],42:[2,13],43:[2,13],44:[2,13],45:[2,13],46:[2,13],47:[2,13],48:[2,13],49:[2,13],52:[2,13],53:[2,13],54:[2,13],55:[2,13],56:[2,13],57:[2,13],61:[2,13],62:[2,13]},{1:[2,14],7:[2,14],25:[2,14],33:[2,14],34:[2,14],35:[2,14],39:[2,14],40:[2,14],41:[2,14],42:[2,14],43:[2,14],44:[2,14],45:[2,14],46:[2,14],47:[2,14],48:[2,14],49:[2,14],52:[2,14],53:[2,14],54:[2,14],55:[2,14],56:[2,14],57:[2,14],61:[2,14],62:[2,14]},{1:[2,15],7:[2,15],25:[2,15],33:[2,15],34:[2,15],35:[2,15],39:[2,15],40:[2,15],41:[2,15],42:[2,15],43:[2,15],44:[2,15],45:[2,15],46:[2,15],47:[2,15],48:[2,15],49:[2,15],52:[2,15],53:[2,15],54:[2,15],55:[2,15],56:[2,15],57:[2,15],61:[2,15],62:[2,15]},{1:[2,16],7:[2,16],25:[2,16],33:[2,16],34:[2,16],35:[2,16],39:[2,16],40:[2,16],41:[2,16],42:[2,16],43:[2,16],44:[2,16],45:[2,16],46:[2,16],47:[2,16],48:[2,16],49:[2,16],52:[2,16],53:[2,16],54:[2,16],55:[2,16],56:[2,16],57:[2,16],61:[2,16],62:[2,16]},{1:[2,17],7:[2,17],25:[2,17],33:[2,17],34:[2,17],35:[2,17],39:[2,17],40:[2,17],41:[2,17],42:[2,17],43:[2,17],44:[2,17],45:[2,17],46:[2,17],47:[2,17],48:[2,17],49:[2,17],52:[2,17],53:[2,17],54:[2,17],55:[2,17],56:[2,17],57:[2,17],61:[2,17],62:[2,17]},{1:[2,18],7:[2,18],25:[2,18],33:[2,18],34:[2,18],35:[2,18],39:[2,18],40:[2,18],41:[2,18],42:[2,18],43:[2,18],44:[2,18],45:[2,18],46:[2,18],47:[2,18],48:[2,18],49:[2,18],52:[2,18],53:[2,18],54:[2,18],55:[2,18],56:[2,18],57:[2,18],61:[2,18],62:[2,18]},{1:[2,19],7:[2,19],25:[2,19],33:[2,19],34:[2,19],35:[2,19],39:[2,19],40:[2,19],41:[2,19],42:[2,19],43:[2,19],44:[2,19],45:[2,19],46:[2,19],47:[2,19],48:[2,19],49:[2,19],52:[2,19],53:[2,19],54:[2,19],55:[2,19],56:[2,19],57:[2,19],61:[2,19],62:[2,19]},{1:[2,20],7:[2,20],25:[2,20],33:[2,20],34:[2,20],35:[2,20],39:[2,20],40:[2,20],41:[2,20],42:[2,20],43:[2,20],44:[2,20],45:[2,20],46:[2,20],47:[2,20],48:[2,20],49:[2,20],52:[2,20],53:[2,20],54:[2,20],55:[2,20],56:[2,20],57:[2,20],61:[2,20],62:[2,20]},{1:[2,21],7:[2,21],25:[2,21],33:[2,21],34:[2,21],35:[2,21],39:[2,21],40:[2,21],41:[2,21],42:[2,21],43:[2,21],44:[2,21],45:[2,21],46:[2,21],47:[2,21],48:[2,21],49:[2,21],52:[2,21],53:[2,21],54:[2,21],55:[2,21],56:[2,21],57:[2,21],61:[2,21],62:[2,21]},{1:[2,22],7:[2,22],25:[2,22],33:[2,22],34:[2,22],35:[2,22],39:[2,22],40:[2,22],41:[2,22],42:[2,22],43:[2,22],44:[2,22],45:[2,22],46:[2,22],47:[2,22],48:[2,22],49:[2,22],52:[2,22],53:[2,22],54:[2,22],55:[2,22],56:[2,22],57:[2,22],61:[2,22],62:[2,22]},{1:[2,23],7:[2,23],25:[2,23],33:[2,23],34:[2,23],35:[2,23],39:[2,23],40:[2,23],41:[2,23],42:[2,23],43:[2,23],44:[2,23],45:[2,23],46:[2,23],47:[2,23],48:[2,23],49:[2,23],52:[2,23],53:[2,23],54:[2,23],55:[2,23],56:[2,23],57:[2,23],61:[2,23],62:[2,23]},{1:[2,24],7:[2,24],25:[2,24],33:[2,24],34:[2,24],35:[2,24],39:[2,24],40:[2,24],41:[2,24],42:[2,24],43:[2,24],44:[2,24],45:[2,24],46:[2,24],47:[2,24],48:[2,24],49:[2,24],52:[2,24],53:[2,24],54:[2,24],55:[2,24],56:[2,24],57:[2,24],61:[2,24],62:[2,24]},{5:61,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{1:[2,8],7:[2,8],14:[2,8],15:[2,8],24:[2,8],26:[2,8],27:[2,8],28:[2,8],29:[2,8],30:[2,8],31:[2,8],32:[2,8],33:[2,8],36:[2,8],41:[2,8],50:[2,8],58:[2,8],62:[2,8],63:[2,8],65:[2,8],67:[2,8],69:[2,8]},{1:[2,26],7:[2,26],25:[2,26],33:[2,26],34:[2,26],35:[2,26],39:[2,26],40:[2,26],41:[2,26],42:[2,26],43:[2,26],44:[2,26],45:[2,26],46:[2,26],47:[2,26],48:[2,26],49:[2,26],52:[2,26],53:[2,26],54:[2,26],55:[2,26],56:[2,26],57:[2,26],61:[2,26],62:[2,26]},{1:[2,27],7:[2,27],25:[2,27],33:[2,27],34:[2,27],35:[2,27],39:[2,27],40:[2,27],41:[2,27],42:[2,27],43:[2,27],44:[2,27],45:[2,27],46:[2,27],47:[2,27],48:[2,27],49:[2,27],52:[2,27],53:[2,27],54:[2,27],55:[2,27],56:[2,27],57:[2,27],61:[2,27],62:[2,27]},{1:[2,28],7:[2,28],25:[2,28],33:[2,28],34:[2,28],35:[2,28],39:[2,28],40:[2,28],41:[2,28],42:[2,28],43:[2,28],44:[2,28],45:[2,28],46:[2,28],47:[2,28],48:[2,28],49:[2,28],52:[2,28],53:[2,28],54:[2,28],55:[2,28],56:[2,28],57:[2,28],61:[2,28],62:[2,28]},{1:[2,29],7:[2,29],25:[2,29],33:[2,29],34:[2,29],35:[2,29],39:[2,29],40:[2,29],41:[2,29],42:[2,29],43:[2,29],44:[2,29],45:[2,29],46:[2,29],47:[2,29],48:[2,29],49:[2,29],52:[2,29],53:[2,29],54:[2,29],55:[2,29],56:[2,29],57:[2,29],61:[2,29],62:[2,29]},{1:[2,30],7:[2,30],25:[2,30],33:[2,30],34:[2,30],35:[2,30],39:[2,30],40:[2,30],41:[2,30],42:[2,30],43:[2,30],44:[2,30],45:[2,30],46:[2,30],47:[2,30],48:[2,30],49:[2,30],52:[2,30],53:[2,30],54:[2,30],55:[2,30],56:[2,30],57:[2,30],61:[2,30],62:[2,30]},{1:[2,31],7:[2,31],25:[2,31],33:[2,31],34:[2,31],35:[2,31],39:[2,31],40:[2,31],41:[2,31],42:[2,31],43:[2,31],44:[2,31],45:[2,31],46:[2,31],47:[2,31],48:[2,31],49:[2,31],52:[2,31],53:[2,31],54:[2,31],55:[2,31],56:[2,31],57:[2,31],61:[2,31],62:[2,31]},{1:[2,32],7:[2,32],25:[2,32],33:[2,32],34:[2,32],35:[2,32],39:[2,32],40:[2,32],41:[2,32],42:[2,32],43:[2,32],44:[2,32],45:[2,32],46:[2,32],47:[2,32],48:[2,32],49:[2,32],52:[2,32],53:[2,32],54:[2,32],55:[2,32],56:[2,32],57:[2,32],61:[2,32],62:[2,32]},{5:65,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,64],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],35:[1,62],36:[1,31],38:63,41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{1:[2,65],7:[2,65],24:[1,68],25:[2,65],33:[2,65],34:[2,65],35:[2,65],37:66,39:[2,65],40:[2,65],41:[2,65],42:[2,65],43:[2,65],44:[2,65],45:[2,65],46:[2,65],47:[2,65],48:[2,65],49:[2,65],52:[2,65],53:[2,65],54:[2,65],55:[2,65],56:[2,65],57:[2,65],59:[1,67],61:[2,65],62:[2,65]},{5:69,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:70,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{36:[1,71]},{24:[1,73],36:[1,72]},{5:74,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{1:[2,76],7:[2,76],25:[2,76],33:[2,76],34:[2,76],35:[2,76],39:[2,76],40:[2,76],41:[2,76],42:[2,76],43:[2,76],44:[2,76],45:[2,76],46:[2,76],47:[2,76],48:[2,76],49:[2,76],52:[2,76],53:[2,76],54:[2,76],55:[2,76],56:[2,76],57:[2,76],61:[2,76],62:[2,76],68:[1,75]},{36:[1,76]},{5:77,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{1:[2,5],5:78,7:[2,5],8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],62:[2,5],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{36:[1,79]},{5:80,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:81,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:82,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:83,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:84,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:85,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:86,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:87,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:88,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:89,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:90,8:5,9:6,10:7,11:8,12:9,13:91,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:92,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{14:[2,55],15:[2,55],24:[2,55],26:[2,55],27:[2,55],28:[2,55],29:[2,55],30:[2,55],31:[2,55],32:[2,55],33:[2,55],36:[2,55],41:[2,55],50:[2,55],58:[2,55],63:[2,55],65:[2,55],67:[2,55],69:[2,55]},{14:[2,56],15:[2,56],24:[2,56],26:[2,56],27:[2,56],28:[2,56],29:[2,56],30:[2,56],31:[2,56],32:[2,56],33:[2,56],36:[2,56],41:[2,56],50:[2,56],58:[2,56],63:[2,56],65:[2,56],67:[2,56],69:[2,56]},{14:[2,57],15:[2,57],24:[2,57],26:[2,57],27:[2,57],28:[2,57],29:[2,57],30:[2,57],31:[2,57],32:[2,57],33:[2,57],36:[2,57],41:[2,57],50:[2,57],58:[2,57],63:[2,57],65:[2,57],67:[2,57],69:[2,57]},{14:[2,58],15:[2,58],24:[2,58],26:[2,58],27:[2,58],28:[2,58],29:[2,58],30:[2,58],31:[2,58],32:[2,58],33:[2,58],36:[2,58],41:[2,58],50:[2,58],58:[2,58],63:[2,58],65:[2,58],67:[2,58],69:[2,58]},{14:[2,59],15:[2,59],24:[2,59],26:[2,59],27:[2,59],28:[2,59],29:[2,59],30:[2,59],31:[2,59],32:[2,59],33:[2,59],36:[2,59],41:[2,59],50:[2,59],58:[2,59],63:[2,59],65:[2,59],67:[2,59],69:[2,59]},{14:[2,60],15:[2,60],24:[2,60],26:[2,60],27:[2,60],28:[2,60],29:[2,60],30:[2,60],31:[2,60],32:[2,60],33:[2,60],36:[2,60],41:[2,60],50:[2,60],58:[2,60],63:[2,60],65:[2,60],67:[2,60],69:[2,60]},{1:[2,6],6:40,7:[1,22],62:[2,6]},{25:[1,93],33:[1,53],34:[1,41],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59]},{1:[2,39],7:[2,39],25:[2,39],33:[2,39],34:[2,39],35:[2,39],39:[2,39],40:[2,39],41:[2,39],42:[2,39],43:[2,39],44:[2,39],45:[2,39],46:[2,39],47:[2,39],48:[2,39],49:[2,39],52:[2,39],53:[2,39],54:[2,39],55:[2,39],56:[2,39],57:[2,39],61:[2,39],62:[2,39]},{35:[1,94],39:[1,95]},{33:[2,26],34:[1,96],35:[2,26],39:[2,26],40:[2,26],41:[2,26],42:[2,26],43:[2,26],44:[2,26],45:[2,26],46:[2,26],47:[2,26],48:[2,26],49:[2,26],52:[2,26],53:[2,26],54:[2,26],55:[2,26],56:[2,26],57:[2,26]},{33:[1,53],34:[1,97],35:[2,41],39:[2,41],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59]},{1:[2,35],7:[2,35],25:[2,35],33:[2,35],34:[2,35],35:[2,35],39:[2,35],40:[2,35],41:[2,35],42:[2,35],43:[2,35],44:[2,35],45:[2,35],46:[2,35],47:[2,35],48:[2,35],49:[2,35],52:[2,35],53:[2,35],54:[2,35],55:[2,35],56:[2,35],57:[2,35],61:[2,35],62:[2,35]},{5:98,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:101,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],25:[1,99],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],38:100,41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{1:[2,53],7:[2,53],25:[2,53],33:[1,53],34:[1,41],35:[2,53],39:[2,53],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],61:[2,53],62:[2,53]},{1:[2,54],7:[2,54],25:[2,54],33:[1,53],34:[1,41],35:[2,54],39:[2,54],40:[2,54],41:[2,54],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[2,54],49:[2,54],51:52,52:[2,54],53:[2,54],54:[2,54],55:[2,54],56:[2,54],57:[2,54],61:[2,54],62:[2,54]},{59:[1,102]},{24:[1,103]},{25:[2,70],36:[1,105],39:[2,70],64:104},{1:[2,73],7:[2,73],25:[2,73],33:[1,53],34:[1,41],35:[2,73],39:[2,73],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[2,73],49:[2,73],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],61:[2,73],62:[2,73]},{60:106,61:[1,108],67:[1,107]},{70:[1,109]},{33:[1,53],34:[1,41],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],60:110,61:[1,108]},{1:[2,4],7:[2,4],33:[1,53],34:[1,41],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],62:[2,4]},{24:[1,68],37:111},{1:[2,43],7:[2,43],25:[2,43],33:[1,53],34:[1,41],35:[2,43],39:[2,43],40:[2,43],41:[2,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[2,43],49:[2,43],51:52,52:[2,43],53:[2,43],54:[2,43],55:[2,43],56:[2,43],57:[2,43],61:[2,43],62:[2,43]},{1:[2,44],7:[2,44],25:[2,44],33:[1,53],34:[1,41],35:[2,44],39:[2,44],40:[2,44],41:[2,44],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[2,44],49:[2,44],51:52,52:[2,44],53:[2,44],54:[2,44],55:[2,44],56:[2,44],57:[2,44],61:[2,44],62:[2,44]},{1:[2,45],7:[2,45],25:[2,45],33:[1,53],34:[1,41],35:[2,45],39:[2,45],40:[2,45],41:[2,45],42:[2,45],43:[2,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[2,45],49:[2,45],51:52,52:[2,45],53:[2,45],54:[2,45],55:[2,45],56:[2,45],57:[2,45],61:[2,45],62:[2,45]},{1:[2,46],7:[2,46],25:[2,46],33:[1,53],34:[1,41],35:[2,46],39:[2,46],40:[2,46],41:[2,46],42:[2,46],43:[2,46],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[2,46],49:[2,46],51:52,52:[2,46],53:[2,46],54:[2,46],55:[2,46],56:[2,46],57:[2,46],61:[2,46],62:[2,46]},{1:[2,47],7:[2,47],25:[2,47],33:[1,53],34:[1,41],35:[2,47],39:[2,47],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],61:[2,47],62:[2,47]},{1:[2,48],7:[2,48],25:[2,48],33:[1,53],34:[1,41],35:[2,48],39:[2,48],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],61:[2,48],62:[2,48]},{1:[2,49],7:[2,49],25:[2,49],33:[1,53],34:[1,41],35:[2,49],39:[2,49],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],61:[2,49],62:[2,49]},{1:[2,50],7:[2,50],25:[2,50],33:[1,53],34:[1,41],35:[2,50],39:[2,50],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],61:[2,50],62:[2,50]},{1:[2,51],7:[2,51],25:[2,51],33:[1,53],34:[1,41],35:[2,51],39:[2,51],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[2,51],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],61:[2,51],62:[2,51]},{1:[2,52],7:[2,52],25:[2,52],33:[1,53],34:[1,41],35:[2,52],39:[2,52],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[2,52],49:[2,52],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],61:[2,52],62:[2,52]},{1:[2,61],7:[2,61],25:[2,61],33:[1,53],34:[1,41],35:[2,61],39:[2,61],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],61:[2,61],62:[2,61]},{1:[2,62],7:[2,62],25:[2,62],33:[2,62],34:[2,62],35:[2,62],39:[2,62],40:[2,62],41:[2,62],42:[2,62],43:[2,62],44:[2,62],45:[2,62],46:[2,62],47:[2,62],48:[2,62],49:[2,62],52:[2,62],53:[2,62],54:[2,62],55:[2,62],56:[2,62],57:[2,62],61:[2,62],62:[2,62]},{33:[1,53],34:[1,41],35:[1,112],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59]},{1:[2,25],7:[2,25],25:[2,25],33:[2,25],34:[2,25],35:[2,25],39:[2,25],40:[2,25],41:[2,25],42:[2,25],43:[2,25],44:[2,25],45:[2,25],46:[2,25],47:[2,25],48:[2,25],49:[2,25],52:[2,25],53:[2,25],54:[2,25],55:[2,25],56:[2,25],57:[2,25],61:[2,25],62:[2,25]},{1:[2,40],7:[2,40],25:[2,40],33:[2,40],34:[2,40],35:[2,40],39:[2,40],40:[2,40],41:[2,40],42:[2,40],43:[2,40],44:[2,40],45:[2,40],46:[2,40],47:[2,40],48:[2,40],49:[2,40],52:[2,40],53:[2,40],54:[2,40],55:[2,40],56:[2,40],57:[2,40],61:[2,40],62:[2,40]},{5:113,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{34:[1,114]},{34:[1,115],36:[1,79]},{1:[2,64],7:[2,64],25:[2,64],33:[1,53],34:[1,41],35:[2,64],39:[2,64],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[2,64],49:[2,64],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],61:[2,64],62:[2,64]},{1:[2,37],7:[2,37],25:[2,37],33:[2,37],34:[2,37],35:[2,37],39:[2,37],40:[2,37],41:[2,37],42:[2,37],43:[2,37],44:[2,37],45:[2,37],46:[2,37],47:[2,37],48:[2,37],49:[2,37],52:[2,37],53:[2,37],54:[2,37],55:[2,37],56:[2,37],57:[2,37],61:[2,37],62:[2,37]},{25:[1,116],39:[1,95]},{25:[2,41],33:[1,53],34:[1,41],39:[2,41],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59]},{5:117,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{25:[2,70],36:[1,105],39:[2,70],64:118},{25:[1,119],39:[1,120]},{25:[2,71],39:[2,71]},{1:[2,77],7:[2,77],25:[2,77],33:[2,77],34:[2,77],35:[2,77],39:[2,77],40:[2,77],41:[2,77],42:[2,77],43:[2,77],44:[2,77],45:[2,77],46:[2,77],47:[2,77],48:[2,77],49:[2,77],52:[2,77],53:[2,77],54:[2,77],55:[2,77],56:[2,77],57:[2,77],61:[2,77],62:[2,77]},{5:121,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{4:123,5:3,6:4,7:[1,22],8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],62:[1,122],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{5:124,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{1:[2,74],7:[2,74],25:[2,74],33:[2,74],34:[2,74],35:[2,74],39:[2,74],40:[2,74],41:[2,74],42:[2,74],43:[2,74],44:[2,74],45:[2,74],46:[2,74],47:[2,74],48:[2,74],49:[2,74],52:[2,74],53:[2,74],54:[2,74],55:[2,74],56:[2,74],57:[2,74],61:[2,74],62:[2,74],68:[2,74]},{1:[2,36],7:[2,36],25:[2,36],33:[2,36],34:[2,36],35:[2,36],39:[2,36],40:[2,36],41:[2,36],42:[2,36],43:[2,36],44:[2,36],45:[2,36],46:[2,36],47:[2,36],48:[2,36],49:[2,36],52:[2,36],53:[2,36],54:[2,36],55:[2,36],56:[2,36],57:[2,36],61:[2,36],62:[2,36]},{1:[2,79],7:[2,79],25:[2,79],33:[2,79],34:[2,79],35:[2,79],39:[2,79],40:[2,79],41:[2,79],42:[2,79],43:[2,79],44:[2,79],45:[2,79],46:[2,79],47:[2,79],48:[2,79],49:[2,79],52:[2,79],53:[2,79],54:[2,79],55:[2,79],56:[2,79],57:[2,79],61:[2,79],62:[2,79]},{25:[2,42],33:[1,53],34:[1,41],35:[2,42],39:[2,42],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59]},{26:[1,125]},{5:126,8:5,9:6,10:7,11:8,12:9,13:10,14:[1,11],15:[1,12],16:13,17:14,18:15,19:16,20:17,21:18,22:19,23:20,24:[1,21],26:[1,23],27:[1,24],28:[1,25],29:[1,26],30:[1,27],31:[1,28],32:[1,29],33:[1,30],36:[1,31],41:[1,33],50:[1,32],58:[1,34],63:[1,35],65:[1,36],66:37,67:[1,39],69:[1,38]},{1:[2,38],7:[2,38],25:[2,38],33:[2,38],34:[2,38],35:[2,38],39:[2,38],40:[2,38],41:[2,38],42:[2,38],43:[2,38],44:[2,38],45:[2,38],46:[2,38],47:[2,38],48:[2,38],49:[2,38],52:[2,38],53:[2,38],54:[2,38],55:[2,38],56:[2,38],57:[2,38],61:[2,38],62:[2,38]},{1:[2,63],7:[2,63],25:[2,63],33:[1,53],34:[1,41],35:[2,63],39:[2,63],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[2,63],49:[2,63],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],61:[2,63],62:[2,63]},{25:[1,127],39:[1,120]},{60:128,61:[1,108]},{36:[1,129]},{33:[1,53],34:[1,41],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],60:130,61:[1,108]},{1:[2,66],7:[2,66],25:[2,66],33:[2,66],34:[2,66],35:[2,66],39:[2,66],40:[2,66],41:[2,66],42:[2,66],43:[2,66],44:[2,66],45:[2,66],46:[2,66],47:[2,66],48:[2,66],49:[2,66],52:[2,66],53:[2,66],54:[2,66],55:[2,66],56:[2,66],57:[2,66],61:[2,66],62:[2,66],68:[2,66]},{6:40,7:[1,22],62:[1,131]},{33:[1,53],34:[1,41],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59],60:132,61:[1,108]},{35:[1,133]},{33:[1,53],34:[1,41],35:[1,134],40:[1,42],41:[1,43],42:[1,44],43:[1,45],44:[1,46],45:[1,47],46:[1,48],47:[1,49],48:[1,50],49:[1,51],51:52,52:[1,54],53:[1,55],54:[1,56],55:[1,57],56:[1,58],57:[1,59]},{60:135,61:[1,108]},{1:[2,69],7:[2,69],25:[2,69],33:[2,69],34:[2,69],35:[2,69],39:[2,69],40:[2,69],41:[2,69],42:[2,69],43:[2,69],44:[2,69],45:[2,69],46:[2,69],47:[2,69],48:[2,69],49:[2,69],52:[2,69],53:[2,69],54:[2,69],55:[2,69],56:[2,69],57:[2,69],61:[2,69],62:[2,69]},{25:[2,72],39:[2,72]},{1:[2,75],7:[2,75],25:[2,75],33:[2,75],34:[2,75],35:[2,75],39:[2,75],40:[2,75],41:[2,75],42:[2,75],43:[2,75],44:[2,75],45:[2,75],46:[2,75],47:[2,75],48:[2,75],49:[2,75],52:[2,75],53:[2,75],54:[2,75],55:[2,75],56:[2,75],57:[2,75],61:[2,75],62:[2,75],68:[2,75]},{1:[2,67],7:[2,67],25:[2,67],33:[2,67],34:[2,67],35:[2,67],39:[2,67],40:[2,67],41:[2,67],42:[2,67],43:[2,67],44:[2,67],45:[2,67],46:[2,67],47:[2,67],48:[2,67],49:[2,67],52:[2,67],53:[2,67],54:[2,67],55:[2,67],56:[2,67],57:[2,67],61:[2,67],62:[2,67],68:[2,67]},{1:[2,78],7:[2,78],25:[2,78],33:[2,78],34:[2,78],35:[2,78],39:[2,78],40:[2,78],41:[2,78],42:[2,78],43:[2,78],44:[2,78],45:[2,78],46:[2,78],47:[2,78],48:[2,78],49:[2,78],52:[2,78],53:[2,78],54:[2,78],55:[2,78],56:[2,78],57:[2,78],61:[2,78],62:[2,78]},{1:[2,33],7:[2,33],25:[2,33],33:[2,33],34:[2,33],35:[2,33],39:[2,33],40:[2,33],41:[2,33],42:[2,33],43:[2,33],44:[2,33],45:[2,33],46:[2,33],47:[2,33],48:[2,33],49:[2,33],52:[2,33],53:[2,33],54:[2,33],55:[2,33],56:[2,33],57:[2,33],61:[2,33],62:[2,33]},{1:[2,34],7:[2,34],25:[2,34],33:[2,34],34:[2,34],35:[2,34],39:[2,34],40:[2,34],41:[2,34],42:[2,34],43:[2,34],44:[2,34],45:[2,34],46:[2,34],47:[2,34],48:[2,34],49:[2,34],52:[2,34],53:[2,34],54:[2,34],55:[2,34],56:[2,34],57:[2,34],61:[2,34],62:[2,34]},{1:[2,68],7:[2,68],25:[2,68],33:[2,68],34:[2,68],35:[2,68],39:[2,68],40:[2,68],41:[2,68],42:[2,68],43:[2,68],44:[2,68],45:[2,68],46:[2,68],47:[2,68],48:[2,68],49:[2,68],52:[2,68],53:[2,68],54:[2,68],55:[2,68],56:[2,68],57:[2,68],61:[2,68],62:[2,68]}],
defaultActions: {},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == 'undefined') {
        this.lexer.yylloc = {};
    }
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === 'function') {
        this.parseError = this.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || EOF;
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: this.lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: this.lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                this.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};

// End Grammar




var n = require('./nodes');

// This is taken from
// https://github.com/cjihrig/jsparser
function SourceLocation(source, start, end, loc) {
    this.source = source;
    this.start = start;
    this.end = end;
}

function createLoc(firstToken, lastToken) {
    return new SourceLocation(
        null,
        new Position(firstToken.first_line, firstToken.first_column),
        new Position(lastToken.last_line, lastToken.last_column)
    );
}

function Position(line, column) {
    this.line = line;
    this.column = column;
}

function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = grammar;
exports.Parser = grammar.Parser;
exports.parse = function () { return grammar.parse.apply(grammar, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}

    return module.exports; 
})();


require['./lexer'] = (function() {
var exports = {}, module = {exports: exports};
var Lexer = function () {
    var self = this;

    self.KEYWORDS = [
        "def",
        "if",
        "end",
        "true",
        "false",
        "none",
        "not",
        "or",
        "and",
        "var",
        "return",
        "for",
        "in",
        "while"
    ];

    self.loc = {first_line: 0, first_column: 0, last_line: 0, last_column: 0};

    self.tokenize = function (code) {
        var tokens = [],
            i = 0, // current character position
            chunk,
            identifier,
            matched,
            block_depth = 0;

        while (i < code.length) {
            chunk = code.slice(i);

            // comments
            matched = chunk.match(/^#(.*)/);
            if (matched !== null) {
                identifier = matched[1];

                tokens.push(["COMMENT", identifier, self.loc]);

                i += identifier.length + 1;
                continue;
            }

            // block end
            matched = chunk.match(/^end/);
            if (matched !== null) {
                block_depth -= 1;

                tokens.push(["END_BLOCK", block_depth, self.loc]);

                i += matched[0].length;
                continue;
            }

            // else is matched separately
            // we insert an END_BLOCK and the ELSE
            matched = chunk.match(/^else/);
            if (matched !== null) {
                block_depth -= 1;

                tokens.push(["END_BLOCK", block_depth, self.loc]);
                tokens.push(["ELSE", "else", self.loc]);

                i += matched[0].length;
                continue;
            }

            // keywords and identifiers
            matched = chunk.match(/^[a-zA-Z_$@]\w*/);
            if (matched !== null) {
                identifier = matched[0];

                if (self.KEYWORDS.indexOf(identifier) !== -1) {
                    tokens.push([identifier.toUpperCase(), identifier, self.loc]);
                } else {
                    tokens.push(["IDENTIFIER", identifier, self.loc]);
                }

                i += identifier.length;
                continue;
            }

            // numbers
            matched = chunk.match(/^\d+(\.\d+)?/);
            if (matched !== null) {
                identifier = matched[0];

                tokens.push(["NUMBER", parseFloat(identifier), self.loc]);

                i += identifier.length;
                continue;
            }

            // strings
            matched = chunk.match(/^"([^"]*)/);
            if (matched !== null) {
                identifier = matched[1];

                tokens.push(["STRING", identifier, self.loc]);

                i += identifier.length + 2; // skip the ""
                continue;
            }

            // block start
            matched = chunk.match(/^:/);
            if (matched !== null) {
                block_depth += 1;

                tokens.push(["START_BLOCK", block_depth, self.loc]);

                i += matched[0].length;
                continue;
            }

            // long operators
            matched = chunk.match(/^==|^!=|^<=|^>=|^\+=|^-=|^\*=^|\/=/);
            if (matched !== null) {
                identifier = matched[0];

                tokens.push([identifier, identifier, self.loc]);

                i += matched[0].length;
                continue;
            }

            // spaces
            matched = chunk.match(/^ /);
            if (matched !== null) {
                i += 1;
                continue;
            }

            // empty line
            matched = chunk.match(/^\n\n/);
            if (matched !== null) {
                i += 2;

                tokens.push(["NEWLINE", "NEWLINE", self.loc]);
                tokens.push(["EMPTYLINE", "EMPTYLINE", self.loc]);
                tokens.push(["NEWLINE", "NEWLINE", self.loc]);

                continue;
            }

            // one character operators
            matched = chunk[0];
            if (matched === '\n') {
                tokens.push(["NEWLINE", "NEWLINE", self.loc]);
            } else {
                tokens.push([matched, matched, self.loc]);
            }
            i += 1;
        }

        if (block_depth !== 0) {
            throw "Bad block nesting !";
        }

        return tokens;
    }
}

module.exports = Lexer;



    return module.exports; 
})();


require['./panda'] = (function() {
var exports = {}, module = {exports: exports};
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
}

exports.parse = function (tokenized) {
    return parser.parse(tokenized);
}

exports.compile = function (data) {
    var scope = new Scope(null);
    scope.add("console"); // add global variables
    scope.add("require");

    var tokenized = lexer.tokenize(data);
    var parsed = parser.parse(tokenized);

    return parsed.nodes.compile(scope, "");
}

}(this));



    return module.exports; 
})();


    return require['./panda']; 
}();

if (typeof define === 'function' && define.amd) {
   define(function() { return Panda; });
} else {
   root.Panda = Panda;
}
}(this));
