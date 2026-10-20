import './styles/style.css';
import { createEditor } from './components/editor.js';
import { createOutputPanel } from './components/outputPanel.js';
import { createTraversalPanel } from './components/traversalPanel.js';
import { createErrorPanel } from './components/errorPanel.js';
import { parse } from './parser/parser.js';
import { renderEmptyTree, renderTree } from './visualizer/treeRenderer.js';
import { inorder, postorder, preorder } from './traversal/traversal.js';

const app = document.querySelector('#app');
const errors = createErrorPanel();

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

const editor = createEditor({
  initialValue: 'a + b * 2',
  onSelectExample() {
    generate();
  }
});
const output = createOutputPanel();
const traversals = createTraversalPanel();

app.innerHTML = `
  <header>
    <p class="eyebrow">Interactive parsing lab</p>
    <h1>ParseVision</h1>
    <p>See how arithmetic expressions become abstract syntax trees.</p>
  </header>
`;

// Insert the error panel directly into the editor panel for immediate visibility
editor.element.insertBefore(errors.element, editor.element.querySelector('.examples-container'));

const workspace = document.createElement('div');
workspace.className = 'workspace';
workspace.append(editor.element, output.element);
app.append(workspace, traversals.element);

function generate() {
  try {
    const source = editor.input.value;
    const ast = parse(source);

    // Update outputs with new successful parse
    output.json.textContent = JSON.stringify(ast, null, 2);
    renderTree(output.svg, ast);
    errors.clear();

    const metrics = calculateTreeMetrics(ast);
    editor.setStatus(`AST generated successfully (${metrics.count} nodes, tree depth ${metrics.maxDepth}).`);

    // Calculate and update traversals with isolated failure handling
    try {
      const pre = preorder(ast);
      const inord = inorder(ast);
      const post = postorder(ast);
      traversals.update({ preorder: pre, inorder: inord, postorder: post });
    } catch (traversalError) {
      traversals.showError(`Traversal error: ${traversalError.message}`);
    }
  } catch (error) {
    // Clear stale outputs on failure to prevent displaying outdated state
    output.json.textContent = 'No AST generated due to error.';
    try {
      renderEmptyTree(output.svg, 'Fix the expression to generate an AST.');
    } catch {
      // SVG error recovery
    }
    traversals.clear('Fix the expression to generate an AST and inspect traversals.');
    editor.clearStatus();
    errors.show(error);
  }
}

function clear() {
  editor.input.value = '';
  output.json.textContent = 'Enter an expression, then select Generate AST.';
  renderEmptyTree(output.svg);
  traversals.clear('Enter an expression, then select Generate AST to inspect traversals.');
  errors.clear();
  editor.setStatus('Editor cleared. Ready for input.');
  editor.input.focus();
}

editor.button.addEventListener('click', generate);
editor.clearButton.addEventListener('click', clear);
editor.input.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    generate();
  }
});

// Initial empty state before first parse
renderEmptyTree(output.svg);
