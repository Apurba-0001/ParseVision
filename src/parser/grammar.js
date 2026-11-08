/** The grammar displayed in documentation and implemented by Parser. */
export const GRAMMAR = `A  → id = A | E
E  → T E'
E' → + T E' | - T E' | ε
T  → U T'
T' → * U T' | / U T' | % U T' | ε
U  → + U | - U | X
X  → P ** U | P ^ U | P
P  → ( A ) | id | num`;

export const PRECEDENCE = Object.freeze({
  '=': 1,
  '+': 2,
  '-': 2,
  '*': 3,
  '/': 3,
  '%': 3,
  '**': 4,
  '^': 4
});

export const ASSIGNMENT_OPERATORS = Object.freeze(new Set(['=']));
export const ADDITIVE_OPERATORS = Object.freeze(new Set(['+', '-']));
export const MULTIPLICATIVE_OPERATORS = Object.freeze(new Set(['*', '/', '%']));
export const EXPONENTIATION_OPERATORS = Object.freeze(new Set(['**', '^']));
export const UNARY_OPERATORS = Object.freeze(new Set(['+', '-']));
export const UNSUPPORTED_OPERATORS = Object.freeze(new Set(['==', '!=', '<=', '>=', '<', '>', '&&', '||', '!']));
