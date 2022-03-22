# tiny-c

# A C compiler in javascript
tiny-c is a compiler for a small subset of C :blush: This implementation of [8 queens](Tests/8queens.c) is an example of what tiny-c can handle today. For more examples and features, check out the [Tests](Tests) directory 

## Usage
`node cc.js [<source file>]`

## Features

Generates x86-32 assembly in GAS syntax, which is then assembled and linked by GCC.<br>
Has support for

- Integers and Integer Arrays only
- `~`, `-`, `!` Unary Ops
- `+`, `-`, `*`, `/`, `&&`, `||`, `<`, `>`, `>=`, `<=`, `==`, `!=` Binary Ops
- All ops have precedence as defined by the C standard
- Local and Global variables
- For loops
- If Else conditionals and the `?:` operator
- C scoping
- Functions

## Implementation



