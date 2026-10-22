# ParseVision | AST Explorer

ParseVision is a professional, educational browser workspace for exploring how arithmetic expressions are tokenized, parsed, and represented as Abstract Syntax Trees (ASTs). Designed for learners, educators, and developers, it transforms abstract grammar rules and tree traversals into an interactive, visual experience.

> *"Understand the structure behind every expression."*

---

## Key Features

- **Light Neumorphic Workspace:** Restrained dual-light shadows, inset input surfaces, clear typography, and WCAG AA contrast designed specifically for code and AST exploration.
- **Visual AST as Hero:** The SVG syntax tree is the focal center of the application, featuring interactive zoom controls (`+`, `-`, `100%` reset, `Fit` view), dynamic node count and tree depth metrics, a color-coded node legend, and direct node-click interaction to jump traversal sequences.
- **Interactive Traversal Explorer:**
  - Supports **Preorder**, **Inorder**, and **Postorder** traversals.
  - Interactive playback controls: **Reset (↺)**, **Previous (◀)**, **Play / Pause (▶ / ⏸)**, **Next (▶)**, **End (⏭)**, and configurable playback speed (`0.5x`, `1x`, `2x`).
  - **Tree-Synchronized Highlights:** The currently visited AST node pulses with an active highlight while numbered visit badges (`1`, `2`, `3`...) appear dynamically on visited tree nodes.
  - **Bidirectional Synchronization:** Click any tree node to jump to its traversal step, or click any sequence pill to highlight its tree node.
  - Contextual step evaluation banner showing current subexpression details.
  - One-click **Copy Sequence** action and **Export SVG** with floating toast feedback.
- **On-Demand "Inspect AST" Drawer:** The raw JSON representation is housed in a collapsible disclosure panel, keeping the primary workspace clean while providing formatted JSON, node metric counters, payload size, and one-click clipboard copying.
- **Preset Example Expressions:** Rapidly load and explore canonical expressions:
  - `a + b * 2`
  - `(a + b) * 2`
  - `10 - 4 - 2`
  - `-(a + 3) * 2`
  - `total / count + 5`
- **Helpful Error Diagnostics:** Precise syntax and lexical errors reported with zero-based character offsets (`at character X.`) while suppressing raw stack traces. Automatic stale result clearance ensures broken expressions never show outdated trees.
- **Keyboard Navigation & Accessibility:** Full keyboard support including `Ctrl + Enter` (or `Cmd + Enter`) to parse, interactive tree node activation (`Enter`/`Space`), ARIA roles, focus rings, and `@media (prefers-reduced-motion: reduce)` support.

---

## Technology Stack

- **Core:** Native JavaScript ES modules (`"type": "module"`), HTML5, and CSS3
- **Visualization:** Scalable Vector Graphics (SVG) with pure layout calculation
- **Development Tooling:** Vite (sole dev dependency for fast HMR and bundling)
- **Testing:** Node.js built-in test runner (`node:test`, `node:assert/strict`)

---

## Architecture and Repository Layout

Source text flows through `tokenizer.js` → `parser.js` → plain-object AST → tree layout or traversal algorithms. The parsing and traversal engines remain 100% decoupled from DOM/SVG rendering.

```text
ParseVision/
├── index.html                 # Application entry page
├── src/
│   ├── parser/                # Tokenizer, grammar, AST factories, parser
│   ├── traversal/             # Preorder, Inorder, and Postorder algorithms
│   ├── visualizer/            # Deterministic SVG tree layout and styling
│   ├── components/            # Focused DOM components:
│   │   ├── editor.js          # Expression editor & example chips
│   │   ├── outputPanel.js     # Hero AST canvas with zoom, fit & metrics
│   │   ├── traversalExplorer.js # Interactive playback, speeds & visit badges
│   │   ├── inspectAstPanel.js # Collapsible JSON inspection drawer
│   │   ├── errorPanel.js      # Accessible inline error alerts
│   │   └── toast.js           # Floating toast notification utility
│   ├── styles/style.css       # Light Neumorphic Design System stylesheet
│   └── main.js                # Composition root & event orchestration
├── tests/                     # 72 automated tests (unit & integration)
└── *.md                       # Design system, audit, decisions, and log
```

---

## Getting Started

### Prerequisites

Node.js 20 or later and npm.

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Open `http://localhost:5173` to explore the workspace.

### Production Build

```bash
npm run build
```

Compiles and bundles production-ready assets into the `dist/` directory.

### Running Tests

```bash
npm test
```

Executes the complete test suite (72 tests across 7 test files) with 0 external test framework dependencies.

To run tests in watch mode during development:

```bash
npm run test:watch
```

---

## Canonical Example: `a + b * 2`

Tree Structure:
```text
        +
       / \
      a   *
         / \
        b   2
```

Multiplication binds tighter than addition, placing `+` at the root and `*` in the right subtree.

### Traversal Sequences

1. **Preorder (Node → Left → Right):**
   `+` → `a` → `*` → `b` → `2`
2. **Inorder (Left → Node → Right):**
   `a` → `+` → `b` → `*` → `2`
3. **Postorder (Left → Right → Node):**
   `a` → `b` → `2` → `*` → `+`

*(Note: Unary operators visit operator before operand in Inorder traversal by documented compiler convention).*

---

## Known Boundaries

- ParseVision is an educational syntax explorer, not a runtime calculator or full programming language interpreter.
- Division by zero (e.g. `10 / 0`) is parsed and visualized correctly as valid syntax; evaluation checks are intentionally deferred.
- No backend, external database, or account tracking is used.
