// Our root node, containing all the representation of the program
module.exports.Nodes = function (nodes, loc) {
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
    }

    self.compile = function () {
        var code = "";

        for (var i = 0; i < self.nodes.length; i++) {
            code += self.nodes[i].compile() + ";\n";
        }

        return code;
    }
}

// Literal nodes that translate directly to javascript
module.exports.NumberNode = function (value, loc) {
    var self = this;

    self.type = "number";
    self.value = value;
    self.loc = loc;

    self.compile = function () {
        return String(value);
    }
}

module.exports.StringNode = function (value, loc) {
    var self = this;

    self.type = "string";
    self.value = value;
    self.loc = loc;

    self.compile = function () {
        value = self.value.replace(/"/g, "\"");
        return '"' + value + '"';
    }
}

module.exports.TrueNode = function (loc) {
    var self = this;

    self.type = "boolean";
    self.value = true;
    self.loc = loc;

    self.compile = function () {
        return "true";
    }
}

module.exports.FalseNode = function (loc) {
    var self = this;

    self.type = "boolean";
    self.value = false;
    self.loc = loc;

    self.compile = function () {
        return "false";
    }
}

module.exports.NoneNode = function (loc) {
    var self = this;

    self.type = "none";
    self.value = null;
    self.loc = loc;

    self.compile = function () {
        return "null";
    }
}

// method call
module.exports.CallNode = function (receiver, method, arguments, loc) {
    var self = this;

    self.type = "call";
    self.receiver = receiver;
    self.method = method;
    self.arguments = arguments;
    self.loc = loc;

    self.compile = function () {
        var code = "",
            args = [];

        // compile the arguments first
        for (var i = 0; i < self.arguments.length; i++) {
            args.push(self.arguments[i].compile());
        }

        // methods that don't have a receiver are declared on the global context
        code = self.receiver ? self.receiver.compile() + "." : "";
        code += self.method + "(" + args.join(', ') + ")";

        return code;
    }
}

// local variables
module.exports.GetLocalNode = function (name, loc) {
    var self = this;

    self.type = "getlocal";
    self.name = name;
    self.loc = loc;

    self.compile = function () {
        return self.name;
    }
}

module.exports.SetLocalNode = function (name, value, loc) {
    var self = this;

    self.type = "setlocal";
    self.name = name;
    self.value = value;
    self.loc = loc;

    self.compile = function () {
        return "var " + self.name + " = " + self.value.compile();
    }
}

// function definition
module.exports.DefNode = function (name, params, body, loc) {
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
        code += self.params.join(", ") + ") {\n";
        code += self.body.compile();

        return code + "}";
    }
}

// if
module.exports.IfNode = function (condition, body, loc) {
    var self = this;

    self.type = "if";
    self.condition = condition;
    self.body = body;
    self.loc = loc;

    self.compile = function () {
        var code = "if (";

        code += self.condition.compile() + ") {\n";
        code += self.body.compile();

        return code + "}";
    }
}

