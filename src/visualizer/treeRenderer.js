import { NODE_STYLES } from './nodeStyles.js';

const labelFor = (node) => node.type === 'BinaryExpression' || node.type === 'UnaryExpression' ? node.operator : node.type === 'Identifier' ? node.name : node.raw;

function layout(node, depth = 0, state = { nextX: 55, entries: [] }) {
  const children = node.type === 'BinaryExpression' ? [node.left, node.right] : node.type === 'UnaryExpression' ? [node.argument] : [];
  const childEntries = children.map((child) => layout(child, depth + 1, state));
  const x = childEntries.length ? childEntries.reduce((sum, child) => sum + child.x, 0) / childEntries.length : state.nextX;
  if (!childEntries.length) state.nextX += 110;
  const entry = { node, x, y: 48 + depth * 105, children: childEntries };
  state.entries.push(entry); return entry;
}

/** Render an AST into an SVG element, replacing its current contents. */
export function renderTree(svg, ast) {
  svg.replaceChildren();
  if (!ast) return;
  const root = layout(ast);
  const entries = [];
  const collect = (entry) => { entries.push(entry); entry.children.forEach(collect); };
  collect(root);
  const width = Math.max(360, ...entries.map((entry) => entry.x + 55));
  const height = Math.max(160, ...entries.map((entry) => entry.y + 55));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('aria-label', 'Abstract syntax tree');
  for (const entry of entries) for (const child of entry.children) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', entry.x); line.setAttribute('y1', entry.y + 22); line.setAttribute('x2', child.x); line.setAttribute('y2', child.y - 22); line.setAttribute('class', 'tree-edge'); svg.append(line);
  }
  for (const entry of entries) {
    const style = NODE_STYLES[entry.node.type];
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', entry.x); circle.setAttribute('cy', entry.y); circle.setAttribute('r', '24'); circle.setAttribute('fill', style.fill); circle.setAttribute('stroke', style.stroke); group.append(circle);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', entry.x); text.setAttribute('y', entry.y + 5); text.setAttribute('text-anchor', 'middle'); text.textContent = labelFor(entry.node); group.append(text); svg.append(group);
  }
}
