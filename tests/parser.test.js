import assert from 'node:assert/strict';
import test from 'node:test';
import { ParseError, Parser, parse } from '../src/parser/parser.js';
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

test('parser honors multiplication and division precedence over addition and subtraction', () => {
  assert.deepEqual(parse('a + b * 2'), {
    type: 'BinaryExpression', operator: '+',
    left: { type: 'Identifier', name: 'a' },
    right: {
      type: 'BinaryExpression', operator: '*',
      left: { type: 'Identifier', name: 'b' },
      right: { type: 'Literal', value: 2, raw: '2' }
    }
  });
  assert.deepEqual(parse('a - b / 2'), {
    type: 'BinaryExpression', operator: '-',
    left: { type: 'Identifier', name: 'a' },
    right: {
      type: 'BinaryExpression', operator: '/',
      left: { type: 'Identifier', name: 'b' },
      right: { type: 'Literal', value: 2, raw: '2' }
    }
  });
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
  assert.deepEqual(parse('-a + +b'), {
    type: 'BinaryExpression', operator: '+',
    left: { type: 'UnaryExpression', operator: '-', argument: { type: 'Identifier', name: 'a' } },
    right: { type: 'UnaryExpression', operator: '+', argument: { type: 'Identifier', name: 'b' } }
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
  assert.throws(() => parse('a @ b'), (error) => error instanceof TokenizeError && error.start === 2 && error.message === 'Invalid character "@" at character 2.');
  assert.throws(() => parse('a $ b'), (error) => error instanceof TokenizeError && error.start === 2 && error.message === 'Invalid character "$" at character 2.');
  assert.throws(() => parse('x # y'), (error) => error instanceof TokenizeError && error.start === 2 && error.message === 'Invalid character "#" at character 2.');
  assert.throws(() => parse('foo & bar'), (error) => error instanceof TokenizeError && error.start === 4 && error.message === 'Invalid character "&" at character 4.');
});

test('parser rejects unsupported operators %, **, and ^ with clear diagnostic errors', () => {
  assert.throws(
    () => parse('a % b'),
    (error) => error instanceof TokenizeError && error.start === 2 && error.end === 3 && error.message === 'Unsupported operator "%" at character 2.'
  );
  assert.throws(
    () => parse('a ** b'),
    (error) => error instanceof TokenizeError && error.start === 2 && error.end === 4 && error.message === 'Unsupported operator "**" at character 2.'
  );
  assert.throws(
    () => parse('a ^ b'),
    (error) => error instanceof TokenizeError && error.start === 2 && error.end === 3 && error.message === 'Unsupported operator "^" at character 2.'
  );
  assert.throws(
    () => parse('2 ** 3 ** 4'),
    (error) => error instanceof TokenizeError && error.start === 2 && error.end === 4 && error.message === 'Unsupported operator "**" at character 2.'
  );
  assert.throws(
    () => parse('(a + b) ** (c - d)'),
    (error) => error instanceof TokenizeError && error.start === 8 && error.end === 10 && error.message === 'Unsupported operator "**" at character 8.'
  );
});

test('parser rejects unsupported operators interacting with unary operators and long expressions', () => {
  // Long expression reproducing user report at character 45
  const longExpr = '10 + 20 * 30 - 40 / 50 + (60 * 70) - (8 + 9) % 10';
  assert.throws(
    () => parse(longExpr),
    (error) => error instanceof TokenizeError && error.start === 45 && error.message === 'Unsupported operator "%" at character 45.'
  );

  // Interacting with unary operators
  assert.throws(
    () => parse('-a ** 2'),
    (error) => error instanceof TokenizeError && error.start === 3 && error.end === 5 && error.message === 'Unsupported operator "**" at character 3.'
  );
  assert.throws(
    () => parse('a % -b'),
    (error) => error instanceof TokenizeError && error.start === 2 && error.end === 3 && error.message === 'Unsupported operator "%" at character 2.'
  );
  assert.throws(
    () => parse('-(a + b) % 2'),
    (error) => error instanceof TokenizeError && error.start === 9 && error.end === 10 && error.message === 'Unsupported operator "%" at character 9.'
  );
  assert.throws(
    () => parse('+a ** -b'),
    (error) => error instanceof TokenizeError && error.start === 3 && error.end === 5 && error.message === 'Unsupported operator "**" at character 3.'
  );
});

test('Parser class rejects token streams containing unsupported operators', () => {
  // Binary position %
  assert.throws(
    () => new Parser([
      { type: 'IDENTIFIER', value: 'a', start: 0, end: 1 },
      { type: 'OPERATOR', value: '%', start: 2, end: 3 },
      { type: 'IDENTIFIER', value: 'b', start: 4, end: 5 },
      { type: 'EOF', value: '', start: 5, end: 5 }
    ]).parse(),
    (error) => error instanceof ParseError && error.position === 2 && error.message === 'Unsupported operator "%" at character 2.'
  );

  // Binary position **
  assert.throws(
    () => new Parser([
      { type: 'IDENTIFIER', value: 'a', start: 0, end: 1 },
      { type: 'OPERATOR', value: '**', start: 2, end: 4 },
      { type: 'IDENTIFIER', value: 'b', start: 5, end: 6 },
      { type: 'EOF', value: '', start: 6, end: 6 }
    ]).parse(),
    (error) => error instanceof ParseError && error.position === 2 && error.message === 'Unsupported operator "**" at character 2.'
  );

  // Binary position ^
  assert.throws(
    () => new Parser([
      { type: 'IDENTIFIER', value: 'a', start: 0, end: 1 },
      { type: 'OPERATOR', value: '^', start: 2, end: 3 },
      { type: 'IDENTIFIER', value: 'b', start: 4, end: 5 },
      { type: 'EOF', value: '', start: 5, end: 5 }
    ]).parse(),
    (error) => error instanceof ParseError && error.position === 2 && error.message === 'Unsupported operator "^" at character 2.'
  );

  // Leading position %
  assert.throws(
    () => new Parser([
      { type: 'OPERATOR', value: '%', start: 0, end: 1 },
      { type: 'NUMBER', value: 5, raw: '5', start: 2, end: 3 },
      { type: 'EOF', value: '', start: 3, end: 3 }
    ]).parse(),
    (error) => error instanceof ParseError && error.position === 0 && error.message === 'Unsupported operator "%" at character 0.'
  );

  // Leading position **
  assert.throws(
    () => new Parser([
      { type: 'OPERATOR', value: '**', start: 0, end: 2 },
      { type: 'NUMBER', value: 2, raw: '2', start: 3, end: 4 },
      { type: 'EOF', value: '', start: 4, end: 4 }
    ]).parse(),
    (error) => error instanceof ParseError && error.position === 0 && error.message === 'Unsupported operator "**" at character 0.'
  );

  // Leading position ^
  assert.throws(
    () => new Parser([
      { type: 'OPERATOR', value: '^', start: 0, end: 1 },
      { type: 'IDENTIFIER', value: 'x', start: 2, end: 3 },
      { type: 'EOF', value: '', start: 3, end: 3 }
    ]).parse(),
    (error) => error instanceof ParseError && error.position === 0 && error.message === 'Unsupported operator "^" at character 0.'
  );
});
