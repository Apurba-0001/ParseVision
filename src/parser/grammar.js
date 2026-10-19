/** The grammar displayed in documentation and implemented by Parser. */
export const GRAMMAR = `Expression     → Additive
Additive       → Multiplicative (("+" | "-") Multiplicative)*
Multiplicative → Unary (("*" | "/") Unary)*
Unary          → ("+" | "-") Unary | Primary
Primary        → NUMBER | IDENTIFIER | "(" Expression ")"`;

export const PRECEDENCE = Object.freeze({ '+': 1, '-': 1, '*': 2, '/': 2 });
export const ADDITIVE_OPERATORS = Object.freeze(new Set(['+', '-']));
export const MULTIPLICATIVE_OPERATORS = Object.freeze(new Set(['*', '/']));
export const UNARY_OPERATORS = Object.freeze(new Set(['+', '-']));
