(function() {

var printTokens = function (tokens, full) {
    console.log('\nLexed input');
    console.log('===========\n');

    if (full) {
        console.log(tokens);
        return;
    }

    var cleaned = [],
        i;

    for (i = 0; i < tokens.length; i++) {
        cleaned.push(tokens[i].slice(0, 2).join(': '));
    }
    console.log(cleaned.join('\n'));
}


var printAst = function (ast) {
    console.log('\nParsed input');
    console.log('============\n');
    console.log(strAst(ast, 0).join('\n'));
}


var strAst = function (ast, indent) {
    var collection = [],
        index = 0,
        next,
        key;

    var dontShow = ["source", "start", "end", "push", "loc", "addNode", "compile"];

    for (key in ast) {
        if (ast.hasOwnProperty(key) && (dontShow.indexOf(key) === -1)) {
            next = ast[key];
            if (typeof next === 'object' && next !== null) {
                collection[index] = spaces(indent) + key +
                 ': {\n' + strAst(next, indent+1).join(',\n') +
                 ' \n' + spaces(indent) + '}';
            }
            else {
                collection[index] = [spaces(indent) + key + ': ' + String(next)];
            }
            index++;
        }
    }

    return collection;
}

var spaces = function (i) {
    return Array(i+1).join('    ');
}


exports.printTokens = printTokens;
exports.printAst = printAst;

}(this));
