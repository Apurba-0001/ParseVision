# Initial architecture decisions

These are initial decisions, not permanent constraints. Record future changes here with date, status, context, decision, rationale, and consequences; update related context and implementation in the same change.

## ADR-001: JavaScript ES modules

- **Status:** Accepted (initial).
- **Context:** Browser code and Node tests need one consistent module format.
- **Decision:** Use native JavaScript ES modules with `"type": "module"`.
- **Rationale:** It is modern, readable, and avoids a build-transpilation layer.
- **Consequences:** Imports use explicit `.js` paths; Node must support ESM.

## ADR-002: Browser-based frontend

- **Status:** Accepted (initial).
- **Context:** The application teaches visual parsing interactively.
- **Decision:** Deliver a static browser frontend with no backend.
- **Rationale:** Local, simple, and sufficient for the initial learning objective.
- **Consequences:** No accounts, persistence, or server-side evaluation.

## ADR-003: Handwritten tokenizer

- **Status:** Accepted (initial).
- **Context:** Learners benefit from transparent lexical rules.
- **Decision:** Scan source text directly in `tokenizer.js`.
- **Rationale:** It is small, testable, and exposes token positions clearly.
- **Consequences:** Grammar extensions require explicit scanner work.

## ADR-004: Recursive-descent parser

- **Status:** Accepted (initial).
- **Context:** The grammar has clear precedence layers.
- **Decision:** Implement one parser method per grammar level.
- **Rationale:** It maps directly to the educational grammar and gives useful errors.
- **Consequences:** Major grammar changes may warrant reconsideration.

## ADR-005: Plain-object AST nodes

- **Status:** Accepted (initial).
- **Context:** Trees must be easy to inspect in JSON and tests.
- **Decision:** Use documented object literals and factory functions.
- **Rationale:** No classes or serialization work are needed.
- **Consequences:** Schema discipline relies on tests and documentation.

## ADR-006: SVG visualization

- **Status:** Accepted (initial).
- **Context:** ASTs are node-link diagrams requiring crisp scalable drawing.
- **Decision:** Render tree edges and nodes with browser SVG.
- **Rationale:** SVG is native, inspectable, accessible, and dependency-free.
- **Consequences:** Advanced layout, pan, and zoom are future work.

## ADR-007: Node.js built-in testing

- **Status:** Accepted (initial).
- **Context:** The project needs low-friction unit tests.
- **Decision:** Use `node --test` and `node:assert/strict`.
- **Rationale:** This avoids a separate test framework.
- **Consequences:** Browser/UI tests need a later, explicitly chosen strategy.

## ADR-008: Minimal external dependencies

- **Status:** Accepted (initial).
- **Context:** A two-week educational project should remain understandable.
- **Decision:** Use only Vite as a development dependency.
- **Rationale:** It supplies a dependable local server while production logic stays native.
- **Consequences:** New dependencies require documented benefit and lockfile updates.

## ADR-009: Separation of concerns

- **Status:** Accepted (initial).
- **Context:** Parsing, visualization, traversal, and UI evolve at different rates.
- **Decision:** Keep them in separate `src/` modules with `main.js` as composition root.
- **Rationale:** It supports focused testing and avoids DOM-coupled parser logic.
- **Consequences:** Interfaces must remain documented and coordinated.

## ADR-010: AST traversal algorithms and unary inorder convention

- **Status:** Accepted (2026-10-19).
- **Context:** Students and educators need observable representations of AST traversal orders (preorder, inorder, postorder). Binary expressions have standard left/operator/right orders, but unary expressions (e.g. `-x`) have only one operand, while inorder traversal is formally defined for binary trees.
- **Decision:** Implement pure, non-mutating traversal algorithms in `src/traversal/traversal.js` that return deterministic arrays of structured node labels (`Identifier(name)`, `Literal(raw)`, `BinaryExpression(op)`, `UnaryExpression(op)`). For unary expressions, inorder traversal visits the operator before its operand by documented educational convention. Provide an optional `{ asNodes: true }` mode for raw AST node access.
- **Rationale:** Structured string labels match user educational requirements directly, prevent AST mutation, and simplify test assertions. Documenting the unary inorder convention makes compiler design trade-offs transparent to students.
- **Consequences:** Traversal functions strictly validate all AST structures, reject malformed nodes, catch circular references, and isolate UI presentation from traversal calculations.
