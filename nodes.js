module.exports = {

    // Our root node, containing all the representation of the program
    Nodes: function (nodes, loc) {
        this.nodes = nodes;
        this.loc = loc;

        this.push = function (node) {
            if (!nodes) {
                nodes = [];
            }
            nodes = nodes.concat(node);
            return nodes;
        }
    },

    // Literal nodes that translate directly to javascript
    NumberNode: function (value, loc) {
        this.value = value;
        this.loc = loc;
    },

    StringNode: function (value, loc) {
        this.value = value;
        this.loc = loc;
    },

    TrueNode: function (loc) {
        this.value = true;
        this.loc = loc;
    },

    FalseNode: function (loc) {
        this.value = false;
        this.loc = loc;
    },

    NoneNode: function (loc) {
        this.value = null;
        this.loc = loc;
    },

    // method call
    CallNode: function (receiver, method, argument, loc) {
        this.receiver = receiver;
        this.method = method;
        this.argument = argument;
        this.loc = loc;
    },

    // local variables
    GetLocalNode: function (name, loc) {
        this.name = name;
        this.loc = loc;
    },

    SetLocalNode: function (name, value, loc) {
        this.name = name;
        this.value = value;
        this.loc = loc;
    },

    // function definition
    DefNode: function (name, params, body, loc) {
        this.name = name;
        this.params = params;
        this.body = body;
        this.loc = loc;
    },

    // if
    IfNode: function (condition, body, loc) {
        this.condition = condition;
        this.body = body;
        this.loc = loc;
    },

}

