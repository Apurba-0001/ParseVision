# ParseVision | AST Generator & Visualizer

ParseVision is an educational web application for exploring how arithmetic expressions are tokenized, parsed, and represented as Abstract Syntax Trees (ASTs). It is designed for learners who benefit from seeing the relationship between source text, tree structure, and traversal order.

## Problem and objectives

Expression syntax can feel opaque when it is only described by precedence rules. ParseVision makes those rules observable. Its initial objectives are to accept a small arithmetic language, build a correct plain-object AST, report syntax problems at a source position, and render the AST in a browser.

## Scope and status

Implemented: a handwritten tokenizer; recursive-descent parser for numbers, identifiers, parentheses, unary `+`/`-`, and binary `+`, `-`, `*`, `/`; AST factories; preorder, inorder, and postorder traversal algorithms; an interactive SVG AST visualizer; an educational traversal results panel with order explanations; a responsive browser UI; and comprehensive unit tests. The visualizer centers parents above their child subtrees, uses type-specific node colors, replaces stale trees on each submission, provides an accessible empty state, and permits horizontal scrolling for wide expressions. The traversal panel updates deterministically on successful parsing, clears on syntax errors, and isolates traversal failures without crashing the application.

Planned work includes token-stream display, selectable traversal animation, more polished error guidance, accessibility review, and additional educational examples. This project does not yet evaluate expressions, persist examples, support assignments, or support a full programming language.


## Technology stack

- JavaScript ES modules, HTML5, CSS3, and browser SVG
- Node.js with npm
- Vite, the only external dependency, for reliable local development serving
- Node.js built-in test runner for unit tests

## Architecture and repository layout

Source text flows through `tokenizer.js` → `parser.js` → plain-object AST → traversal or SVG renderer. Browser orchestration stays in `main.js` and components; parser modules contain no DOM code.

```text
ParseVision/
├── index.html                 # Application entry page
├── src/
│   ├── parser/                # Tokens, grammar, AST factories, parser
│   ├── traversal/             # Traversal algorithms
│   ├── visualizer/            # SVG layout and styling
│   ├── components/            # Small UI builders
│   └── main.js, styles/       # Composition and presentation
├── tests/                     # Node built-in test-runner tests
└── *.md                       # Context, plan, decisions, and log
```

## Prerequisites and installation

Use Node.js 20 or later and npm. From the repository root:

```bash
npm install
```

## Development and testing

```bash
npm run dev
npm run build
npm test
npm run test:watch
```

`npm run dev` starts Vite’s local development server. `npm run build` compiles and bundles the production distribution into `dist/`. `npm test` runs every test in `tests/` once using the Node.js built-in test runner. `npm run test:watch` reruns tests as files change.

## Example

Input: `a + b * 2`

Expected AST (abbreviated):

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

`*` is nested under the right side of `+` because multiplication has higher precedence.

### Traversal outputs

- **Preorder (Node → Left → Right):**
  ```text
  BinaryExpression(+)
  Identifier(a)
  BinaryExpression(*)
  Identifier(b)
  Literal(2)
  ```

- **Inorder (Left → Node → Right):**
  ```text
  Identifier(a)
  BinaryExpression(+)
  Identifier(b)
  BinaryExpression(*)
  Literal(2)
  ```
  *(Note: For unary expressions, the operator is visited before the operand by documented convention, as inorder traversal is formally defined on binary trees).*

- **Postorder (Left → Right → Node):**
  ```text
  Identifier(a)
  Identifier(b)
  Literal(2)
  BinaryExpression(*)
  BinaryExpression(+)
  ```

## Known limitations

The renderer intentionally does not yet pan, zoom, or animate tree transitions. The UI displays JSON, interactive SVG, and complete traversal sequences, but does not yet display raw token streams. Division is parsed but never evaluated, so division-by-zero handling is deferred. Identifiers are syntax only; no variable environment exists.


## Two-week roadmap

Days 1–2 establish the skeleton and context; days 3–4 strengthen tokenization and AST coverage; days 5–6 deepen parser and error tests; days 7–8 improve SVG layout; days 9–10 add traversal demonstrations; days 11–12 integrate usability and error feedback; days 13–14 perform accessibility checks, final testing, and documentation review. See `BUILD_GUIDE.md` for the actionable day-by-day plan.

## Future enhancements

Possible approved extensions include token-stream display, traversal animation, expression evaluation with runtime diagnostics, downloadable examples, keyboard-focused visualization controls, and carefully documented grammar extensions.
