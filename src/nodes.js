(function() {

var Scope = require('./scope').Scope;
var TAB = "    ";

// Our root node, containing all the representation of the program
exports.Nodes = function (nodes, loc) {
    var self = this;

    self.type = "root";
    self.nodes = nodes;
    self.loc = loc;

    self.add = function (node) {
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
exports.Comment = function (value, loc) {
    var self = this;

    self.type = "comment";
    self.loc = loc;

    self._value = value;

    self.compile = function (scope, indent) {
        return indent + '//' + String(self._value);
    };
};

// Empty lines too to preserve legibility
exports.EmptyLine = function (loc) {
    var self = this;

    self.type = "emptyline";
    self.loc = loc;

    self.compile = function (scope, indent) {
        return "";
    };
};

// Literal nodes that translate directly to javascript
exports.Number = function (value, loc) {
    var self = this;

    self.type = "number";
    self.loc = loc;

    self._value = value;

    self.compile = function (scope, indent) {
        return indent + self._value;
    };

    self.get_value = function () {
        return self._value;
    }
};

exports.String = function (value, loc) {
    var self = this;

    self.type = "string";
    self.loc = loc;

    self._value = value;

    self.compile = function (scope, indent) {
        self._value = self._value.replace(/"/g, "\"");

        return indent + '"' + self._value + '"';
    };
};

exports.Boolean = function (value, loc) {
    var self = this;

    self.type = "boolean";
    self.loc = loc;

    self._value = value;

    self.compile = function (scope, indent) {
        return indent + self._value;
    };
};

exports.None = function (loc) {
    var self = this;

    self.type = "none";
    self.loc = loc;

    self.compile = function (scope, indent) {
        return indent + "null";
    };
};

exports.List = function (list, loc) {
    var self = this;

    self.type = "list";
    self.loc = loc;

    self._list = list;

    self.compile = function (scope, indent) {
        var code = "[",
            i;

        for (i = 0; i < self._list.length; i++) {
            code += self._list[i].compile(scope, '');
            if (i !== self._list.length - 1) {
                code += ", ";
            }
        }

        return code + "]";
    };
};

exports.Parens = function (expr, loc) {
    var self = this;

    self.type = "none";
    self.loc = loc;

    self.expr = expr;

    self.compile = function (scope, indent) {
        return indent + "(" + self.expr.compile(scope, '') + ")";
    };
};

exports.Range = function (start, end, loc) {
    var self = this;

    self.type = "range";
    self.loc = loc;

    self._start = start;
    self._end = end;
    self._numbers = (self._start.type === "number") && (self._end.type === "number");

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

        if (self._numbers) {
            goingUp = self._start.get_value() < self._end.get_value();
        }

        startVal = self._start.compile(scope, '');
        endVal = self._end.compile(scope, '');

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

exports.Operator = function (op, left, right, loc) {
    var self = this;

    self.type = "operator";
    self.loc = loc;
    self.left = left;
    self.right = right;

    self._op = op;

    self._CHAINABLE = ['==', '!=', '<', '>', '<=', '>='];
    self._JSOPS = ['+', '-', '*', '/', '+=', '-=', '*=', '/=', '==', '!=', '<', '>', '<=', '>='];
    self._TRANSLATIONS = {
        'OR': '||',
        'AND': '&&',
        '==': '===',
        '!=': '!=='
    };

    self._isChainable = function () {
        return self._CHAINABLE.indexOf(self._op) >= 0;
    }

    self._compileOp = function () {
        var operator = "";

        if (self._JSOPS.indexOf(self._op) !== -1) {
            operator = self._op;
        }
        else if (self._TRANSLATIONS.hasOwnProperty(self._op)) {
            operator = self._TRANSLATIONS[self._op];
        }
        else {
            throw self._op + " not implemented yet";
        }

        return operator;
    }

    self._compileOne = function (scope, indent) {
        var code = "";

        code += self.left.compile(scope, '');
        code += ' ' + self._compileOp() + ' ';
        code += self.right.compile(scope, '');

        return code;
    };

    self._compileChain = function (scope, indent) {
        var code = "";

        code += self.left.compile(scope, '') + ' && (';
        code += self.left.right.compile(scope, '');
        code += ' ' + self._compileOp() + ' ';
        code += self.right.compile(scope, '') + ')';

        return code;
    };

    self.compile = function (scope, indent) {
        var code = "";

        if (self._isChainable()
            && self.left.hasOwnProperty('_isChainable')
            && self.left._isChainable()) {
            code = self._compileChain(scope, indent);
        }
        else {
            code = self._compileOne(scope, '');
        }

        return indent + '(' + code + ')';
    };
};

exports.Unary = function (op, arg, loc) {
    var self = this;

    self.type = "unary";
    self.loc = loc;

    self._op = op;
    self._arg = arg;

    self.compile = function (scope, indent) {
        var jsOps = ['-', 'new'],
            translation = {
                'NOT': '!'
            },
            code = '';

        if (jsOps.indexOf(self._op) !== -1) {
            code = self._op + " " + self._arg.compile(scope, '');
        }
        else if (translation.hasOwnProperty(self._op)) {
            code = translation[self._op] + '(' + self._arg.compile(scope, '') + ')';
        }
        else {
            throw "Not implemented yet";
        }

        return code;
    };
};

// method call
exports.Call = function (receiver, method, args, loc) {
    var self = this;

    self.type = "call";
    self.loc = loc;

    self._receiver = receiver;
    self._method = method;
    self._args = args;

    self.compile = function (scope, indent) {
        var code = "",
            argsList = [],
            i;

        if (self._method == "addEventListener") {
            return self.compileEventListener();
        }

        // compile the arguments first
        for (i = 0; i < self._args.length; i++) {
            argsList.push(self._args[i].compile(scope, ''));
        }

        // methods that don't have a receiver are declared on the global context
        code = self._receiver ? self._receiver.compile(scope, '') + "." : "";
        code += self._method + "(" + argsList.join(', ') + ")";

        return indent + code;
    };

    self.compileEventListener = function (scope, indent) {
        var code = "",
            listenerArg,
            listenerCode = "",
            argsList = [],
            i;

        // compile the listener function first
        listenerArg = self._args[1];
        if (listenerArg.type == "getlocal") {
            listenerCode = "var " + listenerArg.compile(scope, "");
        } 

        // compile the arguments first
        for (i = 0; i < self._args.length; i++) {
            argsList.push(self._args[i].compile(scope, ''));
        }

        // methods that don't have a receiver are declared on the global context
        code = self._receiver ? self._receiver.compile(scope, '') + "." : "";
        code += self._method + "(" + argsList.join(', ') + ")";

        return indent + code;
    }
};

// local variables
exports.GetLocal = function (name, loc) {
    var self = this;

    self.type = "getlocal";
    self.loc = loc;

    self._name = name;

    self.compile = function (scope, indent) {
        if (!scope.alreadyDefined(self._name)) {
            throw "Error: variable '" + self._name + "' not defined.";
        }
        return indent + self._name;
    };
};

exports.DefLocal = function (name, value, loc) {
    var self = this;

    self.type = "deflocal";
    self.loc = loc;

    self._name = name;
    self._value = value;

    self.compile = function (scope, indent) {
        var code = "var ";

        scope.add(self._name);
        code += self._name + " = " + self._value.compile(scope, '');

        return indent + code;
    };
};

exports.SetLocal = function (name, value, loc) {
    var self = this;

    self.type = "setlocal";
    self.loc = loc;

    self._name = name;
    self._value = value;

    self.compile = function (scope, indent) {
        var code = self._name + " = ";
        if (!scope.alreadyDefined(self._name)) {
            throw "Error: variable '" + self._name + "' not defined.";
        }
        code += self._value.compile(scope, '');

        return indent + code;
    };
};

// function definition
exports.Def = function (name, params, body, loc) {
    var self = this;

    self.type = "def";
    self.loc = loc;

    self._name = name;
    self._params = params;
    self._body = body;

    self._compileFunction = function (scope, indent) {
        var code = indent,
            i,
            internalScope;

        if (self._name !== null) {
            // add the name of the function to the external scope
            scope.add(self._name);
            code += "var " + self._name + " = ";
        }

        // create the internal scope
        internalScope = new Scope(scope);
        // add the parameters to the function scope
        for (i = 0; i < self._params.length; i++) {
            internalScope.add(self._params[i]);
        }

        code += "function (";
        code += self._params.join(", ") + ") {";
        if (self._body.hasOwnProperty('compile')) {
            code += "\n" + self._body.compile(internalScope, indent + TAB);
        }
        code += indent + "}";

        if (self._name !== null) return code;
        else return '(' + code + ')';
    };

    self._compileMethod = function (scope, indent) {
        var code = indent,
            i,
            internalScope;

        // add the name of the function to the external scope
        scope.add(self._name);
        // create the internal scope
        internalScope = new Scope(scope);
        // add the parameters to the function scope
        for (i = 0; i < self._params.length; i++) {
            internalScope.add(self._params[i]);
        }

        code += scope.className + ".prototype." + self._name + " = function (";
        code += self._params.join(", ") + ") {\n";
        code += indent + TAB + "var self = this;\n";
        if (self._body.hasOwnProperty('compile')) {
            code += "\n" + self._body.compile(internalScope, indent + TAB);
        }
        code += indent + "}";

        return code;
    };

    self._compileConstructor = function (scope, indent) {
        var code = indent,
            i,
            internalScope;

        scope.add(self._name);
        // create the internal scope
        internalScope = new Scope(scope);
        // add the parameters to the function scope
        for (i = 0; i < self._params.length; i++) {
            internalScope.add(self._params[i]);
        }

        code += "function " + self._name + "(";
        code += self._params.join(", ") + ") {\n";
        code += indent + TAB + "var self = this;\n";
        if (self._body.hasOwnProperty('compile')) {
            code += self._body.compile(internalScope, indent + TAB);
        }
        code += indent + "}";

        return code;
    };

    self.compile = function (scope, indent) {
        var code;

        if (scope.isClass) {
            if (self._name === scope.className) {
                code = self._compileConstructor(scope, indent);
            }
            else {
                code = self._compileMethod(scope, indent);
            }
        }
        else {
            code = self._compileFunction(scope, indent);
        }

        return code;
    }
};

exports.Return = function (value, loc) {
    var self = this;

    self.type = "return";
    self._value = value;
    self.loc = loc;

    self.compile = function (scope, indent) {
        var code = "return";

        if (self._value !== null) {
            code += " " + self._value.compile(scope, '');
        }

        return indent + code;
    };
};

// if - else
exports.If = function (condition, body, loc) {
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
exports.For = function (variable, items, body, loc) {
    var self = this;

    self.type = "for";
    self.loc = loc;

    self._variable = variable;
    self._items = items;
    self._body = body;

    self.compile = function (scope, indent) {
        var k,
            things,
            code = "";

        if (!scope.alreadyDefined(self._variable)) {
            scope.add(self._variable);
            code += indent + "var " + self._variable + ";\n";
        }

        things = self._items.compile(scope, '');

        // iteration
        k = scope.addTempVar("k", true);
        code += indent + "for (var " + k + " = 0; ";
        code += k + " < " + things + ".length; " + k + " += 1) {\n";

        // body
        code += indent + TAB + self._variable + " = " + things + "[" + k + "];\n";
        code += self._body.compile(scope, indent + TAB);

        code += indent + "}";

        return code;
    };
};

exports.While = function (condition, body, loc) {
    var self = this;

    self.type = "while";
    self.loc = loc;

    self._condition = condition;
    self._body = body;

    self.compile = function (scope, indent) {
        var code = indent;

        code += "while (" + self._condition.compile(scope, indent) + ") {\n";
        code += self._body.compile(scope, indent + TAB);
        code += indent + "}";

        return code;
    };
};

exports.Accessor = function (accessed, attr, loc) {
    var self = this;

    self.type = "accessor";
    self.loc = loc;

    self._accessed = accessed;
    self._attr = attr;

    self.compile = function (scope, indent) {
        var code;

        code = indent + self._accessed.compile(scope, '');
        code += '[' + self._attr.compile(scope, '') + ']';

        return code;
    };
};

exports.GetAttr = function (accessed, attr, loc) {
    var self = this;

    self.type = "getattr";
    self.loc = loc;

    self._accessed = accessed;
    self._attr = attr;

    self.compile = function (scope, indent) {
        var code;

        code = indent + self._accessed.compile(scope, '');
        code += '.' + self._attr;

        return code;
    };
};

exports.SetAttr = function (item, value, loc) {
    var self = this;

    self.type = "setattr";
    self.loc = loc;

    self._item = item;
    self._value = value;

    self.compile = function (scope, indent) {
        var code;

        code = indent + self._item.compile(scope, '');
        code += ' = ' + self._value.compile(scope, '');

        return code;
    };
};

exports.DictionaryArg = function (key, value, loc) {
    var self = this;

    self.type = "dictarg";
    self.loc = loc;

    self.key = key;
    self.value = value;
};

exports.Dictionary = function (arglist, loc) {
    var self = this;

    self.type = "dictionary";
    self.loc = loc;

    self._arglist = arglist;

    self.compile = function (scope, indent) {
        var i,
            arg,
            code = indent + "{";

        for (i = 0; i < self._arglist.length; i++) {
            arg = self._arglist[i];
            code += arg.key.compile(scope, "") + ":" + arg.value.compile(scope, "");

            if (i != self._arglist.length - 1) {
                code += ",";
            }
        }

        code += "}";

        return code;
    };
};

exports.Class = function (name, body, loc) {
    var self = this;

    self.type = "dictarg";
    self.loc = loc;

    self.name = name;
    self._body = body;

    self.compile = function(scope, indent) {
        var code,
            internalScope;

        scope.add(self.name);

        internalScope = new Scope(scope);
        internalScope.isClass = true;
        internalScope.className = self.name;
        internalScope.add('self');

        code = indent + "var " + self.name;
        code += " = (function() {\n";
        code += self._body.compile(internalScope, indent + TAB);

        code += "\n" + indent + TAB + "return " + self.name + ";";
        code += "\n})()";

        return code;
    };
};


}(this));
