import { NODE_DIMENSIONS, NODE_STYLES } from './nodeStyles.js';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const SUPPORTED_TYPES = new Set(Object.keys(NODE_STYLES));

function assert(condition, message) {
  if (!condition) throw new TypeError(message);
}

function childrenFor(node) {
  assert(node !== null && typeof node === 'object', 'An AST node object is required for visualization.');
  assert(SUPPORTED_TYPES.has(node.type), `Unsupported AST node type "${node.type ?? 'unknown'}".`);
  if (node.type === 'BinaryExpression') {
    assert(typeof node.operator === 'string' && node.operator.length > 0, 'BinaryExpression requires an operator label.');
    return [node.left, node.right];
  }
  if (node.type === 'UnaryExpression') {
    assert(typeof node.operator === 'string' && node.operator.length > 0, 'UnaryExpression requires an operator label.');
    return [node.argument];
  }
  if (node.type === 'Identifier') {
    assert(typeof node.name === 'string' && node.name.length > 0, 'Identifier requires a name label.');
    return [];
  }
  assert(typeof node.raw === 'string' && node.raw.length > 0, 'Literal requires raw numeric text.');
  return [];
}

/** Return the concise text shown for an AST node. */
export function nodeLabel(node) {
  childrenFor(node);
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'Literal') return node.raw;
  return node.operator;
}

function nodeWidth(label) {
  return Math.max(NODE_DIMENSIONS.minWidth, label.length * 9 + NODE_DIMENSIONS.horizontalPadding * 2);
}

function buildSubtree(node, depth, path, ancestors) {
  assert(!ancestors.has(node), 'AST cannot contain a circular node reference.');
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(node);
  const label = nodeLabel(node);
  const children = childrenFor(node).map((child, index) => buildSubtree(child, depth + 1, `${path}.${index}`, nextAncestors));
  const childrenWidth = children.reduce((total, child) => total + child.subtreeWidth, 0)
    + Math.max(0, children.length - 1) * NODE_DIMENSIONS.siblingGap;
  return { id: path, type: node.type, label, depth, width: nodeWidth(label), subtreeWidth: Math.max(nodeWidth(label), childrenWidth), children };
}

function assignPositions(subtree, left, nodes, edges) {
  const x = left + subtree.subtreeWidth / 2;
  const y = NODE_DIMENSIONS.margin + subtree.depth * NODE_DIMENSIONS.levelGap;
  nodes.push({ id: subtree.id, type: subtree.type, label: subtree.label, x, y, width: subtree.width, height: NODE_DIMENSIONS.height });
  const childrenWidth = subtree.children.reduce((total, child) => total + child.subtreeWidth, 0)
    + Math.max(0, subtree.children.length - 1) * NODE_DIMENSIONS.siblingGap;
  let childLeft = left + (subtree.subtreeWidth - childrenWidth) / 2;
  for (const child of subtree.children) {
    edges.push({ from: subtree.id, to: child.id });
    assignPositions(child, childLeft, nodes, edges);
    childLeft += child.subtreeWidth + NODE_DIMENSIONS.siblingGap;
  }
}

/** Calculate deterministic top-down positions without using the DOM. */
export function layoutAst(ast) {
  const root = buildSubtree(ast, 0, 'root', new Set());
  const nodes = [];
  const edges = [];
  assignPositions(root, NODE_DIMENSIONS.margin, nodes, edges);
  const maximumDepth = Math.max(...nodes.map((node) => Math.round((node.y - NODE_DIMENSIONS.margin) / NODE_DIMENSIONS.levelGap)));
  return { nodes, edges, width: Math.ceil(root.subtreeWidth + NODE_DIMENSIONS.margin * 2), height: NODE_DIMENSIONS.margin * 2 + NODE_DIMENSIONS.height + maximumDepth * NODE_DIMENSIONS.levelGap };
}

function createSvgElement(svg, name) {
  return (svg.ownerDocument ?? document).createElementNS(SVG_NAMESPACE, name);
}

function prepareSvg(svg, width, height, label) {
  assert(svg && typeof svg.replaceChildren === 'function' && typeof svg.setAttribute === 'function', 'A target SVG element is required.');
  svg.replaceChildren();
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.style.minWidth = `${width}px`;
}

/** Render a visible, accessible empty state in a target SVG. */
export function renderEmptyTree(svg, message = 'Enter an expression and select Generate AST to view its tree.') {
  prepareSvg(svg, 480, 180, 'AST visualization is empty');
  const text = createSvgElement(svg, 'text');
  text.setAttribute('class', 'tree-empty-message');
  text.setAttribute('x', '240');
  text.setAttribute('y', '92');
  text.setAttribute('text-anchor', 'middle');
  text.textContent = message;
  svg.append(text);
}

/** Render an AST as an accessible SVG node-link tree, replacing prior content. */
export function renderTree(svg, ast) {
  const layout = layoutAst(ast);
  prepareSvg(svg, layout.width, layout.height, 'Abstract syntax tree visualization');
  const title = createSvgElement(svg, 'title');
  title.textContent = 'Abstract syntax tree visualization';
  svg.append(title);
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  for (const edge of layout.edges) {
    const parent = byId.get(edge.from);
    const child = byId.get(edge.to);
    const line = createSvgElement(svg, 'line');
    line.setAttribute('class', 'tree-edge');
    line.setAttribute('x1', String(parent.x));
    line.setAttribute('y1', String(parent.y + parent.height / 2));
    line.setAttribute('x2', String(child.x));
    line.setAttribute('y2', String(child.y - child.height / 2));
    svg.append(line);
  }
  for (const node of layout.nodes) {
    const style = NODE_STYLES[node.type];
    const group = createSvgElement(svg, 'g');
    group.setAttribute('class', `tree-node tree-node--${node.type}`);
    group.setAttribute('data-node-type', node.type);
    const rectangle = createSvgElement(svg, 'rect');
    rectangle.setAttribute('x', String(node.x - node.width / 2));
    rectangle.setAttribute('y', String(node.y - node.height / 2));
    rectangle.setAttribute('width', String(node.width));
    rectangle.setAttribute('height', String(node.height));
    rectangle.setAttribute('rx', String(NODE_DIMENSIONS.cornerRadius));
    rectangle.setAttribute('fill', style.fill);
    rectangle.setAttribute('stroke', style.stroke);
    group.append(rectangle);
    const text = createSvgElement(svg, 'text');
    text.setAttribute('x', String(node.x));
    text.setAttribute('y', String(node.y + 5));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', style.text);
    text.textContent = node.label;
    group.append(text);
    svg.append(group);
  }
}
