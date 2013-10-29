// Heavily inspired by coffee-script again
(function() {
    var Scope;

    exports.Scope = Scope = (function () {
        Scope.root = null;

        function Scope(parent) {
            this.parent = parent;

            if (!this.parent) {
                Scope.root = this;
            }

            // where we keep the variables names for this scope
            this.variables = {};
        }

        // add a variable to the scope
        Scope.prototype.add = function (name) {
            if (this.variables[name]) {
                throw "Error: Variable '" + name + "' already defined";
            }

            this.variables[name] = true;
        };

        // check the existence of a variable in this scope or any parent
        Scope.prototype.alreadyDefined = function (name) {
            return !!this.variables[name] || (this.parent && this.parent.alreadyDefined(name));
        };

        // generate a temporary variable name
        Scope.prototype.temporary = function (name, index) {
            return '_' + name + index;
        };

        // create a temporary variable with an available name
        Scope.prototype.addTempVar = function (name, reserve) {
            var index = 0,
                newName = name;

            while (this.alreadyDefined(newName)) {
                index++;
                newName = this.temporary(name, index);
            }

            if (reserve) {
                this.add(newName);
            }

            return newName;
        };

        return Scope;
    }());

}(this));
