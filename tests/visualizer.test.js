import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from '../src/parser/parser.js';
import { layoutAst, nodeLabel, childrenFor, buildExportSvg, exportTreeAsPng, setTreeZoom } from '../src/visualizer/treeRenderer.js';
import { getNodeStyle, ROOT_NODE_STYLE, NODE_STYLES } from '../src/visualizer/nodeStyles.js';

test('visualizer layout supports literal and identifier nodes', () => {
  const literal = layoutAst(parse('12.5'));
  const identifier = layoutAst(parse('total'));
  assert.deepEqual(literal.nodes.map(({ type, label }) => ({ type, label })), [{ type: 'Literal', label: '12.5' }]);
  assert.deepEqual(identifier.nodes.map(({ type, label }) => ({ type, label })), [{ type: 'Identifier', label: 'total' }]);
  assert.equal(literal.edges.length, 0);
});

test('visualizer layout connects unary parent above its child', () => {
  const layout = layoutAst(parse('-value'));
  assert.deepEqual(layout.nodes.map(({ id, type, label }) => ({ id, type, label })), [
    { id: 'root', type: 'UnaryExpression', label: '-' },
    { id: 'root.0', type: 'Identifier', label: 'value' }
  ]);
  assert.deepEqual(layout.edges, [{ from: 'root', to: 'root.0' }]);
  assert.ok(layout.nodes[0].y < layout.nodes[1].y);
});

test('visualizer layout places binary parents above separate child subtrees', () => {
  const layout = layoutAst(parse('a + b * 2'));
  const byId = new Map(layout.nodes.map((node) => [node.id, node]));
  assert.deepEqual(layout.edges, [
    { from: 'root', to: 'root.0' },
    { from: 'root', to: 'root.1' },
    { from: 'root.1', to: 'root.1.0' },
    { from: 'root.1', to: 'root.1.1' }
  ]);
  assert.equal(byId.get('root').label, '+');
  assert.equal(byId.get('root.1').label, '*');
  assert.ok(byId.get('root').y < byId.get('root.1').y);
  assert.ok(byId.get('root.0').x < byId.get('root.1').x);
  assert.ok(byId.get('root.1.0').x < byId.get('root.1.1').x);
});

test('visualizer layout represents nested expressions with usable dimensions', () => {
  const layout = layoutAst(parse('-(a + 3) * (total / count + 5)'));
  assert.equal(layout.nodes.length, 10);
  assert.equal(layout.edges.length, 9);
  assert.ok(layout.width > 300);
  assert.ok(layout.height > 200);
});

test('visualizer lays out every documented example expression', () => {
  for (const expression of ['a + b * 2', '(a + b) * 2', '10 - 4 - 2', '-(a + 3) * 2', 'total / count + 5']) {
    const layout = layoutAst(parse(expression));
    assert.ok(layout.nodes.length > 1, expression);
    assert.equal(layout.edges.length, layout.nodes.length - 1, expression);
    assert.ok(layout.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y)), expression);
  }
});

test('visualizer rejects empty, unsupported, and malformed AST nodes', () => {
  assert.throws(() => layoutAst(null), /AST node object is required/);
  assert.throws(() => layoutAst({ type: 'CallExpression' }), /Unsupported AST node type/);
  assert.throws(() => nodeLabel({ type: 'Identifier', name: '' }), /requires a name label/);
});

test('visualizer correctly handles NumericLiteral leaf nodes and preserves label', () => {
  const numericNode = { type: 'NumericLiteral', value: 42, raw: '42' };
  assert.deepEqual(childrenFor(numericNode), []);
  assert.equal(nodeLabel(numericNode), '42');
  const layout = layoutAst(numericNode);
  assert.equal(layout.nodes.length, 1);
  assert.equal(layout.nodes[0].label, '42');
  assert.equal(layout.nodes[0].depth, 0);
  assert.equal(layout.edges.length, 0);
});

test('visualizer rejects Root pseudo-type as an unsupported AST node type in childrenFor', () => {
  assert.throws(() => childrenFor({ type: 'Root' }), /Unsupported AST node type "Root"/);
});

