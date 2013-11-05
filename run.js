// Debugging compile

var fs = require('fs'); // file system
var Panda = require('./src/panda').Panda;
var helpers = require('./src/helpers');
var path = "";

// get file path
process.argv.forEach(function(val, index, array) {
    if (index === 2) path = val;
});

fs.readFile(path, 'utf-8', function (err, data) {
    if (err) throw err;

    var panda = new Panda();

    var tokenized = panda.tokenize(data)
    helpers.printTokens(tokenized);

    var parsed = panda.parse(tokenized);
    helpers.printAst(parsed);

    var compiled = panda.compile(data);

    console.log("\n\nOutput");
    console.log("======\n");
    console.log(compiled);
    console.log("======\n");

    eval(compiled);
});