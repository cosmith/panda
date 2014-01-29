var test = require("./test-utils").test;

// Basic arithmetic and primitives
test("Arithmetic 1", (function () {
    return (((4 + (4 * (5 - 22))) + (5.3 / 2)) == - 61.35);
}));

test("Substraction 1", (function () {
    return ((1 - 2) == - 1);
}));

test("Substraction 2", (function () {
    return ((1 - 2) == - 1);
}));

test("Unary minus", (function () {
    return (- 1 == - 1);
}));

test("Unary minus 2", (function () {
    var a = 5;
    return (- a == (5 - 10));
}));

test("Booleans 1", (function () {
    (var a = (false || true) && (false == false));
    return (a == true);
}));

test("Booleans 2", (function () {
    (return false && ((true == false) && (false == false)));
}));

test(">=", (function () {
    return (3 >= (5 == false));
}));

test("<=", (function () {
    return (3 <= (5 == true));
}));

test(">", (function () {
    return (3 > (5 == false));
}));

test("<", (function () {
    return (3 < (5 == true));
}));

test("not 1", (function () {
    return (!(true) == false);
}));

test("not 2", (function () {
    return (!(false) == true);
}));

test("unary minus 2", (function () {
    var pos = function () {
        return 5;
    };

    return (- pos() == (5 - 10));
}));

test("+=", (function () {
    var b = 0;
    (b += 1);
    return (b == 1);
}));

test("*=", (function () {
    var b = 1;
    (b *= 2);
    return (b == 2);
}));

test("/=", (function () {
    var b = 2;
    (b /= 2);
    return (b == 1);
}));

test("-=", (function () {
    var b = 1;
    (b -= 1);
    return (b == 0);
}));

