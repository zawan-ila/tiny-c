# tiny-c
---
# A C compiler in javascript
---
tiny-c is a compiler for enough of C to compile 8-queens :blush: This implementation of [https://github.com/zawan-ila/tiny-c/blob/master/Tests/8queens.c](8 queens) is an example of what tiny-c can handle today. For more examples and features, check out the [https://github.com/zawan-ila/tiny-c/blob/master/Tests](Tests) directory 

## Details

Generates x86-32 assembly in GAS syntax, which is then assembled and linked by GCC.

# Features

- Integers and Integer Arrays only
- `~`, `-`, `!` Unary Ops
- `+`, `-`, `*`, `/`, `&&`, `||`, `<`, `>`, `>=`, `<=`, `==`, `!=` Binary Ops
- All ops have precedence as defined by the C standard
- Local and Global variables
- For loops
- If Else conditionals and the `?:` operator
- C scoping
- Functions



