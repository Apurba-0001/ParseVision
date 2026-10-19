import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from '../src/parser/parser.js';
import { formatNode, inorder, postorder, preorder, validateNode } from '../src/traversal/traversal.js';

test('primary test: a + b * 2 matches expected preorder, inorder, and postorder format', () => {
  const ast = parse('a + b * 2');

  const expectedPreorder = [
    'BinaryExpression(+)',
    'Identifier(a)',
    'BinaryExpression(*)',
    'Identifier(b)',
    'Literal(2)'
  ];

  const expectedInorder = [
    'Identifier(a)',
    'BinaryExpression(+)',
    'Identifier(b)',
    'BinaryExpression(*)',
    'Literal(2)'
  ];

  const expectedPostorder = [
    'Identifier(a)',
    'Identifier(b)',
    'Literal(2)',
    'BinaryExpression(*)',
    'BinaryExpression(+)'
  ];

  assert.deepEqual(preorder(ast), expectedPreorder);
  assert.deepEqual(inorder(ast), expectedInorder);
  assert.deepEqual(postorder(ast), expectedPostorder);
});

test('traversal of a single literal', () => {
  const integerAst = parse('42');
  assert.deepEqual(preorder(integerAst), ['Literal(42)']);
  assert.deepEqual(inorder(integerAst), ['Literal(42)']);
  assert.deepEqual(postorder(integerAst), ['Literal(42)']);

  const decimalAst = parse('12.5');
  assert.deepEqual(preorder(decimalAst), ['Literal(12.5)']);
  assert.deepEqual(inorder(decimalAst), ['Literal(12.5)']);
  assert.deepEqual(postorder(decimalAst), ['Literal(12.5)']);
});

test('traversal of a single identifier', () => {
  const ast = parse('totalCount');
  assert.deepEqual(preorder(ast), ['Identifier(totalCount)']);
  assert.deepEqual(inorder(ast), ['Identifier(totalCount)']);
  assert.deepEqual(postorder(ast), ['Identifier(totalCount)']);
});

test('traversal of simple binary expressions', () => {
  const ast = parse('x + y');
  assert.deepEqual(preorder(ast), ['BinaryExpression(+)', 'Identifier(x)', 'Identifier(y)']);
  assert.deepEqual(inorder(ast), ['Identifier(x)', 'BinaryExpression(+)', 'Identifier(y)']);
  assert.deepEqual(postorder(ast), ['Identifier(x)', 'Identifier(y)', 'BinaryExpression(+)']);
});

test('traversal of nested binary expressions with left associativity', () => {
  const ast = parse('10 - 4 - 2');
  // ((10 - 4) - 2)
  assert.deepEqual(preorder(ast), [
    'BinaryExpression(-)',
    'BinaryExpression(-)',
    'Literal(10)',
    'Literal(4)',
    'Literal(2)'
  ]);
  assert.deepEqual(inorder(ast), [
    'Literal(10)',
    'BinaryExpression(-)',
    'Literal(4)',
    'BinaryExpression(-)',
    'Literal(2)'
  ]);
  assert.deepEqual(postorder(ast), [
    'Literal(10)',
    'Literal(4)',
    'BinaryExpression(-)',
    'Literal(2)',
    'BinaryExpression(-)'
  ]);
});

test('traversal of unary expressions', () => {
  const ast = parse('-value');
  assert.deepEqual(preorder(ast), ['UnaryExpression(-)', 'Identifier(value)']);
  // Inorder convention: operator before operand
  assert.deepEqual(inorder(ast), ['UnaryExpression(-)', 'Identifier(value)']);
  // Postorder convention: operand before operator
  assert.deepEqual(postorder(ast), ['Identifier(value)', 'UnaryExpression(-)']);

  const chainedUnary = parse('--x');
  assert.deepEqual(preorder(chainedUnary), ['UnaryExpression(-)', 'UnaryExpression(-)', 'Identifier(x)']);
  assert.deepEqual(inorder(chainedUnary), ['UnaryExpression(-)', 'UnaryExpression(-)', 'Identifier(x)']);
  assert.deepEqual(postorder(chainedUnary), ['Identifier(x)', 'UnaryExpression(-)', 'UnaryExpression(-)']);
});

