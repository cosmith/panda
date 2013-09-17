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
}

// Literal nodes that translate directly to javascript
module.exports.NumberNode = function (value, loc) {
    var self = this;
    self.type = "number";
    self.value = value;
    self.loc = loc;
}

module.exports.StringNode = function (value, loc) {
    var self = this;
    self.type = "string";
    self.value = value;
    self.loc = loc;
}

module.exports.TrueNode = function (loc) {
    var self = this;
    self.type = "boolean";
    self.value = true;
    self.loc = loc;
}

module.exports.FalseNode = function (loc) {
    var self = this;
    self.type = "boolean";
    self.value = false;
    self.loc = loc;
}

module.exports.NoneNode = function (loc) {
    var self = this;
    self.type = "none";
    self.value = null;
    self.loc = loc;
}

// method call
module.exports.CallNode = function (receiver, method, argument, loc) {
    var self = this;
    self.type = "call";
    self.receiver = receiver;
    self.method = method;
    self.argument = argument;
    self.loc = loc;
}

// local variables
module.exports.GetLocalNode = function (name, loc) {
    var self = this;
    self.type = "getlocal";
    self.name = name;
    self.loc = loc;
}

module.exports.SetLocalNode = function (name, value, loc) {
    var self = this;
    self.type = "setlocal";
    self.name = name;
    self.value = value;
    self.loc = loc;
}

// function definition
module.exports.DefNode = function (name, params, body, loc) {
    var self = this;
    self.type = "def";
    self.name = name;
    self.params = params;
    self.body = body;
    self.loc = loc;
}

// if
module.exports.IfNode = function (condition, body, loc) {
    var self = this;
    self.type = "if";
    self.condition = condition;
    self.body = body;
    self.loc = loc;
}

