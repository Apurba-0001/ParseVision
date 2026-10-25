import assert from 'node:assert/strict';
import test from 'node:test';
import { TokenizeError, tokenize } from '../src/parser/tokenizer.js';

test('tokenize recognizes simple arithmetic expressions and source offsets', () => {
  assert.deepEqual(tokenize('a + 12.5 * (_b - 2)'), [
    { type: 'IDENTIFIER', value: 'a', start: 0, end: 1 },
    { type: 'OPERATOR', value: '+', start: 2, end: 3 },
    { type: 'NUMBER', value: 12.5, raw: '12.5', start: 4, end: 8 },
    { type: 'OPERATOR', value: '*', start: 9, end: 10 },
    { type: 'PAREN', value: '(', start: 11, end: 12 },
    { type: 'IDENTIFIER', value: '_b', start: 12, end: 14 },
    { type: 'OPERATOR', value: '-', start: 15, end: 16 },
    { type: 'NUMBER', value: 2, raw: '2', start: 17, end: 18 },
    { type: 'PAREN', value: ')', start: 18, end: 19 },
    { type: 'EOF', value: '', start: 19, end: 19 }
  ]);
});

test('tokenize keeps unary minus separate and handles operator sequences', () => {
  assert.deepEqual(tokenize('-5 + x*/y').map(({ type, value }) => [type, value]), [
    ['OPERATOR', '-'], ['NUMBER', 5], ['OPERATOR', '+'], ['IDENTIFIER', 'x'], ['OPERATOR', '*'], ['OPERATOR', '/'], ['IDENTIFIER', 'y'], ['EOF', '']
  ]);
});

test('tokenize accepts integer and decimal forms while preserving raw text', () => {
  const numbers = tokenize('123 .5 5. 12.5').filter((token) => token.type === 'NUMBER');
  assert.deepEqual(numbers, [
    { type: 'NUMBER', value: 123, raw: '123', start: 0, end: 3 },
    { type: 'NUMBER', value: 0.5, raw: '.5', start: 4, end: 6 },
    { type: 'NUMBER', value: 5, raw: '5.', start: 7, end: 9 },
    { type: 'NUMBER', value: 12.5, raw: '12.5', start: 10, end: 14 }
  ]);
});

test('tokenize ignores spaces, tabs, and newlines', () => {
  assert.deepEqual(tokenize('\tvalue2\n +  3').map(({ type, value, start, end }) => ({ type, value, start, end })), [
    { type: 'IDENTIFIER', value: 'value2', start: 1, end: 7 },
    { type: 'OPERATOR', value: '+', start: 9, end: 10 },
    { type: 'NUMBER', value: 3, start: 12, end: 13 },
    { type: 'EOF', value: '', start: 13, end: 13 }
  ]);
});

test('tokenize rejects invalid characters and malformed numeric literals with ranges', () => {
  assert.throws(
    () => tokenize('a @ b'),
    (error) => error instanceof TokenizeError && error.start === 2 && error.end === 3 && error.message === 'Invalid character "@" at character 2.'
  );
  assert.throws(
    () => tokenize('a $ b'),
    (error) => error instanceof TokenizeError && error.start === 2 && error.end === 3 && error.message === 'Invalid character "$" at character 2.'
  );
  assert.throws(
    () => tokenize('x # y'),
    (error) => error instanceof TokenizeError && error.start === 2 && error.end === 3 && error.message === 'Invalid character "#" at character 2.'
  );
  assert.throws(
    () => tokenize('foo & bar'),
    (error) => error instanceof TokenizeError && error.start === 4 && error.end === 5 && error.message === 'Invalid character "&" at character 4.'
  );
  assert.throws(() => tokenize('1.2.3'), (error) => error instanceof TokenizeError && error.start === 0 && error.end === 5 && /Malformed numeric literal/.test(error.message));
  assert.throws(() => tokenize('7..'), (error) => error instanceof TokenizeError && /Malformed numeric literal/.test(error.message));
});

test('tokenize identifies unsupported operators %, **, and ^ with descriptive errors and precise offsets', () => {
  assert.throws(
    () => tokenize('a % b'),
    (error) => error instanceof TokenizeError && error.start === 2 && error.end === 3 && error.message === 'Unsupported operator "%" at character 2.'
  );
  assert.throws(
    () => tokenize('a ** b'),
    (error) => error instanceof TokenizeError && error.start === 2 && error.end === 4 && error.message === 'Unsupported operator "**" at character 2.'
  );
  assert.throws(
    () => tokenize('a ^ b'),
    (error) => error instanceof TokenizeError && error.start === 2 && error.end === 3 && error.message === 'Unsupported operator "^" at character 2.'
  );
  assert.throws(
    () => tokenize('2 ** 3 ** 4'),
    (error) => error instanceof TokenizeError && error.start === 2 && error.end === 4 && error.message === 'Unsupported operator "**" at character 2.'
  );
  assert.throws(
    () => tokenize('(a + b) ** (c - d)'),
    (error) => error instanceof TokenizeError && error.start === 8 && error.end === 10 && error.message === 'Unsupported operator "**" at character 8.'
  );
  assert.throws(
    () => tokenize('a % -b'),
    (error) => error instanceof TokenizeError && error.start === 2 && error.end === 3 && error.message === 'Unsupported operator "%" at character 2.'
  );
  assert.throws(
    () => tokenize('-(a + b) % 2'),
    (error) => error instanceof TokenizeError && error.start === 9 && error.end === 10 && error.message === 'Unsupported operator "%" at character 9.'
  );
  assert.throws(
    () => tokenize('+a ** -b'),
    (error) => error instanceof TokenizeError && error.start === 3 && error.end === 5 && error.message === 'Unsupported operator "**" at character 3.'
  );
  assert.throws(
    () => tokenize('(x + 10) * 4 - 3 % 2'),
    (error) => error instanceof TokenizeError && error.start === 17 && error.end === 18 && error.message === 'Unsupported operator "%" at character 17.'
  );
  assert.throws(
    () => tokenize('** 5'),
    (error) => error instanceof TokenizeError && error.start === 0 && error.end === 2 && error.message === 'Unsupported operator "**" at character 0.'
  );
  assert.throws(
    () => tokenize('% 10'),
    (error) => error instanceof TokenizeError && error.start === 0 && error.end === 1 && error.message === 'Unsupported operator "%" at character 0.'
  );
  assert.throws(
    () => tokenize('^ 3'),
    (error) => error instanceof TokenizeError && error.start === 0 && error.end === 1 && error.message === 'Unsupported operator "^" at character 0.'
  );
});
