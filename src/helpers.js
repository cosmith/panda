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
    console.log(strAst(ast, '').join('\n'));
}


var strAst = function (ast, indent) {
    var collection = [],
        index = 0,
        next,
        key,
        repr,
        TAB = '    ';

    var dontShow = ["loc", "compile", "add"];

    for (key in ast) {
        if (ast.hasOwnProperty(key) && ast[key] !== null && dontShow.indexOf(key) < 0) {
            next = ast[key];

            if (typeof next === 'object' && (next.hasOwnProperty('type'))) {
                // subtree
                repr = indent + key + ':\n' + indent + TAB;
                repr += strAst(next, indent + TAB).join(',\n');

                collection[index] = repr;
                index++;
            }
            else if (next.hasOwnProperty('0') && next[0].hasOwnProperty('type')) {
                // array
                repr = indent + key + ':\n';
                repr += strAst(next, indent + TAB).join(',\n');

                collection[index] = repr;
                index++;
            }
            else if (typeof next === 'string' && key[0] !== "_") {
                // leaf
                collection[index] = key + ": \x1B[32m" + next + "\x1B[39m";
                index++;
            }
        }
    }

    return collection;
}




exports.printTokens = printTokens;
exports.printAst = printAst;

}(this));
