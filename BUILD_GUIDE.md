# Two-week build guide

Run `npm install` first, then use `npm run dev` for the browser and `npm test` for automated checks. `npm run test:watch` is useful while changing parser modules. Install no additional dependency before documenting its purpose and decision.

| Day | Objective and files | Tasks | Validation / definition of done |
| --- | --- | --- | --- |
| 1 | Repository skeleton: root, `src/`, `tests/` | Establish package scripts, HTML shell, ignore rules, and context documents. | Manifests validate; structure exists. |
| 2 | Application shell: `main.js`, components, CSS | Compose a responsive editor and output layout. | `npm run dev` serves the page. |
| 3 | Tokenizer: `parser/tokenizer.js`, tests — **completed 2026-10-19** | Scan whitespace, integers and supported decimals, identifiers, operators, parentheses, exclusive source offsets, and EOF; reject invalid characters and repeated decimal points. | Valid, invalid, raw-text, offset, and EOF tests pass. |
| 4 | AST: `parser/ast.js`, context, tests — **completed 2026-10-19** | Stabilize validated factory shapes, numeric raw-text conversion, and nested expression composition. | Schema and invalid-argument tests match project context. |
| 5 | Parser core: `parser.js`, `grammar.js` — **completed 2026-10-19** | Implement primary, unary, multiplicative, additive parsing using the shared operator groups. | Literal, identifier, precedence, unary, and parentheses tests pass. |
| 6 | Parser quality: parser tests — **completed 2026-10-19** | Add left-associativity, malformed input, lexical-error propagation, and positional-error cases. | Error behavior is documented and tested. |
| 7 | SVG tree: `visualizer/` | Improve layout measurement, edges, labels, and empty states. | Representative trees render legibly. |
| 8 | SVG usability: CSS/components | Add accessible labels and inspect responsive behavior. | Keyboard and narrow-screen smoke checks complete. |
| 9 | Traversals: `traversal/traversal.js`, tests | Confirm preorder, inorder, postorder without mutation. | Exact traversal-order tests pass. |
| 10 | Traversal UI: components, `main.js` | Present selectable traversal output or explanation. | UI behavior has manual checks. |
| 11 | Syntax errors: parser/components | Improve concise messages, source positions, and recovery display. | Invalid input never crashes the UI. |
| 12 | Integration: all relevant files | Exercise representative expressions and clarify labels. | Parser/UI contract has no duplicate grammar logic. |
| 13 | Final quality: tests, docs | Expand edge-case tests; review accessibility and docs. | `npm test` is clean and docs reflect implementation. |
| 14 | Demonstration readiness: README, LOG | Perform final manual smoke test and record actual outcomes. | Demo path and limitations are documented. |

Each milestone is done only when its targeted files are reviewed, tests are run, actual outcomes are logged, and new behavior is reflected in `PROJECT_CONTEXT.md` and `README.md` where relevant. The intended dependency order is skeleton → tokenizer → AST → parser → tests → visualizer → traversal → error UX → integration → final review.
