var Lexer = function () {
    var self = this;

    self.KEYWORDS = [
        "def",
        "if",
        "end",
        "true",
        "false",
        "none",
        "not",
        "or",
        "and",
        "var",
        "return",
        "for",
        "in",
        "while"
    ];

    self.loc = {first_line: 0, first_column: 0, last_line: 0, last_column: 0};

    self.tokenize = function (code) {
        var tokens = [],
            i = 0, // current character position
            chunk,
            identifier,
            matched,
            block_depth = 0;

        while (i < code.length) {
            chunk = code.slice(i);

            // comments
            matched = chunk.match(/^#(.*)/);
            if (matched !== null) {
                identifier = matched[1];

                tokens.push(["COMMENT", identifier, self.loc]);

                i += identifier.length + 1;
                continue;
            }

            // block end
            matched = chunk.match(/^end/);
            if (matched !== null) {
                block_depth -= 1;

                tokens.push(["END_BLOCK", block_depth, self.loc]);

                i += matched[0].length;
                continue;
            }

            // else is matched separately
            // we insert an END_BLOCK and the ELSE
            matched = chunk.match(/^else/);
            if (matched !== null) {
                block_depth -= 1;

                tokens.push(["END_BLOCK", block_depth, self.loc]);
                tokens.push(["ELSE", "else", self.loc]);

                i += matched[0].length;
                continue;
            }

            // keywords and identifiers
            matched = chunk.match(/^[a-zA-Z_$@]\w*/);
            if (matched !== null) {
                identifier = matched[0];

                if (self.KEYWORDS.indexOf(identifier) !== -1) {
                    tokens.push([identifier.toUpperCase(), identifier, self.loc]);
                } else {
                    tokens.push(["IDENTIFIER", identifier, self.loc]);
                }

                i += identifier.length;
                continue;
            }

            // numbers
            matched = chunk.match(/^\d+(\.\d+)?/);
            if (matched !== null) {
                identifier = matched[0];

                tokens.push(["NUMBER", parseFloat(identifier), self.loc]);

                i += identifier.length;
                continue;
            }

            // strings
            matched = chunk.match(/^"([^"]*)/);
            if (matched !== null) {
                identifier = matched[1];

                tokens.push(["STRING", identifier, self.loc]);

                i += identifier.length + 2; // skip the ""
                continue;
            }

            // block start
            matched = chunk.match(/^:/);
            if (matched !== null) {
                block_depth += 1;

                tokens.push(["START_BLOCK", block_depth, self.loc]);

                i += matched[0].length;
                continue;
            }

            // long operators
            matched = chunk.match(/^==|^!=|^<=|^>=|^\+=|^-=|^\*=^|\/=|^\.\./);
            if (matched !== null) {
                identifier = matched[0];

                tokens.push([identifier, identifier, self.loc]);

                i += matched[0].length;
                continue;
            }

            // spaces
            matched = chunk.match(/^ /);
            if (matched !== null) {
                i += 1;
                continue;
            }

            // empty line
            matched = chunk.match(/^\n\n/);
            if (matched !== null) {
                i += 2;

                tokens.push(["NEWLINE", "NEWLINE", self.loc]);
                tokens.push(["EMPTYLINE", "EMPTYLINE", self.loc]);
                tokens.push(["NEWLINE", "NEWLINE", self.loc]);

                continue;
            }

            // one character operators
            matched = chunk[0];
            if (matched === '\n') {
                tokens.push(["NEWLINE", "NEWLINE", self.loc]);
            } else {
                tokens.push([matched, matched, self.loc]);
            }
            i += 1;
        }

        if (block_depth !== 0) {
            throw "Bad block nesting !";
        }

        tokens = self.removeLeadingNewLines(tokens);

        return tokens;
    }

    self.removeLeadingNewLines = function(tokens) {
        while (tokens[0][0] === "NEWLINE" || tokens[0][0] === "EMPTYLINE") {
            tokens = tokens.splice(1, tokens.length);
        }

        return tokens;
    }
}

module.exports = Lexer;

