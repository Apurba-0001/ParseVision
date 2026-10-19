import './styles/style.css';
import { createEditor } from './components/editor.js';
import { createOutputPanel } from './components/outputPanel.js';
import { createErrorPanel } from './components/errorPanel.js';
import { parse } from './parser/parser.js';
import { renderEmptyTree, renderTree } from './visualizer/treeRenderer.js';

const app = document.querySelector('#app');
const editor = createEditor(); const output = createOutputPanel(); const errors = createErrorPanel();
app.innerHTML = '<header><p class="eyebrow">Interactive parsing lab</p><h1>ParseVision</h1><p>See how arithmetic expressions become abstract syntax trees.</p></header>';
const workspace = document.createElement('div'); workspace.className = 'workspace'; workspace.append(editor.element, output.element); app.append(workspace, errors.element);

function generate() {
  try {
    const ast = parse(editor.input.value);
    output.json.textContent = JSON.stringify(ast, null, 2);
    renderTree(output.svg, ast);
    errors.clear();
  } catch (error) {
    output.json.textContent = 'No AST generated.';
    renderEmptyTree(output.svg, 'Fix the expression to generate an AST.');
    errors.show(error.message);
  }
}

function clear() {
  editor.input.value = '';
  output.json.textContent = 'Enter an expression, then select Generate AST.';
  renderEmptyTree(output.svg);
  errors.clear();
  editor.input.focus();
}

editor.button.addEventListener('click', generate);
editor.clearButton.addEventListener('click', clear);
editor.input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') generate(); });
renderEmptyTree(output.svg);
