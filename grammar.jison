// The start symbol is the root of the AST, where everything starts
%start Program

// Grammar
%%

Program
    : SourceElements EOF
        {
            $$ = new Nodes($1, createLoc(null, @1, @2));
            return $$;
        }
    ;


Expression
    : Expression
        {
            $$ = new Nodes($1, createLoc(@1, @1));
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
    | Class
    | If
    | '(' Expression ')'
        {
            $$ = $2;
        }
    ;

Literal
    : NUMBER
        {
            $$ = new NumberNode($1, createLoc(@1, @1));
        }
    | STRING
        {
            $$ = new StringNode($1, createLoc(@1, @1));
        }
    | TRUE
        {
            $$ = new TrueNode($1, createLoc(@1, @1));
        }
    | FALSE
        {
            $$ = new FalseNode($1, createLoc(@1, @1));
        }
    | NONE
        {
            $$ = new NoneNode($1, createLoc(@1, @1));
        }
    ;

Call
    : IDENTIFIER Arguments
        {
            $$ = new CallNode(null, $1, $2, createLoc(@1, @2));
        }
    | Expression '.' IDENTIFIER Arguments
        {
            $$ = new CallNode($1, $3, $4, createLoc(@1, @4));
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
            $$ = new CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression 'AND' Expression
        {
            $$ = new CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '==' Expression
        {
            $$ = new CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '!=' Expression
        {
            $$ = new CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '>' Expression
        {
            $$ = new CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '>=' Expression
        {
            $$ = new CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '<' Expression
        {
            $$ = new CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '<=' Expression
        {
            $$ = new CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '+' Expression
        {
            $$ = new CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '-' Expression
        {
            $$ = new CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '*' Expression
        {
            $$ = new CallNode($1, $2, $3, createLoc(@1, @3));
        }
    | Expression '/' Expression
        {
            $$ = new CallNode($1, $2, $3, createLoc(@1, @3));
        }
    ;

GetConstant
    : CONSTANT
        {
            $$ = new GetConstantNode($1, createLoc(@1, @1));
        }
    ;

SetConstant
    : CONSTANT '=' Expression
        {
            $$ = new SetConstantNode($1, $3, createLoc(@1, @3));
        }
    ;

GetConstant
    : IDENTIFIER
        {
            $$ = new GetLocalNode($1, createLoc(@1, @1));
        }
    ;

SetConstant
    : IDENTIFIER '=' Expression
        {
            $$ = new SetLocalNode($1, $3, createLoc(@1, @3));
        }
    ;

Block
    : START_BLOCK Expressions END_BLOCK
        {
            $$ = $2;
        }
    ;

Def
    : DEF IDENTIFIER "(" ParamList ")" Block
        {
            $$ = new DefNode($2, $4, $6, createLoc(@1, @6));
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
            $$ = new IfNode($2, $3, createLoc(@1, @3));
        }
    ;


%%
// End Grammar


