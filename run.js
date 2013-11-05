// Debugging compile

var fs = require('fs'); // file system
var Panda = require('./src/panda');
var helpers = require('./src/helpers');
var path = "";

// get file path
process.argv.forEach(function(val, index, array) {
    if (index === 2) path = val;
});

fs.readFile(path, 'utf-8', function (err, data) {
    if (err) throw err;

    var tokenized = Panda.tokenize(data)
    helpers.printTokens(tokenized);

    var parsed = Panda.parse(tokenized);
    helpers.printAst(parsed);

    var compiled = Panda.compile(data);

    console.log("\n\nOutput");
    console.log("======\n");
    console.log(compiled);
    console.log("======\n");

    eval(compiled);
});