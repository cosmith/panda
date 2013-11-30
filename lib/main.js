;(function () {
var input = document.getElementsByClassName('input')[0],
    output = document.getElementsByClassName('output')[0],
    button = document.getElementsByClassName('run')[0];
    logging = document.getElementsByClassName('logging')[0];

function compile(e) {
    var code = input.value;
    output.value = Panda.compile(code);
}

function run(e) {
    var code = input.value;
    eval(Panda.compile(code));
}

function print(str) {
    logging.innerHTML += str + '\n';
}

input.value =
    "print(\"Hello world!\")\n\n" +

    "var s = 0\n" +
    "var r = [1..10]\n\n" +

    "for i in r:\n" +
    "    s += i\n" +
    "end\n\n" +

    "print(s)\n\n";

input.oninput = compile;
button.onclick = run;

compile(null);
run(null);
})();