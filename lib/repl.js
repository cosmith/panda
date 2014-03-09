// Panda REPL

var Panda = require("../src/panda");
var readline = require("readline");

var Repl = (function() {
    function Repl() {
        var self = this;
        self.rl = readline.createInterface(process.stdin, process.stdout);
        self.rl.setPrompt(">>");
        self.rl.on("line", self.processLine.bind(self)).on("close", self.exit);
    };

    Repl.prototype.start = function () {
        var self = this;

        self.rl.prompt();
    };

    Repl.prototype.processLine = function (line) {
        var self = this;

        console.log(eval(Panda.compile(line)));
        self.rl.prompt();
    };

    Repl.prototype.exit = function () {
        var self = this;

        console.log("Bye!");
        process.exit(0);
    };

    return Repl;
})();

exports.Repl = Repl;
