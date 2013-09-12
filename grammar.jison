// The start symbol is the root of the AST, where everything starts
%start Root

// Grammar
%%

Root
    : <<EOF>>
        {
            $$ = new n.Nodes(null, createLoc(null, @1, @1));
        }
    | Expressions <<EOF>>
        {
            $$ = new n.Nodes($1, createLoc(null, @1, @1));
            return $$;
        }
    ;


Expressions
    : Expression
        {
            $$ = new n.Nodes($1, createLoc(@1, @1));
        }
    | Expressions Terminator Expression
        {
            $$ = $1.concat($2);
        }
    | Expressions Terminator
        {
            $$ = $1;
        }
    | Terminator
        {
            $$ = [];
        }
    ;


Terminator
    : NEWLINE
    ;


Expression
    : Literal
    | Call
    | Operator
    | GetConstant
    | SetConstant
    | GetLocal
    | SetLocal
    | Def
    | If
    | '(' Expression ')'
        {
            $$ = $2;
        }
    ;

Literal
    : NUMBER
        {
            $$ = new n.NumberNode($1, createLoc(@1, @1));
        }
    | STRING
        {
            $$ = new n.StringNode($1, createLoc(@1, @1));
        }
    | TRUE
        {
            $$ = new n.TrueNode($1, createLoc(@1, @1));
        }
    | FALSE
        {
            $$ = new n.FalseNode($1, createLoc(@1, @1));
        }
    | NONE
        {
            $$ = new n.NoneNode($1, createLoc(@1, @1));
        }
    ;

Call
    : IDENTIFIER Arguments
        {
            $$ = new n.CallNode(null, $1, $2, createLoc(@1, @2));
        }
    | Expression '.' IDENTIFIER Arguments
        {
            $$ = new n.CallNode($1, $3, $4, createLoc(@1, @4));
        }
    ;

Arguments
    : "(" ")"
        {
            $$ = [];
        }
    | "(" ArgList ")"
        {
            $$ = $2;
        }
    ;

ArgList
    : Expression
        {
            $$ = $1;
        }
    | ArgList "," Expression
        {
            $$ = $1.concat($3);
        }
    ;

Operator
    : Expression 'OR' Expression
        {
            $$ = new n.CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression 'AND' Expression
        {
            $$ = new n.CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '==' Expression
        {
            $$ = new n.CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '!=' Expression
        {
            $$ = new n.CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '>' Expression
        {
            $$ = new n.CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '>=' Expression
        {
            $$ = new n.CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '<' Expression
        {
            $$ = new n.CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '<=' Expression
        {
            $$ = new n.CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '+' Expression
        {
            $$ = new n.CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '-' Expression
        {
            $$ = new n.CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '*' Expression
        {
            $$ = new n.CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '/' Expression
        {
            $$ = new n.CallNode($1, $2, $3, createLoc(@1, @3));
        }
    ;

GetConstant
    : CONSTANT
        {
            $$ = new n.GetConstantNode($1, createLoc(@1, @1));
        }
    ;

SetConstant
    : CONSTANT '=' Expression
        {
            $$ = new n.SetConstantNode($1, $3, createLoc(@1, @3));
        }
    ;

GetConstant
    : IDENTIFIER
        {
            $$ = new n.GetLocalNode($1, createLoc(@1, @1));
        }
    ;

SetConstant
    : IDENTIFIER '=' Expression
        {
            $$ = new n.SetLocalNode($1, $3, createLoc(@1, @3));
        }
    ;

Block
    : START_BLOCK END_BLOCK
        {
            $$ = [];
        }
    | START_BLOCK Expressions END_BLOCK
        {
            $$ = $2;
        }
    ;

Def
    : 'DEF' IDENTIFIER "(" ParamList ")" Block
        {
            $$ = new n.DefNode($2, $4, $6, createLoc(@1, @6));
        }
    ;

ParamList
    : // nothing
        {
            $$ = [];
        }
    | IDENTIFIER
        {
            $$ = $1;
        }
    | ParamList "," IDENTIFIER
        {
            $$ = $1.concat($3);
        }
    ;

If
    : IF Expression Block
        {
            $$ = new n.IfNode($2, $3, createLoc(@1, @3));
        }
    ;


%%
// End Grammar


var n = require('./nodes');

// This is taken from
// https://github.com/cjihrig/jsparser
function SourceLocation(source, start, end, loc) {
    this.source = source;
    this.start = start;
    this.end = end;
}

function createLoc(source, firstToken, lastToken) {
    return new SourceLocation(
        source,
        new Position(0, 0),//firstToken.first_line, firstToken.first_column),
        new Position(0, 0)//lastToken.last_line, lastToken.last_column)
    );
}

function Position(line, column) {
    this.line = line;
    this.column = column;
}
