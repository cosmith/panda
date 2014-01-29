// Basic test runner
var test = function (description, func) {
    var str = "";

    if (func()) {
        str = "\x1B[32m✔ \x1B[39m";
    }
    else {
        str = (("\n\x1B[31m✘ `" + description) + "` failed!\x1B[39m\n");
    }

    process.stdout.write(str);
};

exports.test = test;
