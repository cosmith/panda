module.exports = {

    // Our root node, containing all the representation of the program
    Nodes: function (nodes, loc) {
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
    },

    // Literal nodes that translate directly to javascript
    NumberNode: function (value, loc) {
        this.type = "number";
        this.value = value;
        this.loc = loc;
    },

    StringNode: function (value, loc) {
        this.type = "string";
        this.value = value;
        this.loc = loc;
    },

    TrueNode: function (loc) {
        this.type = "boolean";
        this.value = true;
        this.loc = loc;
    },

    FalseNode: function (loc) {
        this.type = "boolean";
        this.value = false;
        this.loc = loc;
    },

    NoneNode: function (loc) {
        this.type = "none";
        this.value = null;
        this.loc = loc;
    },

    // method call
    CallNode: function (receiver, method, argument, loc) {
        this.type = "call";
        this.receiver = receiver;
        this.method = method;
        this.argument = argument;
        this.loc = loc;
    },

    // local variables
    GetLocalNode: function (name, loc) {
        this.type = "getlocal";
        this.name = name;
        this.loc = loc;
    },

    SetLocalNode: function (name, value, loc) {
        this.type = "setlocal";
        this.name = name;
        this.value = value;
        this.loc = loc;
    },

    // function definition
    DefNode: function (name, params, body, loc) {
        this.type = "def";
        this.name = name;
        this.params = params;
        this.body = body;
        this.loc = loc;
    },

    // if
    IfNode: function (condition, body, loc) {
        this.type = "if";
        this.condition = condition;
        this.body = body;
        this.loc = loc;
    },

}

