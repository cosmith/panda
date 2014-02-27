// The start symbol is the root of the AST, where everything starts
%start Root


// Operator precedence (low to high)
%right      '=' 'RETURN'
%right      'IF' 'ELSE' 'FOR'
%left       'OR' 'AND'
%right      '+=' '-=' '*=' '/='

%left       '<', '>', '<=', '>='
%left       '==', '!='

%left       '+' '-'
%left       '*' '/'

%right      'NOT', '-', 'NEW'
$nonassoc   '++' '--'
%right      '['
%left       '.'


// Grammar
%%

Root
    : <<EOF>>
    | Expressions <<EOF>>
        {
            $$ = new n.Nodes($1, createLoc(@1, @1));
            return $$;
        }
    ;


Expressions
    : Expression
        {
            $$ = new n.Nodes([$1], createLoc(@1, @1));
        }
    | Expressions Terminator Expression
        {
            $$ = $1.add($3);
        }
    | Expressions Terminator
    ;


Terminator
    : NEWLINE
    ;


Expression
    : Literal
    | List
    | Range
    | Call
    | Operator
    | Comparison
    | GetConstant
    | SetConstant
    | DefLocal
    | SetLocal
    | GetLocal
    | Def
    | Return
    | If
    | For
    | While
    | Accessor
    | Dictionary
    | GetAttr
    | SetAttr
    | Class
    | Parens
    ;


Literal
    : NUMBER
        {
            $$ = new n.Number($1, createLoc(@1, @1));
        }
    | STRING
        {
            $$ = new n.String($1, createLoc(@1, @1));
        }
    | TRUE
        {
            $$ = new n.Boolean(true, createLoc(@1, @1));
        }
    | FALSE
        {
            $$ = new n.Boolean(false, createLoc(@1, @1));
        }
    | NONE
        {
            $$ = new n.None($1, createLoc(@1, @1));
        }
    | COMMENT
        {
            $$ = new n.Comment($1, createLoc(@1, @1));
        }
    | EMPTYLINE
        {
            $$ = new n.EmptyLine(createLoc(@1, @1));
        }
    ;

Parens
    : '(' Expression ')'
        {
            $$ = new n.Parens($2, createLoc(@1, @3));
        }
    ;

RangeDots
    : '..'
    ;

Range
    : '[' Expression RangeDots Expression ']'
        {
            $$ = new n.Range($2, $4, false, createLoc(@1, @5));
        }
    ;

Call
    : IDENTIFIER ArgList
        {
            $$ = new n.Call(null, $1, $2, createLoc(@1, @2));
        }
    | Expression '.' IDENTIFIER ArgList
        {
            $$ = new n.Call($1, $3, $4, createLoc(@1, @4));
        }
    ;

ExpressionList
    : Expression
        {
            $$ = [$1];
        }
    | NEWLINE Expression
        {
            $$ = [$2];
        }
    | Expression NEWLINE
        {
            $$ = [$1];
        }
    | NEWLINE Expression NEWLINE
        {
            $$ = [$2];
        }
    | ExpressionList ',' Expression
        {
            $$ = $1.concat($3);
        }
    | ExpressionList ',' NEWLINE Expression
        {
            $$ = $1.concat($4);
        }
    | ExpressionList ',' Expression NEWLINE
        {
            $$ = $1.concat($3);
        }
    | ExpressionList ',' NEWLINE Expression NEWLINE
        {
            $$ = $1.concat($4);
        }
    ;

ArgList
    : "(" ")"
        {
            $$ = [];
        }
    | "(" ExpressionList ")"
        {
            $$ = $2;
        }
    ;

List
    : '[' ']'
        {
            $$ = new n.List([], createLoc(@1, @2));
        }
    | '[' ExpressionList ']'
        {
            $$ = new n.List($2, createLoc(@1, @3));
        }
    ;


Operator
    : Expression '+' Expression
        {
            $$ = new n.Operator('+', $1, $3, createLoc(@1, @3));
        }
    | Expression '-' Expression
        {
            $$ = new n.Operator('-', $1, $3, createLoc(@1, @3));
        }
    | Expression '*' Expression
        {
            $$ = new n.Operator('*', $1, $3, createLoc(@1, @3));
        }
    | Expression '/' Expression
        {
            $$ = new n.Operator('/', $1, $3, createLoc(@1, @3));
        }
    | Expression '+=' Expression
        {
            $$ = new n.Operator('+=', $1, $3, createLoc(@1, @3));
        }
    | Expression '-=' Expression
        {
            $$ = new n.Operator('-=', $1, $3, createLoc(@1, @3));
        }
    | Expression '*=' Expression
        {
            $$ = new n.Operator('*=', $1, $3, createLoc(@1, @3));
        }
    | Expression '/=' Expression
        {
            $$ = new n.Operator('/=', $1, $3, createLoc(@1, @3));
        }
    | Expression '==' Expression
        {
            $$ = new n.Operator($2, $1, $3, createLoc(@1, @3));
        }
    | Expression '!=' Expression
        {
            $$ = new n.Operator($2, $1, $3, createLoc(@1, @3));
        }
    | Expression '<' Expression
        {
            $$ = new n.Operator($2, $1, $3, createLoc(@1, @3));
        }
    | Expression '>' Expression
        {
            $$ = new n.Operator($2, $1, $3, createLoc(@1, @3));
        }
    | Expression '<=' Expression
        {
            $$ = new n.Operator($2, $1, $3, createLoc(@1, @3));
        }
    | Expression '>=' Expression
        {
            $$ = new n.Operator($2, $1, $3, createLoc(@1, @3));
        }
    | Expression 'OR' Expression
        {
            $$ = new n.Operator('OR', $1, $3, createLoc(@1, @3));
        }
    | Expression 'AND' Expression
        {
            $$ = new n.Operator('AND', $1, $3, createLoc(@1, @3));
        }
    | 'NOT' Expression
        {
            $$ = new n.Unary('NOT', $2, createLoc(@1, @2));
        }
    | '-' Expression
        {
            $$ = new n.Unary('-', $2, createLoc(@1, @2));
        }
    | NEW Expression
        {
            $$ = new n.Unary('new', $2, createLoc(@1, @2));
        }
    ;