test('visualizer layoutAst includes accurate depth for all nodes', () => {
  const layout = layoutAst(parse('a + b * 2'));
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));
  assert.equal(byId.get('root').depth, 0);
  assert.equal(byId.get('root.0').depth, 1);
  assert.equal(byId.get('root.1').depth, 1);
  assert.equal(byId.get('root.1.0').depth, 2);
  assert.equal(byId.get('root.1.1').depth, 2);
});

test('visualizer positions operators strictly by AST structure and left-associativity', () => {
  const layout = layoutAst(parse('10 - 4 - 2'));
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));
  assert.equal(byId.get('root').label, '-');
  assert.equal(byId.get('root.0').label, '-');
  assert.equal(byId.get('root.1').label, '2');
  assert.equal(byId.get('root.0.0').label, '10');
  assert.equal(byId.get('root.0.1').label, '4');
  assert.ok(byId.get('root').y < byId.get('root.0').y);
  assert.ok(byId.get('root.0').y < byId.get('root.0.0').y);
});

test('visualizer color palette ensures root distinction and unique node type colors', () => {
  const rootStyle = getNodeStyle('BinaryExpression', true);
  assert.equal(rootStyle, ROOT_NODE_STYLE);
  assert.equal(rootStyle.border, '#DC2626');

  const binaryStyle = getNodeStyle('BinaryExpression', false);
  const unaryStyle = getNodeStyle('UnaryExpression', false);
  const identifierStyle = getNodeStyle('Identifier', false);
  const literalStyle = getNodeStyle('Literal', false);
  const numericLiteralStyle = getNodeStyle('NumericLiteral', false);

  assert.deepEqual(literalStyle, numericLiteralStyle);

  const colors = [rootStyle.fill, binaryStyle.fill, unaryStyle.fill, identifierStyle.fill, literalStyle.fill];
  const uniqueColors = new Set(colors);
  assert.equal(uniqueColors.size, 5, 'Every node type + root must have a distinct fill color');
});

test('PNG export: buildExportSvg generates complete SVG containing all nodes and edges with root styling', () => {
  const ast = parse('-(a + 3) * (total / count + 5)');
  const exportData = buildExportSvg(ast);
  assert.ok(exportData, 'Export data should not be null');
  assert.ok(exportData.width > 500, `Export width should be > 500 (was ${exportData.width})`);
  assert.ok(exportData.height > 300, `Export height should be > 300 (was ${exportData.height})`);

  const svg = exportData.svgString;
  assert.ok(svg.startsWith('<svg'), 'SVG string should begin with <svg');
  assert.ok(svg.includes('data-is-root="true"'), 'SVG should contain root node indicator');
  assert.ok(svg.includes('#DC2626'), 'SVG should contain root node border color');
  assert.ok(svg.includes('stroke="#94A3B8"'), 'SVG should contain connecting edges with theme stroke');
  assert.ok(svg.includes('fill="#FFFFFF"'), 'SVG should contain clean solid background');

  // Verify all node labels are present in SVG
  for (const label of ['*', '-', '+', '/', 'a', '3', 'total', 'count', '5']) {
    assert.ok(svg.includes(`>${label}<`), `SVG should contain label ${label}`);
  }
});

test('PNG export: exportTreeAsPng safely handles null or DOM containers', async () => {
  assert.equal(await exportTreeAsPng(null), false);
  const fakeContainer = { __currentAst: null };
  assert.equal(await exportTreeAsPng(fakeContainer), false);
});

test('Zoom: setTreeZoom applies clamped scale and pan translation', () => {
  const mockPlane = { style: {} };
  setTreeZoom(mockPlane, 2.0, { panX: 100, panY: 50, minZoom: 0.25, maxZoom: 3.0 });
  assert.equal(mockPlane.style.transform, 'translate(100px, 50px) scale(2)');
  assert.equal(mockPlane.style.transformOrigin, '0 0');

  // Clamp below minZoom
  setTreeZoom(mockPlane, 0.1, { panX: 0, panY: 0, minZoom: 0.25, maxZoom: 3.0 });
  assert.equal(mockPlane.style.transform, 'translate(0px, 0px) scale(0.25)');

  // Clamp above maxZoom
  setTreeZoom(mockPlane, 5.0, { panX: 0, panY: 0, minZoom: 0.25, maxZoom: 3.0 });
  assert.equal(mockPlane.style.transform, 'translate(0px, 0px) scale(3)');
});
