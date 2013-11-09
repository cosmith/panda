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

exports.WhileNode = function (condition, body, loc) {
    var self = this;

    self.type = "while";
    self.condition = condition;
    self.body = body;
    self.loc = loc;

    self.compile = function (scope, indent) {
        var code = indent;

        code += "while (" + self.condition.compile(scope, indent) + ") {\n";
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