test('traversal of mixed unary and binary expressions', () => {
  const ast = parse('-(a + 3) * 2');
  // BinaryExpression(*, UnaryExpression(-, BinaryExpression(+, Identifier(a), Literal(3))), Literal(2))
  assert.deepEqual(preorder(ast), [
    'BinaryExpression(*)',
    'UnaryExpression(-)',
    'BinaryExpression(+)',
    'Identifier(a)',
    'Literal(3)',
    'Literal(2)'
  ]);
  assert.deepEqual(inorder(ast), [
    'UnaryExpression(-)',
    'Identifier(a)',
    'BinaryExpression(+)',
    'Literal(3)',
    'BinaryExpression(*)',
    'Literal(2)'
  ]);
  assert.deepEqual(postorder(ast), [
    'Identifier(a)',
    'Literal(3)',
    'BinaryExpression(+)',
    'UnaryExpression(-)',
    'Literal(2)',
    'BinaryExpression(*)'
  ]);
});

test('traversal does not mutate the AST', () => {
  const ast = parse('a + b * 2');
  const cloneBefore = structuredClone(ast);

  // Deep freeze the AST object to enforce strict immutability at runtime
  function deepFreeze(obj) {
    Object.freeze(obj);
    for (const val of Object.values(obj)) {
      if (val && typeof val === 'object') deepFreeze(val);
    }
    return obj;
  }
  deepFreeze(ast);

  // Traversals must run on frozen AST without throwing mutation errors
  const pre = preorder(ast);
  const inord = inorder(ast);
  const post = postorder(ast);

  assert.ok(pre.length > 0);
  assert.ok(inord.length > 0);
  assert.ok(post.length > 0);
  assert.deepEqual(ast, cloneBefore);
});

test('traversal options support returning AST node objects or custom formats', () => {
  const ast = parse('a + 1');
  const nodeResults = preorder(ast, { asNodes: true });
  assert.equal(nodeResults[0], ast);
  assert.equal(nodeResults[1], ast.left);
  assert.equal(nodeResults[2], ast.right);

  const customResults = inorder(ast, { format: (n) => n.operator ?? n.name ?? n.raw });
  assert.deepEqual(customResults, ['a', '+', '1']);
});

test('formatNode produces consistent strings for each supported type', () => {
  assert.equal(formatNode({ type: 'Literal', raw: '42', value: 42 }), 'Literal(42)');
  assert.equal(formatNode({ type: 'Identifier', name: 'myVar' }), 'Identifier(myVar)');
  assert.equal(formatNode({ type: 'BinaryExpression', operator: '+', left: { type: 'Literal', raw: '1', value: 1 }, right: { type: 'Literal', raw: '2', value: 2 } }), 'BinaryExpression(+)');
  assert.equal(formatNode({ type: 'UnaryExpression', operator: '-', argument: { type: 'Identifier', name: 'x' } }), 'UnaryExpression(-)');
});

test('traversal throws descriptive errors for unsupported node types', () => {
  assert.throws(() => preorder({ type: 'CallExpression' }), /Unsupported AST node type "CallExpression"/);
  assert.throws(() => inorder({ type: 'AssignmentExpression' }), /Unsupported AST node type "AssignmentExpression"/);
  assert.throws(() => postorder({ type: 'FunctionDeclaration' }), /Unsupported AST node type "FunctionDeclaration"/);
});

test('traversal throws descriptive errors for malformed AST structures', () => {
  assert.throws(() => preorder(null), /AST node object is required/);
  assert.throws(() => inorder(undefined), /AST node object is required/);
  assert.throws(() => postorder('not an object'), /AST node object is required/);

  // BinaryExpression missing operator
  assert.throws(() => preorder({ type: 'BinaryExpression', operator: '', left: { type: 'Identifier', name: 'a' }, right: { type: 'Identifier', name: 'b' } }), /requires an operator/);

  // BinaryExpression missing left or right child
  assert.throws(() => inorder({ type: 'BinaryExpression', operator: '+', left: null, right: { type: 'Identifier', name: 'b' } }), /requires a valid left child/);
  assert.throws(() => postorder({ type: 'BinaryExpression', operator: '+', left: { type: 'Identifier', name: 'a' }, right: null }), /requires a valid right child/);

  // UnaryExpression missing operator or argument
  assert.throws(() => preorder({ type: 'UnaryExpression', operator: '', argument: { type: 'Identifier', name: 'a' } }), /requires an operator/);
  assert.throws(() => inorder({ type: 'UnaryExpression', operator: '-', argument: null }), /requires a valid argument child/);

  // Identifier missing name
  assert.throws(() => postorder({ type: 'Identifier', name: '' }), /requires a valid name/);

  // Literal missing raw/value
  assert.throws(() => preorder({ type: 'Literal' }), /requires valid raw text or a finite numeric value/);

  // Circular references
  const circularNode = { type: 'UnaryExpression', operator: '-', argument: null };
  circularNode.argument = circularNode;
  assert.throws(() => preorder(circularNode), /AST cannot contain circular references/);
});
