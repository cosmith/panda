#!/usr/bin/env node

var fs = require('fs'); // file system
var Panda = require('./src/panda');
var helpers = require('./src/helpers');
var path = "";
var repl = require('./lib/repl');

var program = require('commander');

program
    .version('0.1.0')
    .usage('[options] <file ...>')
    .option('-t, --tokens', 'output lexed input')
    .option('-a, --ast', 'output AST')
    .option('-j, --javascript', 'output compiled javascript code')
    .option('-v, --verbose', 'output tokens, AST and JS code')
    .option('-c, --compile', 'write compiled code to JS file')
    .parse(process.argv);

// show REPL if no input file
if (program.args.length === 0) {
    var repl = new repl.Repl();
    repl.start();
}
else {
    path = program.args[0];

    fs.readFile(path, 'utf-8', function (err, data) {
        if (err) throw err;

        var tokens, ast, compiled, filename;

        if (program.tokens || program.verbose) {
            tokens = Panda.tokenize(data);
            helpers.printTokens(tokens);

            console.log("\n======\n");
        }

        if (program.ast || program.verbose) {
            tokens = Panda.tokenize(data);
            ast = Panda.parse(tokens);
            helpers.printAst(ast);

            console.log("\n======\n");
        }

        compiled = Panda.compile(data);

        if (program.javascript || program.verbose) {
            console.log("\n\nOutput");
            console.log("======\n");

            console.log(compiled);

            console.log("\n======\n");
        }

        if (program.compile) {
            filename = program.args[1];
            if (!filename) {
                filename = path.slice(0, path.length - 3) + ".js";
            }
            
            fs.writeFile(filename, compiled, function (err, data) {
                if (err) throw err;
            });
        }
        else {
            eval(compiled);
        }
    });
}
