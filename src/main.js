import './styles/style.css';
import { createEditor } from './components/editor.js';
import { createOutputPanel } from './components/outputPanel.js';
import { createErrorPanel } from './components/errorPanel.js';
import { parse } from './parser/parser.js';
import { renderTree } from './visualizer/treeRenderer.js';

const app = document.querySelector('#app');
const editor = createEditor(); const output = createOutputPanel(); const errors = createErrorPanel();
app.innerHTML = '<header><p class="eyebrow">Interactive parsing lab</p><h1>ParseVision</h1><p>See how arithmetic expressions become abstract syntax trees.</p></header>';
const workspace = document.createElement('div'); workspace.className = 'workspace'; workspace.append(editor.element, output.element); app.append(workspace, errors.element);

function generate() {
  try { const ast = parse(editor.input.value); errors.clear(); output.json.textContent = JSON.stringify(ast, null, 2); renderTree(output.svg, ast); }
  catch (error) { output.json.textContent = 'No AST generated.'; output.svg.replaceChildren(); errors.show(error.message); }
}
editor.button.addEventListener('click', generate);
editor.input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') generate(); });
generate();
