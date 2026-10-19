import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from '../src/parser/parser.js';
import { inorder, postorder, preorder } from '../src/traversal/traversal.js';

const ast = parse('a + b * 2');
const labels = (nodes) => nodes.map((node) => node.operator ?? node.name ?? node.raw);
test('traversals visit AST nodes in expected orders', () => {
  assert.deepEqual(labels(preorder(ast)), ['+', 'a', '*', 'b', '2']);
  assert.deepEqual(labels(inorder(ast)), ['a', '+', 'b', '*', '2']);
  assert.deepEqual(labels(postorder(ast)), ['a', 'b', '2', '*', '+']);
});
