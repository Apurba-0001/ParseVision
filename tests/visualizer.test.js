import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from '../src/parser/parser.js';
import { layoutAst, nodeLabel } from '../src/visualizer/treeRenderer.js';

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
