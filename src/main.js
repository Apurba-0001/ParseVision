import './styles/style.css';
import { createEditor } from './components/editor.js';
import { createOutputPanel } from './components/outputPanel.js';
import { createInspectAstPanel } from './components/inspectAstPanel.js';
import { showToast } from './components/toast.js';
import { parse } from './parser/parser.js';
import { exportTreeAsPng } from './visualizer/treeRenderer.js';

const app = document.querySelector('#app');

function calculateTreeMetrics(node) {
  let count = 0;
  let maxDepth = 0;
  function walk(current, depth) {
    if (!current || typeof current !== 'object') return;
    count += 1;
    if (depth > maxDepth) maxDepth = depth;
    if (current.type === 'BinaryExpression') {
      walk(current.left, depth + 1);
      walk(current.right, depth + 1);
    } else if (current.type === 'UnaryExpression') {
      walk(current.argument, depth + 1);
    }
  }
  walk(node, 1);
  return { count, maxDepth };
}

// App Header matching Stitch design specifications
app.innerHTML = `
  <header class="w-full px-gutter-desktop flex items-center justify-between h-14 bg-surface border-b border-outline-variant docked full-width top-0 shadow-sm z-30 flex-shrink-0">
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
          <span class="material-symbols-outlined text-base">account_tree</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-headline-md font-headline-md text-on-surface tracking-tight">ParseVision</span>
          <span class="text-label-code-sm font-label-code-sm px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-medium border border-outline-variant">AST Explorer</span>
        </div>
      </div>
      <!-- Navigation Links -->
      <nav class="hidden md:flex items-center gap-5 ml-4">
        <a class="text-primary font-headline-sm border-b-2 border-primary pb-1 transition-all duration-150" href="#explorer" id="nav-explorer">Explorer</a>
        <a class="text-on-surface-variant font-headline-sm pb-1 hover:text-primary hover:bg-surface-container transition-all duration-150 cursor-pointer" href="#traversals" id="nav-traversals">Traversals</a>
        <a class="text-on-surface-variant font-headline-sm pb-1 hover:text-primary hover:bg-surface-container transition-all duration-150 cursor-pointer" href="#grammar" id="nav-grammar">Grammar</a>
        <a class="text-on-surface-variant font-headline-sm pb-1 hover:text-primary hover:bg-surface-container transition-all duration-150 cursor-pointer" href="#export" id="nav-export-png">Export PNG</a>
      </nav>
    </div>
    <!-- Trailing Actions & Icons -->
    <div class="flex items-center gap-2.5">
      <div class="hidden lg:flex items-center gap-2 text-label-code-sm font-label-code-sm px-2.5 py-1 rounded-lg neu-recessed text-secondary mr-1" id="header-stats-pill" aria-live="polite">
        <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>Node Count: <strong id="header-node-count">5</strong></span>
        <span class="text-outline-variant">|</span>
        <span>Max Depth: <strong id="header-max-depth">3</strong></span>
      </div>
      <div class="hidden sm:flex items-center text-label-code-sm font-label-code-sm text-secondary px-2 py-1 rounded neu-micro">
        v1.4.0
      </div>
      <div class="flex items-center gap-1 border-l border-outline-variant pl-2.5">
        <button class="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant neu-micro transition-all duration-150 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" title="Inspect AST" aria-label="Inspect AST" type="button" id="header-btn-code">
          <span class="material-symbols-outlined text-sm">code</span>
        </button>
        <button class="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant neu-micro transition-all duration-150 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" title="Terminal REPL" type="button" id="header-btn-repl">
          <span class="material-symbols-outlined text-sm">terminal</span>
        </button>
        <button class="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant neu-micro transition-all duration-150 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" title="Workspace Settings" type="button" id="header-btn-settings">
          <span class="material-symbols-outlined text-sm">settings</span>
        </button>
      </div>
      <button class="ml-1 px-3 py-1.5 rounded-lg text-label-code-md font-label-code-md neu-micro text-secondary hover:text-primary transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" type="button" id="header-btn-export-png" title="Export AST as PNG image">
        <span class="material-symbols-outlined text-base">download</span>
        <span>Export PNG</span>
      </button>
      <button class="px-2.5 py-1.5 rounded-lg text-label-code-md font-label-code-md neu-micro text-secondary hover:text-primary transition-all duration-150 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" type="button" id="header-btn-clear">
        Clear
      </button>
      <button class="px-3.5 py-1.5 rounded-lg text-label-code-md font-label-code-md text-on-primary neu-button-primary transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" type="button" id="header-btn-generate">
        <span class="material-symbols-outlined text-base">play_arrow</span>
        <span>Generate AST</span>
      </button>
    </div>
  </header>
  <!-- Main Workspace -->
  <main class="flex-1 flex flex-col p-3 md:p-4 gap-3 max-w-[1720px] w-full mx-auto overflow-y-auto" id="pv-workspace-container"></main>
`;

const container = app.querySelector('#pv-workspace-container');
const headerNodeCount = app.querySelector('#header-node-count');
const headerMaxDepth = app.querySelector('#header-max-depth');
const headerBtnExportPng = app.querySelector('#header-btn-export-png');
const navExportPng = app.querySelector('#nav-export-png');
const navTraversals = app.querySelector('#nav-traversals');
const navGrammar = app.querySelector('#nav-grammar');
const navExplorer = app.querySelector('#nav-explorer');
const headerBtnClear = app.querySelector('#header-btn-clear');
const headerBtnGenerate = app.querySelector('#header-btn-generate');
const headerBtnCode = app.querySelector('#header-btn-code');
const headerBtnRepl = app.querySelector('#header-btn-repl');
const headerBtnSettings = app.querySelector('#header-btn-settings');

