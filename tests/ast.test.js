import assert from 'node:assert/strict';
import test from 'node:test';
import { binaryExpression, identifier, literal, unaryExpression } from '../src/parser/ast.js';

test('AST factories create every documented node shape', () => {
  assert.deepEqual(literal(12.5, '12.5'), { type: 'Literal', value: 12.5, raw: '12.5' });
  assert.deepEqual(identifier('total'), { type: 'Identifier', name: 'total' });
  assert.deepEqual(unaryExpression('-', identifier('value')), { type: 'UnaryExpression', operator: '-', argument: { type: 'Identifier', name: 'value' } });
});

test('literal converts numeric raw text and preserves its formatting', () => {
  assert.deepEqual(literal('.5'), { type: 'Literal', value: 0.5, raw: '.5' });
  assert.deepEqual(literal('005.50'), { type: 'Literal', value: 5.5, raw: '005.50' });
});

test('AST factories compose nested expressions', () => {
  const nested = binaryExpression('+', identifier('a'), binaryExpression('*', identifier('b'), literal(2, '2')));
  assert.deepEqual(nested, {
    type: 'BinaryExpression', operator: '+', left: { type: 'Identifier', name: 'a' }, right: {
      type: 'BinaryExpression', operator: '*', left: { type: 'Identifier', name: 'b' }, right: { type: 'Literal', value: 2, raw: '2' }
    }
  });
});

test('AST factories reject invalid arguments', () => {
  assert.throws(() => literal('1.2.3'), TypeError);
  assert.throws(() => literal(2, '3'), TypeError);
  assert.throws(() => identifier('2value'), TypeError);
  assert.throws(() => binaryExpression('=', identifier('a'), literal('1')), TypeError);
  assert.throws(() => binaryExpression('+', null, literal('1')), TypeError);
  assert.throws(() => unaryExpression('!', identifier('a')), TypeError);
});
