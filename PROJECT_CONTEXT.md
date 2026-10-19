# ParseVision project context

## Goals, users, and boundaries

ParseVision teaches students, beginners, and instructors how arithmetic source expressions map to ASTs. It should support demonstrations of lexing, parsing, precedence, associativity, tree shape, and traversal. It is a static browser application, not a compiler, backend service, calculator, IDE, or general-purpose language implementation. Variable assignment, function calls, evaluation, storage, and accounts are deferred.

## Functional requirements

- Accept a source expression in the browser.
- Ignore whitespace; tokenize numbers, identifiers, arithmetic operators, and parentheses.
- Build a documented AST using recursive descent.
- Show an AST as formatted JSON and basic SVG.
- Provide preorder, inorder, and postorder module exports for future UI use.
- Report malformed input, unexpected tokens, invalid characters, and missing parentheses with source positions.

## Non-functional requirements

The application must be beginner-friendly, responsive, dependency-light, modular, testable in Node, and usable in modern browsers. Parsing must not depend on DOM state. Documentation, tests, and code must agree on the AST schema.

## Initial language grammar

```text
Expression     → Additive
Additive       → Multiplicative (("+" | "-") Multiplicative)*
Multiplicative → Unary (("*" | "/") Unary)*
Unary          → ("+" | "-") Unary | Primary
Primary        → NUMBER | IDENTIFIER | "(" Expression ")"
```

Binary `+` and `-` have precedence 1; binary `*` and `/` have precedence 2. Each binary level is left associative, so `a - b - c` means `(a - b) - c`. Unary `+` and `-` bind tighter than all binary operators and recurse rightward, so `--a` is valid. Parentheses override ordinary precedence.

## Tokens and AST schema

The tokenizer emits `NUMBER`, `IDENTIFIER`, `OPERATOR`, `PAREN`, and terminal `EOF` tokens. Every token includes zero-based `start` and exclusive `end` offsets. `NUMBER` tokens also have a numeric `value` and preserve their original source spelling as `raw`; for example `.5` becomes `{ type: 'NUMBER', value: 0.5, raw: '.5', start: 0, end: 2 }`. `EOF` has `start` and `end` equal to the source length. Identifier names begin with an ASCII letter or `_`, then may contain letters, digits, or `_`.

AST nodes are plain JavaScript objects:

```js
{ type: 'BinaryExpression', operator: '+', left: Node, right: Node }
{ type: 'UnaryExpression', operator: '-', argument: Node }
{ type: 'Identifier', name: 'a' }
{ type: 'Literal', value: 2, raw: '2' }
```

Thus `a + b * 2` produces:

```js
{
  type: 'BinaryExpression', operator: '+',
  left: { type: 'Identifier', name: 'a' },
  right: {
    type: 'BinaryExpression', operator: '*',
    left: { type: 'Identifier', name: 'b' },
    right: { type: 'Literal', value: 2, raw: '2' }
  }
}
```

## Responsibilities and behavior

The tokenizer converts source safely and rejects invalid characters or malformed numbers. Decimal literals allow one decimal point with digits on at least one side: `12.5`, `.5`, and `5.` are valid. A second decimal point in the same numeric literal, such as `1.2.3` or `7..`, is rejected as a lexical error with its source range. The parser consumes its tokens according to the grammar and produces only the schema above. Its `parse(source)` API returns a complete AST or throws: `ParseError` includes zero-based `position`, `start`, and exclusive `end` offsets for syntax failures, while tokenizer errors retain their lexical range. It rejects empty or malformed expressions, trailing/unexpected tokens, absent operands, and missing closing parentheses. Whitespace has no meaning. Division by zero is not syntax-invalid; it is a future evaluation/runtime concern.

The visualizer consumes an already-parsed AST without reparsing source. It calculates a deterministic top-down layout from subtree widths, then renders parent-child edges and style-distinguished binary, unary, identifier, and literal nodes into SVG. Parent nodes are centered over their child subtree; wide trees use a responsive `viewBox` and horizontal scroll container. Invalid AST shapes are rejected with useful errors. Traversal functions must return nodes in preorder, inorder, or postorder and must not mutate the AST.

## Acceptance criteria

The repository has the documented module layout; `npm run dev`, `npm test`, and `npm run test:watch` are valid; tests cover real tokenizer/parser/AST/traversal behavior; `a + b * 2` has the shown shape; invalid input reports a useful positional error; and the browser displays an AST without framework or backend dependencies.

## Constraints, assumptions, and deferred work

Use ES modules, Node/npm, HTML/CSS/SVG, Git, and the Node test runner. Vite is allowed solely for local serving. Assume a modern browser and Node 20+. Deferred work: assignments, calls, strings, comments, implicit multiplication, exponentiation, evaluation, runtime values, persistence, animation, complex layouts, and multilingual UI.
