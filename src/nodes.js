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
            node;

        for (var i = 0; i < self.nodes.length; i++) {
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
        var code = "[";

        for (var i = 0; i < self.list.length; i++) {
            code += self.list[i].compile(scope, '');
            if (i != self.list.length - 1) {
                code += ", ";
            }
        }

        return code + "]";
    };
};

exports.RangeNode = function (start, end, loc) {
    var self = this;

    self.type = "range";
    self.start = start;
    self.end = end;
    self.loc = loc;

    self.compile = function (scope, indent) {
        var code = "(function () {\n",
            a = scope.addTempVar('a'),
            i = scope.addTempVar('i');
            idt2 = indent + TAB;

        code += idt2 + "var " + a + " = [];\n";
        code += idt2 + "for (var " + i + "=";
        code += self.start.compile(scope, '');
        code += "; " + i + " <= ";
        code += self.end.compile(scope, '');
        code += "; " + i + "++) { " + a + ".push(" + i + ") }\n";
        code += idt2 + "return " + a + ";\n";
        code += indent + "})()";

        return indent + code;
    };
};

exports.OperatorNode = function (op, arg1, arg2, loc) {
    var self = this;

    self.type = "operator";
    self.op = op;
    self.arg1 = arg1;
    self.arg2 = arg2;

    self.compile = function (scope, indent) {
        var jsOps = ['+', '-', '*', '/', '+=', '-=', '*=', '/=', '<', '>', '<=', '>='],
            translation = {
                'OR': '||',
                'AND': '&&',
                '!=': '!==',
                '==': '==='
            },
            code = '';

        if (jsOps.indexOf(self.op) !== -1) {
            code = [self.arg1.compile(scope, ''), self.op, self.arg2.compile(scope, '')].join(' ');
        }
        else if (self.op in translation) {
            code = [
                self.arg1.compile(scope, ''), translation[self.op], self.arg2.compile(scope, '')
            ].join(' ');
        }
        else throw "Not implemented yet";

        return indent + '(' + code + ')';
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
        else if (self.op in translation) {
            code = translation[self.op] + '(' + self.arg.compile(scope, '') + ')';
        }
        else throw "Not implemented yet";

        return code;
    }
}

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
            argsList = [];

        // compile the arguments first
        for (var i = 0; i < self.args.length; i++) {
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
        var code = indent;

        // add the name of the function to the external scope
        scope.add(self.name);
        // create the internal scope
        scope = new Scope(scope);
        // add the parameters to the function scope
        for (var i = 0; i < self.params.length; i++) {
            scope.add(self.params[i]);
        }

        code += "var " + self.name + " = function (";
        code += self.params.join(", ") + ") {\n";
        code += self.body.compile(scope, indent + TAB);

        return code + indent + "}";
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
            ifBlock;

        // first if statement
        code += self.ifBlocks[0].cond.compile(scope, '') + ") {\n";
        code += self.ifBlocks[0].body.compile(scope, indent + TAB)
        code += indent + "}";

        // following else ifs / else
        for (var i = 1; i < self.ifBlocks.length; i++) {
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
    }
}
