// Our root node, containing all the representation of the program
module.exports.Nodes = function (nodes, loc) {
    this.nodes = nodes;
    this.loc = loc;

    this.push = function (node, loc) {
        nodes.push(node);
        return self;
    }
}

// Literal nodes that translate directly to javascript
var NumberNode = function (value, loc) {
    console.log('Number node here!', value, loc);
    this.value = value;
    this.loc = loc;
}

var StringNode = function (value, loc) {
    this.value = value;
    this.loc = loc;
}

var TrueNode = function (loc) {
    this.value = true;
    this.loc = loc;
}

var FalseNode = function (loc) {
    this.value = false;
    this.loc = loc;
}

var NoneNode = function (loc) {
    this.value = null;
    this.loc = loc;
}

// method call
var CallNode = function (receiver, method, argument, loc) {
    this.receiver = receiver;
    this.method = method;
    this.argument = argument;
    this.loc = loc;
}

// local variables
var GetLocalNode = function (name, loc) {
    this.name = name;
    this.loc = loc;
}

var SetLocalNode = function (name, value, loc) {
    this.name = name;
    this.value = value;
    this.loc = loc;
}

// function definition
var DefNode = function (name, params, body, loc) {
    this.name = name;
    this.params = params;
    this.body = body;
    this.loc = loc;
}

// if
var IfNode = function (condition, body, loc) {
    this.condition = condition;
    this.body = body;
    this.loc = loc;
}