// Instantiate Components:
// 1. Toolbar & Expression Controller
// 2. AST Visualization Canvas with integrated Traversal Controls
const editor = createEditor({
  initialValue: 'a + b * 2',
  onSelectExample() {
    generate();
  }
});

const output = createOutputPanel();
const inspectAst = createInspectAstPanel({
  triggerButton: headerBtnCode
});
inspectAst.setTriggerButton(headerBtnCode);

// Mount panels to workspace container (bottom inspector completely removed from page layout)
container.append(editor.element, output.element);

// Mount modal popup outside the main workspace flow
document.body.appendChild(inspectAst.element);

let currentAst = null;

function updateExportState(hasAst) {
  if (headerBtnExportPng) {
    headerBtnExportPng.disabled = !hasAst;
    if (hasAst) {
      headerBtnExportPng.classList.remove('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
      headerBtnExportPng.classList.add('cursor-pointer');
      headerBtnExportPng.removeAttribute('aria-disabled');
      headerBtnExportPng.title = 'Export AST as PNG image';
    } else {
      headerBtnExportPng.classList.add('opacity-40', 'cursor-not-allowed', 'pointer-events-none');
      headerBtnExportPng.classList.remove('cursor-pointer');
      headerBtnExportPng.setAttribute('aria-disabled', 'true');
      headerBtnExportPng.title = 'No AST available to export';
    }
  }
}

function generate() {
  const source = editor.input.value.trim();
  const startTime = performance.now();

  try {
    const ast = parse(source);
    currentAst = ast;
    output.container.__currentAst = ast;
    if (typeof window !== 'undefined') {
      window.__parsevision_ast = ast;
    }
    updateExportState(true);

    const parseTime = Math.max(0.8, (performance.now() - startTime)).toFixed(1);

    // 1. Render AST Canvas with integrated traversal initialized
    output.updateAst(ast);

    const metrics = calculateTreeMetrics(ast);
    output.setMetrics(metrics.count, metrics.maxDepth);
    if (headerNodeCount) headerNodeCount.textContent = String(metrics.count);
    if (headerMaxDepth) headerMaxDepth.textContent = String(metrics.maxDepth);

    // 2. Update telemetry
    editor.setDiagnostic(true, '', parseTime);

    // 3. Update JSON Inspector
    inspectAst.update(ast, source);
  } catch (error) {
    currentAst = null;
    output.container.__currentAst = null;
    if (typeof window !== 'undefined') {
      window.__parsevision_ast = null;
    }
    updateExportState(false);

    output.clearAst();
    output.setMetrics(0, 0);
    if (headerNodeCount) headerNodeCount.textContent = '0';
    if (headerMaxDepth) headerMaxDepth.textContent = '0';

    editor.setDiagnostic(false, error.message || 'Syntax error');
    inspectAst.clear('No AST generated due to error.');
  }
}

function clear() {
  currentAst = null;
  output.container.__currentAst = null;
  if (typeof window !== 'undefined') {
    window.__parsevision_ast = null;
  }
  updateExportState(false);

  editor.input.value = '';
  output.clearAst();
  output.setMetrics(0, 0);
  if (headerNodeCount) headerNodeCount.textContent = '0';
  if (headerMaxDepth) headerMaxDepth.textContent = '0';

  editor.setDiagnostic(true, 'Editor cleared. Ready for input.', '0.0');
  inspectAst.clear();
  editor.input.focus();
}

// Event Listeners
editor.button.addEventListener('click', generate);
editor.clearButton.addEventListener('click', clear);
headerBtnGenerate.addEventListener('click', generate);
headerBtnClear.addEventListener('click', clear);

editor.input.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    generate();
  }
});

async function handleExportPng() {
  if (!currentAst) {
    showToast('No AST available to export.');
    return;
  }
  showToast('Generating PNG export...');
  try {
    const success = await exportTreeAsPng(output.container, 'parsevision-ast.png', currentAst);
    if (success) {
      showToast('AST PNG exported successfully!');
    } else {
      showToast('Failed to export PNG.');
    }
  } catch {
    showToast('Failed to export PNG.');
  }
}

if (headerBtnExportPng) {
  headerBtnExportPng.addEventListener('click', handleExportPng);
}

if (navExportPng) {
  navExportPng.addEventListener('click', (event) => {
    event.preventDefault();
    handleExportPng();
  });
}

if (navTraversals) {
  navTraversals.addEventListener('click', (event) => {
    event.preventDefault();
    output.element.scrollIntoView({ behavior: 'smooth' });
    output.focusTraversalControls();
    showToast('Traversal controls active in AST Canvas');
  });
}

if (navGrammar) {
  navGrammar.addEventListener('click', (event) => {
    event.preventDefault();
    showToast('Grammar: E → E + T | E - T | T; T → T * F | T / F | F; F → +F | -F | (E) | id | num');
  });
}

if (navExplorer) {
  navExplorer.addEventListener('click', (event) => {
    event.preventDefault();
    editor.input.focus();
  });
}

if (headerBtnCode) {
  headerBtnCode.addEventListener('click', () => {
    inspectAst.toggle();
  });
}

if (headerBtnRepl) {
  headerBtnRepl.addEventListener('click', () => {
    editor.input.focus();
    showToast('Focus moved to expression editor');
  });
}

if (headerBtnSettings) {
  headerBtnSettings.addEventListener('click', () => {
    showToast('Settings: LL(1) recursive descent parser active');
  });
}

// Initial parse on application load
generate();

if (typeof window !== 'undefined') {
  if (window.location.hash === '#inspect' || new URLSearchParams(window.location.search).has('inspect')) {
    inspectAst.open();
  }
}