DefLocal
    : VAR IDENTIFIER '=' Expression
        {
            $$ = new n.DefLocal($2, $4, createLoc(@1, @3));
        }
    ;

SetLocal
    : IDENTIFIER '=' Expression
        {
            $$ = new n.SetLocal($1, $3, createLoc(@1, @3));
        }
    ;

GetLocal
    : IDENTIFIER
        {
            $$ = new n.GetLocal($1, createLoc(@1, @1));
        }
    ;

Block
    : COLON END_BLOCK
        {
            $$ = [];
        }
    | COLON NEWLINE END_BLOCK
        {
            $$ = [];
        }
    | COLON Expressions END_BLOCK
        {
            $$ = $2;
        }
    | COLON NEWLINE Expressions END_BLOCK
        {
            $$ = $3;
        }
    ;

Def
    : DEF IDENTIFIER "(" ParamList ")" Block
        {
            $$ = new n.Def($2, $4, $6, createLoc(@1, @6));
        }
    | DEF "(" ParamList ")" Block
        {
            $$ = new n.Def(null, $3, $5, createLoc(@1, @5));
        }
    ;

ParamList
    : // nothing
        {
            $$ = [];
        }
    | IDENTIFIER
        {
            $$ = [$1];
        }
    | ParamList "," IDENTIFIER
        {
            $$ = $1.concat($3);
        }
    ;

Return
    : RETURN Expression
        {
            $$ = new n.Return($2, createLoc(@1, @2));
        }
    | RETURN
        {
            $$ = new n.Return(null, createLoc(@1, @1));
        }
    ;

IfBlock
    : IF Expression Block
        {
            $$ = new n.If($2, $3, createLoc(@1, @3));
        }
    | IfBlock ELSE IF Expression Block
        {
            $$ = $1.addElse($4, $5, false);
        }
    ;

If
    : IfBlock
    | IfBlock ELSE Block
        {
            $$ = $1.addElse(null, $3, true);
        }
    ;

For
    : FOR IDENTIFIER IN Expression Block
        {
            $$ = new n.For($2, $4, $5, createLoc(@1, @4));
        }
    ;

While
    : WHILE Expression Block
        {
            $$ = new n.While($2, $3, createLoc(@1, @3));
        }
    ;

Accessor
    : Expression '[' Expression ']'
        {
            $$ = new n.Accessor($1, $3, createLoc(@1, @4));
        }
    ;

GetAttr
    : Expression '.' IDENTIFIER
        {
            $$ = new n.GetAttr($1, $3, createLoc(@1, @3));
        }
    ;

SetAttr
    : GetAttr '=' Expression
        {
            $$ = new n.SetAttr($1, $3, createLoc(@1, @3));
        }
    | Accessor '=' Expression
        {
            $$ = new n.SetAttr($1, $3, createLoc(@1, @3));
        }
    ;

DictionaryArg
    : Expression COLON Expression
        {
            $$ = new n.DictionaryArg($1, $3, createLoc(@1, @3));
        }
    | Expression COLON NEWLINE Expression
        {
            $$ = new n.DictionaryArg($1, $4, createLoc(@1, @4));
        }
    ;

DictionaryArgList
    : DictionaryArg
        {
            $$ = [$1];
        }
    | NEWLINE DictionaryArg
        {
            $$ = [$2];
        }
    | DictionaryArg NEWLINE
        {
            $$ = [$1];
        }
    | NEWLINE DictionaryArg NEWLINE
        {
            $$ = [$2];
        }
    | DictionaryArgList ',' DictionaryArg
        {
            $$ = $1.concat($3);
        }
    | DictionaryArgList ',' NEWLINE DictionaryArg
        {
            $$ = $1.concat($4);
        }
    | DictionaryArgList ',' DictionaryArg NEWLINE
        {
            $$ = $1.concat($3);
        }
    | DictionaryArgList ',' NEWLINE DictionaryArg NEWLINE
        {
            $$ = $1.concat($4);
        }
    ;

Dictionary
    : '{' '}'
        {
            $$ = new n.Dictionary([], createLoc(@1, @2));
        }
    | '{' DictionaryArgList '}'
        {
            $$ = new n.Dictionary($2, createLoc(@1, @3));
        }
    ;

Class
    : CLASS IDENTIFIER Block
        {
            $$ = new n.Class($2, $3, createLoc(@1, @3));
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

function createLoc(firstToken, lastToken) {
    return new SourceLocation(
        null,
        new Position(firstToken.first_line, firstToken.first_column),
        new Position(lastToken.last_line, lastToken.last_column)
    );
}

function Position(line, column) {
    this.line = line;
    this.column = column;
}
