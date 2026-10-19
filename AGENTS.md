# ParseVision agent guide

## Purpose and architecture

ParseVision is an educational browser application that shows how arithmetic expressions become Abstract Syntax Trees (ASTs). The code is deliberately small: `src/parser/` converts source text into plain-object AST nodes, `src/traversal/` walks those nodes, `src/visualizer/` renders them to SVG, and `src/components/` contains focused DOM components. `src/main.js` composes the browser UI.

Before a significant change, read `PROJECT_CONTEXT.md`, `BUILD_GUIDE.md`, and `DECISIONS.md`. Inspect the existing implementation and tests before modifying any file. Keep documentation synchronized with actual behavior, and add a factual milestone to `LOG.md` after meaningful work.

## Working rules

- Use JavaScript ES modules and descriptive names; keep modules narrowly focused.
- Do not add React, TypeScript, a server, storage, or other architectural features without approval and a recorded decision.
- Keep parsing independent of DOM/SVG code. AST nodes must remain plain objects with the schemas in `PROJECT_CONTEXT.md`.
- The tokenizer must preserve source positions, ignore whitespace, reject invalid characters clearly, and not silently repair input.
- The parser must implement the documented grammar, precedence, and left associativity. Syntax failures must be useful `SyntaxError` subclasses with a position.
- Treat division by zero as evaluation/runtime work, not a parse error.
- Add or update Node built-in test-runner tests for every parser, tokenizer, AST, or traversal behavior change. Run `npm test` before handing off work.
- Keep dependencies minimal. Document every new dependency, its reason, and its lockfile change; never hand-edit `package-lock.json`.
- Preserve unrelated work, avoid unrelated features, and do not commit unless asked.

## Directory responsibilities

`src/parser/` owns grammar, tokens, AST factories, and parsing. `src/traversal/` owns tree-order algorithms. `src/visualizer/` owns SVG layout and node styling. `src/components/` owns small DOM builders. `tests/` mirrors testable behavior. Root Markdown files are the project’s current technical record.
