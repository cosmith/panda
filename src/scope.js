// Heavily inspired by coffee-script again

exports.Scope = function (parent) {
    var self = this;

    if (parent) {
        self.root = null;
    } else {
        self.root = self;
    }

    self.parent = parent;

    // where we keep the variables names for this scope
    self.variables = {};

    // add a variable to the scope
    self.add = function (name) {
        if (self.variables[name]) {
            throw "Variable " + name + " already defined";
        } else {
            self.variables[name] = true;
        }
    }

    // check the existence of a variable in this scope or any parent
    self.check = function (name) {
        return !!self.variables[name] || self.parent.check(name);
    }

    // generate a temporary variable name
    self.temporary = function (name, index) {
        return '_' + name + index;
    }

    // create a temporary variable with an available name
    self.addTempVar = function (name, reserve) {
        var index = 0,
            newName = self.temporary(name, index);

        while (self.check(newName)) {
            index++;
            newName = self.temporary(name, index);
        }

        if (reserve) {
            self.add(newName);
        }

        return newName;
    }
}
