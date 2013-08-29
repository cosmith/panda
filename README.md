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
    3 #  => 3
    2.51 #  => 2.51

    # Math
    1 + 1 #  => 2
    8 - 1 #  => 7
    10 * 2 # => 20
    35 / 5 # => 7

    # Enforce precedence with parentheses
    (1 + 3) * 2 #  => 8

    # Booleans
    true
    false

    # Negate with not
    not true #  => false
    not false #  => true

    # Equality is == (this is actually JavaScript's ===)
    1 == 1 #  => true
    2 == 1 #  => false

    # Inequality is != (js: !==)
    1 != 1 #  => false
    2 != 1 #  => true

    # More comparisons
    1 < 10 #  => true
    1 > 10 #  => false
    2 <= 2 #  => true
    2 >= 2 #  => true

    # Comparisons can be chained like in Python/CoffeeScript
    1 < 2 < 3 #  => true
    2 < 3 < 2 #  => false

### French version

    # Les lignes qui commencent par un # sont des commentaires.

    # 1. Types primitifs et opérateurs
    #=================================

    # La base ressemble à du Python traduit

    # Nombres
    3 #  => 3
    2.51 #  => 2.51

    # Maths
    1 + 1 #  => 2
    8 - 1 #  => 7
    10 * 2 # => 20
    35 / 5 # => 7

    # Les parenthèses indiquent la précédence
    (1 + 3) * 2 #  => 8

    # Booleens
    vrai
    faux

    # La négation se fait avec pas
    pas vrai #  => faux
    pas faux #  => vrai

    # L'égalité se teste avec == (équivalent du === en js)
    1 == 1 #  => vrai
    2 == 1 #  => faux

    # Inégalité != (js: !==)
    1 != 1 #  => faux
    2 != 1 #  => vrai

    # Comparaisons
    1 < 10 #  => vrai
    1 > 10 #  => faux
    2 <= 2 #  => vrai
    2 >= 2 #  => vrai

    # Les comparaisons peuvent etre mises bout à bout comme en Python/CoffeeScript
    1 < 2 < 3 #  => vrai
    2 < 3 < 2 #  => faux




