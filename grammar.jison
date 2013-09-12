// The start symbol is the root of the AST, where everything starts
%start Program

// Grammar
%%

Program
    : SourceElements EOF
        {
            $$ = new Nodes($1, createSourceLocation(null, @1, @2));
            return $$;
        }
    ;


Expression
    : Expression
        {
            $$ = new Nodes($1, createSourceLocation(@1, ));
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
            $$ = new NumberNode($1, createSourceLocation(@1, @1));
        }
    | STRING
        {
            $$ = new StringNode($1, createSourceLocation(@1, @1));
        }
    | TRUE
        {
            $$ = new TrueNode($1, createSourceLocation(@1, @1));
        }
    | FALSE
        {
            $$ = new FalseNode($1, createSourceLocation(@1, @1));
        }
    | NONE
        {
            $$ = new NoneNode($1, createSourceLocation(@1, @1));
        }
    ;


%%
// End Grammar
