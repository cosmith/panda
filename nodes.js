var Nodes = function (nodes) {
    this.nodes = nodes;

    this.push = function (node) {
        nodes.push(node);
        return self;
    }
}

// Literal nodes that translate directly to javascript
var NumberNode = function (value) {
    this.value = value;
}

var StringNode = function (value) {
    this.value = value;
}

var TrueNode = function () {
    this.value = true;
}

var FalseNode = function () {
    this.value = false;
}

var NoneNode = function () {
    this.value = null;
}

// method call
var CallNode = function (receiver, method, argument) {
    this.receiver = receiver;
    this.method = method;
    this.argument = argument;
}

// local variables
var GetLocalNode = function (name) {
    this.name = name;
}

var SetLocalNode = function (name, value) {
    this.name = name;
    this.value = value;
}

// function definition
var DefNode = function (name, params, body) {
    this.name = name;
    this.params = params;
    this.body = body;
}

// if
var IfNode = function (condition, body) {
    this.condition = condition;
    this.body = body;
}
