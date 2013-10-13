var Scope = require('./scope').Scope;

// Our root node, containing all the representation of the program
exports.Nodes = function (nodes, loc) {
    var self = this;

    self.type = "root";
    self.nodes = nodes;
    self.scope = new Scope(null);
    self.loc = loc;

    self.addNode = function (node) {
        if (!nodes) {
            self.nodes = [];
        }
        self.nodes.push(node);
        return self;
    };

    self.compile = function () {
        var code = "";

        for (var i = 0; i < self.nodes.length; i++) {
            code += self.nodes[i].compile() + ";\n";
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

    self.compile = function () {
        return '//' + String(value);
    };
};

// Literal nodes that translate directly to javascript
exports.NumberNode = function (value, loc) {
    var self = this;

    self.type = "number";
    self.value = value;
    self.loc = loc;

    self.compile = function () {
        return String(value);
    };
};

exports.StringNode = function (value, loc) {
    var self = this;

    self.type = "string";
    self.value = value;
    self.loc = loc;

    self.compile = function () {
        value = self.value.replace(/"/g, "\"");
        return '"' + value + '"';
    };
};

exports.BooleanNode = function (value, loc) {
    var self = this;

    self.type = "boolean";
    self.value = Boolean(value);
    self.loc = loc;

    self.compile = function () {
        return self.value;
    };
};

exports.NoneNode = function (loc) {
    var self = this;

    self.type = "none";
    self.value = null;
    self.loc = loc;

    self.compile = function () {
        return "null";
    };
};

exports.ListNode = function (list, loc) {
    var self = this;

    self.type = "list";
    self.list = list;
    self.loc = loc;

    self.compile = function () {
        var code = "[";

        for (var i = 0; i < self.list.length; i++) {
            code += self.list[i].compile();
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

    self.compile = function () {
        var code = "(function () {\n";

        code += "  var __a = [];\n  for (var __i=";
        code += self.start.compile();
        code += "; __i <= ";
        code += self.end.compile();
        code += "; __i++) { __a.push(__i) }\n  return __a;\n})()";

        return code;
    };
};

exports.OperatorNode = function (op, arg1, arg2, loc) {
    var self = this;

    self.type = "operator";
    self.op = op;
    self.arg1 = arg1;
    self.arg2 = arg2;

    self.compile = function () {
        var jsOps = ['+', '-', '*', '/', '<', '>', '<=', '>='],
            translation = {
                'OR': '||',
                'AND': '&&',
                '!=': '!==',
                '==': '==='
            },
            res = '';

        if (jsOps.indexOf(self.op) !== -1) {
            res = [self.arg1.compile(), self.op, self.arg2.compile()].join(' ');
        }
        else if (self.op in translation) {
            res = [
                self.arg1.compile(), translation[self.op], self.arg2.compile()
            ].join(' ');
        }
        else throw "Not implemented yet";

        return '(' + res + ')';
    }
}

exports.UnaryNode = function (op, arg, loc) {
    var self = this;

    self.type = "unary";
    self.op = op;
    self.arg = arg;

    self.compile = function () {
        var jsOps = ['-'],
            translation = {
                'NOT': '!'
            },
            res = '';

        if (jsOps.indexOf(self.op) !== -1) {
            res = self.op + '(' + self.arg.compile() + ')';
        }
        else if (self.op in translation) {
            res = translation[self.op] + '(' + self.arg.compile() + ')';
        }
        else throw "Not implemented yet";

        return res;
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

    self.compile = function () {
        var code = "",
            argsList = [];

        // compile the arguments first
        for (var i = 0; i < self.args.length; i++) {
            argsList.push(self.args[i].compile());
        }

        // methods that don't have a receiver are declared on the global context
        code = self.receiver ? self.receiver.compile() + "." : "";
        code += self.method + "(" + argsList.join(', ') + ")";

        return code;
    };
};

// local variables
exports.GetLocalNode = function (name, loc) {
    var self = this;

    self.type = "getlocal";
    self.name = name;
    self.loc = loc;

    self.compile = function () {
        return self.name;
    };
};

exports.DefLocalNode = function (name, value, loc) {
    var self = this;

    self.type = "deflocal";
    self.name = name;
    self.value = value;
    self.loc = loc;

    self.compile = function () {
        return "var " + self.name + " = " + self.value.compile();
    };
};

exports.SetLocalNode = function (name, value, loc) {
    // TODO: handle scope properly
    var self = this;

    self.type = "setlocal";
    self.name = name;
    self.value = value;
    self.loc = loc;

    self.compile = function () {
        return self.name + " = " + self.value.compile();
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

    self.compile = function () {
        // declare functions on the global context
        var code = "var ";

        code += self.name + " = function (";
        code += self.params.join(", ") + ") {\n  ";
        code += self.body.compile();

        return code + "}";
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

    self.compile = function () {
        var code = "if (",
            ifBlock;

        // first if statement
        code += self.ifBlocks[0].cond.compile() + ") {\n";
        code += self.ifBlocks[0].body.compile() + "}";

        // following else ifs / else
        for (var i = 1; i < self.ifBlocks.length; i++) {
            ifBlock = self.ifBlocks[i];

            if (ifBlock.finalElse) {
                code += " else {\n";
                code += ifBlock.body.compile() + "}";
            }
            else {
                code += " else if (";
                code += ifBlock.cond.compile() + ") {\n";
                code += ifBlock.body.compile() + "}";
            }
        }

        return code;
    };
};
