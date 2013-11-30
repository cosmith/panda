// The start symbol is the root of the AST, where everything starts
%start Root


// Operator precedence (low to high)
%right      'IF' 'ELSE' 'FOR'
%left       'OR' 'AND'
%right      '=' 'RETURN'
%right      '+=' '-=' '*=' '/='

%left       '<', '>', '<=', '>='
%left       '==', '!='

%left       '+' '-'
%left       '*' '/'

%right      '['
%right      'NOT', '-'
$nonassoc   '++' '--'
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
            $$ = $1.addNode($3);
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
            $$ = new n.BooleanNode(true, createLoc(@1, @1));
        }
    | FALSE
        {
            $$ = new n.BooleanNode(false, createLoc(@1, @1));
        }
    | NONE
        {
            $$ = new n.NoneNode($1, createLoc(@1, @1));
        }
    | COMMENT
        {
            $$ = new n.CommentNode($1, createLoc(@1, @1));
        }
    | EMPTYLINE
        {
            $$ = new n.EmptyLineNode(createLoc(@1, @1));
        }
    ;

RangeDots
    : '..'
    ;

Range
    : '[' Expression RangeDots Expression ']'
        {
            $$ = new n.RangeNode($2, $4, false, createLoc(@1, @5));
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

ExpressionList
    : Expression
        {
            $$ = [$1];
        }
    | ExpressionList ',' Expression
        {
            $$ = $1.concat($3);
        }
    ;

Arguments
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
            $$ = new n.ListNode([], createLoc(@1, @2));
        }
    | '[' ExpressionList ']'
        {
            $$ = new n.ListNode($2, createLoc(@1, @3));
        }
    ;


Operator
    : Expression '+' Expression
        {
            $$ = new n.OperatorNode('+', $1, $3, createLoc(@1, @3));
        }
    | Expression '-' Expression
        {
            $$ = new n.OperatorNode('-', $1, $3, createLoc(@1, @3));
        }
    | Expression '*' Expression
        {
            $$ = new n.OperatorNode('*', $1, $3, createLoc(@1, @3));
        }
    | Expression '/' Expression
        {
            $$ = new n.OperatorNode('/', $1, $3, createLoc(@1, @3));
        }
    | Expression '+=' Expression
        {
            $$ = new n.OperatorNode('+=', $1, $3, createLoc(@1, @3));
        }
    | Expression '-=' Expression
        {
            $$ = new n.OperatorNode('-=', $1, $3, createLoc(@1, @3));
        }
    | Expression '*=' Expression
        {
            $$ = new n.OperatorNode('*=', $1, $3, createLoc(@1, @3));
        }
    | Expression '/=' Expression
        {
            $$ = new n.OperatorNode('/=', $1, $3, createLoc(@1, @3));
        }
    | Expression '==' Expression
        {
            $$ = new n.OperatorNode($2, $1, $3, createLoc(@1, @3));
        }
    | Expression '!=' Expression
        {
            $$ = new n.OperatorNode($2, $1, $3, createLoc(@1, @3));
        }
    | Expression '<' Expression
        {
            $$ = new n.OperatorNode($2, $1, $3, createLoc(@1, @3));
        }
    | Expression '>' Expression
        {
            $$ = new n.OperatorNode($2, $1, $3, createLoc(@1, @3));
        }
    | Expression '<=' Expression
        {
            $$ = new n.OperatorNode($2, $1, $3, createLoc(@1, @3));
        }
    | Expression '>=' Expression
        {
            $$ = new n.OperatorNode($2, $1, $3, createLoc(@1, @3));
        }
    | Expression 'OR' Expression
        {
            $$ = new n.OperatorNode('OR', $1, $3, createLoc(@1, @3));
        }
    | Expression 'AND' Expression
        {
            $$ = new n.OperatorNode('AND', $1, $3, createLoc(@1, @3));
        }
    | 'NOT' Expression
        {
            $$ = new n.UnaryNode('NOT', $2, createLoc(@1, @2));
        }
    | '-' Expression
        {
            $$ = new n.UnaryNode('-', $2, createLoc(@1, @2));
        }
    ;



DefLocal
    : VAR IDENTIFIER '=' Expression
        {
            $$ = new n.DefLocalNode($2, $4, createLoc(@1, @3));
        }
    ;

SetLocal
    : IDENTIFIER '=' Expression
        {
            $$ = new n.SetLocalNode($1, $3, createLoc(@1, @3));
        }
    ;

GetLocal
    : IDENTIFIER
        {
            $$ = new n.GetLocalNode($1, createLoc(@1, @1));
        }
    ;

Block
    : START_BLOCK END_BLOCK
        {
            $$ = [];
        }
    | START_BLOCK NEWLINE END_BLOCK
        {
            $$ = [];
        }
    | START_BLOCK Expressions END_BLOCK
        {
            $$ = $2;
        }
    | START_BLOCK NEWLINE Expressions END_BLOCK
        {
            $$ = $3;
        }
    ;

Def
    : DEF IDENTIFIER "(" ParamList ")" Block
        {
            $$ = new n.DefNode($2, $4, $6, createLoc(@1, @6));
        }
    | DEF "(" ParamList ")" Block
        {
            $$ = new n.DefNode(null, $3, $5, createLoc(@1, @5));
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
            $$ = new n.ReturnNode($2, createLoc(@1, @2));
        }
    | RETURN
        {
            $$ = new n.ReturnNode(null, createLoc(@1, @1));
        }
    ;

IfBlock
    : IF Expression Block
        {
            $$ = new n.IfNode($2, $3, createLoc(@1, @3));
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
            $$ = new n.ForNode($2, $4, $5, createLoc(@1, @4));
        }
    ;

While
    : WHILE Expression Block
        {
            $$ = new n.WhileNode($2, $3, createLoc(@1, @3));
        }
    ;

Accessor
    : Expression '[' Expression ']'
        {
            $$ = new n.AccessorNode($1, $3, createLoc(@1, @4));
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
