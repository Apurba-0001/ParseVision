import assert from 'node:assert/strict';
import test from 'node:test';
import { ParseError, parse } from '../src/parser/parser.js';
import { TokenizeError } from '../src/parser/tokenizer.js';

test('parser creates literal nodes for integers and decimals', () => {
  assert.deepEqual(parse('123'), { type: 'Literal', value: 123, raw: '123' });
  assert.deepEqual(parse('.5'), { type: 'Literal', value: 0.5, raw: '.5' });
  assert.deepEqual(parse('5.'), { type: 'Literal', value: 5, raw: '5.' });
});

test('parser creates identifier nodes', () => {
  assert.deepEqual(parse('_total2'), { type: 'Identifier', name: '_total2' });
});

test('parser supports every binary operator', () => {
  for (const operator of ['+', '-', '*', '/']) {
    assert.deepEqual(parse(`a ${operator} b`), {
      type: 'BinaryExpression', operator,
      left: { type: 'Identifier', name: 'a' },
      right: { type: 'Identifier', name: 'b' }
    });
  }
});

test('parser honors multiplication precedence over addition', () => {
  assert.deepEqual(parse('a + b * 2'), { type: 'BinaryExpression', operator: '+', left: { type: 'Identifier', name: 'a' }, right: { type: 'BinaryExpression', operator: '*', left: { type: 'Identifier', name: 'b' }, right: { type: 'Literal', value: 2, raw: '2' } } });
});

test('parser makes chained subtraction left-associative', () => {
  assert.deepEqual(parse('10 - 4 - 2'), {
    type: 'BinaryExpression', operator: '-',
    left: {
      type: 'BinaryExpression', operator: '-',
      left: { type: 'Literal', value: 10, raw: '10' },
      right: { type: 'Literal', value: 4, raw: '4' }
    },
    right: { type: 'Literal', value: 2, raw: '2' }
  });
});

test('parser supports unary operators and nested parentheses', () => {
  assert.deepEqual(parse('-(a + 3) * 2'), {
    type: 'BinaryExpression', operator: '*',
    left: {
      type: 'UnaryExpression', operator: '-', argument: {
        type: 'BinaryExpression', operator: '+',
        left: { type: 'Identifier', name: 'a' },
        right: { type: 'Literal', value: 3, raw: '3' }
      }
    },
    right: { type: 'Literal', value: 2, raw: '2' }
  });
  assert.deepEqual(parse('+(-x)'), {
    type: 'UnaryExpression', operator: '+', argument: {
      type: 'UnaryExpression', operator: '-', argument: { type: 'Identifier', name: 'x' }
    }
  });
});

test('parser handles nested expressions with whitespace and newlines', () => {
  assert.deepEqual(parse('\n (a + 2)\n /\t(3 - b) '), {
    type: 'BinaryExpression', operator: '/',
    left: { type: 'BinaryExpression', operator: '+', left: { type: 'Identifier', name: 'a' }, right: { type: 'Literal', value: 2, raw: '2' } },
    right: { type: 'BinaryExpression', operator: '-', left: { type: 'Literal', value: 3, raw: '3' }, right: { type: 'Identifier', name: 'b' } }
  });
});

test('parser rejects empty input and missing operands with positions', () => {
  assert.throws(() => parse('  \n '), (error) => error instanceof ParseError && error.position === 4 && /cannot be empty/.test(error.message));
  assert.throws(() => parse('a +'), (error) => error instanceof ParseError && error.position === 3 && /Expected a number/.test(error.message));
  assert.throws(() => parse('* a'), (error) => error instanceof ParseError && error.position === 0 && /Expected a number/.test(error.message));
});

test('parser rejects missing or extra parentheses and trailing tokens', () => {
  assert.throws(() => parse('(a + b'), (error) => error instanceof ParseError && error.position === 6 && /Expected closing parenthesis/.test(error.message));
  assert.throws(() => parse('a + b)'), (error) => error instanceof ParseError && error.position === 5 && /Unexpected trailing token/.test(error.message));
  assert.throws(() => parse('a b'), (error) => error instanceof ParseError && error.position === 2 && /Unexpected trailing token/.test(error.message));
});

test('parser rejects unexpected operators and propagates lexical errors', () => {
  assert.throws(() => parse('a + * b'), (error) => error instanceof ParseError && error.position === 4 && /Expected a number/.test(error.message));
  assert.throws(() => parse('a @ b'), (error) => error instanceof TokenizeError && error.start === 2);
});
