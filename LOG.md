# Development log

## 2026-10-19: Base project initialization

### Changes
- Established the ParseVision repository layout, npm scripts, ignore rules, and complete project documentation.
- Agreed the initial educational scope: arithmetic expressions only; no assignment, evaluator, backend, or persistence.
- Chose ES modules, a browser frontend, handwritten tokenizer, recursive-descent parser, plain-object AST, SVG rendering, Node built-in tests, Vite development serving, and separated modules.
- Implemented a minimal working tokenizer, parser, AST factories, traversals, SVG renderer, and expression UI with starter tests.

### Tests
- `npm install`: completed successfully; added 14 packages and audited 15 packages with 0 vulnerabilities. npm noted that the `esbuild` install script was blocked by local install-script policy, but Vite still started successfully.
- `npm test`: completed successfully on 2026-10-19 with 7 passing tests and 0 failures.
- `npm run dev -- --host 127.0.0.1`: Vite started successfully and reported `http://127.0.0.1:5173/` as ready.

### Issues
- No unresolved setup issues. The local npm policy warning about the blocked `esbuild` install script should be revisited only if a future environment cannot start Vite.

### Next Steps
- Begin the next milestone by expanding tokenizer and parser edge-case coverage, then improve the SVG visualization and traversal teaching UI.

## 2026-10-19: Tokenizer and AST foundations

### Changes
- Reworked `src/parser/tokenizer.js` to emit `NUMBER`, `IDENTIFIER`, `OPERATOR`, `PAREN`, and `EOF` tokens with zero-based `start` and exclusive `end` offsets.
- Added integer and decimal literal support for `12.5`, `.5`, and `5.`, raw numeric text preservation, whitespace handling, lexical source ranges, and explicit rejection of repeated-decimal malformed literals and unsupported characters.
- Strengthened AST factories with schema validation, identifier/operator validation, and a `literal(raw)` convenience form while preserving the compatible `literal(number, raw)` parser call.
- Updated the existing parser only to read `token.start` for diagnostics after the tokenizer contract change; its grammar and parsing behavior were not changed.
- Expanded tokenizer and AST tests and clarified token and numeric-literal rules in `PROJECT_CONTEXT.md`; marked the corresponding build milestones complete.

### Tests
- `npm test`: completed successfully with 13 passing tests, 0 failures, 0 skipped tests.
- `node --check src/parser/tokenizer.js`, `node --check src/parser/ast.js`, and `node --check src/parser/parser.js`: completed successfully.
- `git diff --check`: completed successfully with no whitespace errors in tracked changes.

### Issues
- None.

### Next Steps
- Implement or extend the recursive-descent parser milestone using the established `start`/`end` token contract and AST factories.

## 2026-10-19: Recursive-descent parser

### Changes
- Completed the recursive-descent parser for literals, identifiers, unary `+`/`-`, binary `+`, `-`, `*`, `/`, and nested parentheses.
- Centralized additive and multiplicative operator groups in `src/parser/grammar.js` and used them in parser precedence levels.
- Strengthened `ParseError` with zero-based `position`, `start`, and exclusive `end` offsets; parsing now explicitly rejects trailing input rather than returning a partial AST.
- Added comprehensive parser tests for numeric literals, identifiers, each binary operator, unary expressions, precedence, left associativity, nesting, whitespace, malformed expressions, parentheses, trailing tokens, and lexical-error propagation.
- Documented the parser error API and marked parser-core and parser-quality milestones complete.

### Tests
- `npm test`: completed successfully with 20 passing tests, 0 failures, 0 skipped tests.
- `node --check src/parser/parser.js` and `node --check src/parser/grammar.js`: completed successfully.
- `npm run dev -- --host 127.0.0.1`: Vite started successfully at `http://127.0.0.1:5174/`; it selected that port because 5173 was already in use.
- `git diff --check`: completed successfully with no reported whitespace errors.

### Issues
- None. A pre-existing process occupied port 5173 during the smoke test; Vite selected the next available local port automatically.

### Next Steps
- Implement the AST visualization milestone using SVG while keeping layout and presentation separate from parser logic.

## 2026-10-19: SVG AST visualizer

### Changes
- Replaced the starter renderer with a reusable SVG visualizer that calculates deterministic top-down positions from subtree widths before touching the DOM.
- Added rendered node labels, parent-child edge definitions, type-specific visual styles, dynamic label widths, accessible SVG labels, and explicit empty-state rendering.
- Integrated AST JSON and SVG generation with the expression editor, syntax-error recovery, horizontal scrolling for wide trees, and a clear/reset action.
- Added visualizer layout tests for all supported AST node kinds, node relationships, nesting, unsupported input, and every documented example expression.
- Updated project context, README capabilities, and build milestones to reflect the SVG implementation.

### Tests
- Existing suite before visualizer changes: `npm test` completed successfully with 20 passing tests and 0 failures.
- Final `npm test`: completed successfully with 26 passing tests, 0 failures, 0 skipped tests.
- `node --check src/visualizer/treeRenderer.js` and `node --check src/main.js`: completed successfully.
- `git diff --check`: completed successfully with no reported whitespace errors.
- `npm run dev -- --host 127.0.0.1 --port 5181`: Vite reported a ready local server at `http://127.0.0.1:5181/`.

### Issues
- The isolated in-app browser could not reach the loopback Vite server and returned `ERR_CONNECTION_TIMED_OUT`, so browser visual verification was not completed in this environment. Automated layout and integration checks passed.

### Next Steps
- Implement AST traversal algorithms and present their output without coupling traversal logic to SVG rendering.

## YYYY-MM-DD: Milestone title

### Changes
- Description of changes

### Tests
- Commands executed and actual results

### Issues
- Problems encountered or None

### Next Steps
- Planned next actions
