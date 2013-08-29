{languagename}
==============

Philosophy
----------

{languagename} is a programming language designed with children in mind.
It cross compiles to JavaScript, like CoffeScript (and others), because the aim
is to make sharing creations easy, and what is easier than running code in
the browser?

I am French, and I believe that one of the big obstacles in teaching
programming to kids is the language barrier. That's why the aim of this
project is to create a language that has several translations, starting with
French and English.

Another aim of {languagename} is to provide an easy to use graphics library
that can be used to interact with the HTML5 <canvas> element.

JavaScript is not an easy language; it is full of quirks and corner cases.
The inspiration for the syntax of {languagename} is mostly Python, with a bit
of Ruby, and CoffeeScript.


Examples
--------

### English version

    # Lines starting with '#' are comments.

    # 1. Primitive data types and operators
    #======================================

    # The basics look just like Python (for the English version!)

    # Numbers
    3  # => 3
    2.51  # => 2.51

    # Math
    1 + 1  # => 2
    8 - 1  # => 7
    10 * 2 # => 20
    35 / 5 # => 7

    # Enforce precedence with parentheses
    (1 + 3) * 2  # => 8

    # Booleans
    true
    false

    # Negate with not
    not true  # => false
    not false  # => true

    # Equality is == (this is actually JavaScript's ===)
    1 == 1  # => true
    2 == 1  # => false

    # Inequality is != (js: !==)
    1 != 1  # => false
    2 != 1  # => true

    # More comparisons
    1 < 10  # => true
    1 > 10  # => false
    2 <= 2  # => true
    2 >= 2  # => true

    # Comparisons can be chained like in Python/CoffeeScript
    1 < 2 < 3  # => true
    2 < 3 < 2  # => false



    # 2. Variables and collections
    #=============================

    # Declare a variable using the var keyword
    var x = 5

    # Let's make a list
    var my_list = []

    # You can also fill it from the beginning
    var some_list = [1, 2, 3, 4]

    # You can create ranges of values with [a..b]
    [5..8]  # => [5, 6, 7, 8]

    # Check if something is in a list with 'in'
    3 in [1, 3, 5]  # => true


    # Objects are pretty much the same as in js
    var my_object = {'property1': value1, 'property2': value2}



    # 3. Control flow
    #================

    # If statements are ended with the 'end' keyword like in Ruby
    if x > 5:
        console.log("I'm over 5!")
    else if x < 5:
        console.log("Under 5 here")
    else:
        console.log("This is mambo number 5")
    end


    # For loops work like in Python, iterating over arrays
    for thing in thing_list:
        do_something_with(thing)
    end


    # While loops are pretty straightforward
    var x = 0
    while x < 4:
        console.log(x)
        x += 1
    end



### French version

    # Les lignes qui commencent par un # sont des commentaires.

    # 1. Types primitifs et opérateurs
    #=================================

    # La base ressemble à du Python traduit

    # Nombres
    3  # => 3
    2.51  # => 2.51

    # Maths
    1 + 1  # => 2
    8 - 1  # => 7
    10 * 2 # => 20
    35 / 5 # => 7

    # Les parenthèses indiquent la précédence
    (1 + 3) * 2  # => 8

    # Booleens
    vrai
    faux

    # La négation se fait avec pas
    pas vrai  # => faux
    pas faux  # => vrai

    # L'égalité se teste avec == (équivalent du === en js)
    1 == 1  # => vrai
    2 == 1  # => faux

    # Inégalité != (js: !==)
    1 != 1  # => faux
    2 != 1  # => vrai

    # Comparaisons
    1 < 10  # => vrai
    1 > 10  # => faux
    2 <= 2  # => vrai
    2 >= 2  # => vrai

    # Les comparaisons peuvent etre mises bout à bout comme en Python/CoffeeScript
    1 < 2 < 3  # => vrai
    2 < 3 < 2  # => faux



    # 2. Variables and collections
    #=============================

    # Declarons une variable a l'aide du mot cle 'var'
    var x = 5

    # Construisons une liste
    var my_list = []

    # On peut la remplir des le debut
    var some_list = [1, 2, 3, 4]

    # Il est possible de creer des intervalles d'entiers: [a..b]
    [5..8]  # => [5, 6, 7, 8]

    # Tester si un élément fait partie d'une liste
    3 dans [1, 3, 5]  # => vrai


    # Les objects sont pratiquement les memes qu'en JavaScript
    var mon_objet = {'propriété1': valeur1, 'propriété2': valeur2}



    # 3. Structures de controle
    #==========================

    # Les blocs 'if' sont delimites par le mot 'fin', un peu comme en Ruby
    si x > 5:
        console.log("Plus de 5 !")
    sinon si x < 5:
        console.log("Moins que 5")
    sinon:
        console.log("Exactement 5")
    fin


    # Les boucles for fonctionnent comme en Python, itérant sur une liste
    pour truc dans liste_de_trucs:
        faire_qqchose(truc)
    fin


    # Boucle while
    var x = 0
    tantque x < 4:
        console.log(x)
        x += 1
    fin
