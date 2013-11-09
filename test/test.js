// Debugging compile
var fs = require('fs'); // file system
var path = require('path');
var Panda = require('../src/panda');
var test;

// get test to run, if null run all
process.argv.forEach(function(val, index, array) {
    if (index === 2) test = val;
});

var commonCode = fs.readFileSync(path.resolve(__dirname, "testUtils.pa"), 'utf-8');

// run a test from the /test/ folder
var runTest = function (test) {
    var data = fs.readFileSync(path.resolve(__dirname, test), 'utf-8');
    var compiled = Panda.compile(commonCode + "\n" + data);

    eval(compiled);
};

if (test) {
    runTest(test);
}
else {
    fs.readdir(__dirname, function (err, data) {
        var file, name, extension;

        console.log("\nRunning tests...");

        for (var i = 0; i < data.length; i++) {
            file = data[i];
            name = file.slice(0, file.length - 3);
            extension = file.slice(file.length - 3, file.length);

            if (extension === ".pa" && name !== "testUtils") {
                console.log("-", name);
                runTest(file);
                console.log("");
            }
        }

        console.log("\nDone.");
    });
}