import { binaryExpression, identifier, literal, unaryExpression } from './ast.js';
import { tokenize } from './tokenizer.js';
import { ADDITIVE_OPERATORS, MULTIPLICATIVE_OPERATORS, UNARY_OPERATORS } from './grammar.js';

export class ParseError extends SyntaxError {
  constructor(message, token) {
    super(`${message} at character ${token.start}.`);
    this.name = 'ParseError';
    this.position = token.start;
    this.start = token.start;
    this.end = token.end;
  }
}

/** A recursive-descent parser for ParseVision's arithmetic-expression grammar. */
export class Parser {
  constructor(tokens) {
    if (!Array.isArray(tokens) || tokens.length === 0) throw new TypeError('Parser requires a non-empty token array.');
    this.tokens = tokens;
    this.current = 0;
  }

  peek() { return this.tokens[this.current]; }
  advance() { return this.tokens[this.current++]; }

  match(operators) {
    if (operators.has(this.peek().value)) return this.advance();
    return null;
  }

  error(message, token = this.peek()) { return new ParseError(message, token); }

  parse() {
    if (this.peek().type === 'EOF') throw new ParseError('Expression cannot be empty', this.peek());
    const expression = this.parseExpression();
    if (this.peek().type !== 'EOF') throw this.error(`Unexpected trailing token "${this.peek().value}"`);
    return expression;
  }

  parseExpression() { return this.parseAdditive(); }

  parseAdditive() {
    let node = this.parseMultiplicative();
    let operator;
    while ((operator = this.match(ADDITIVE_OPERATORS))) {
      node = binaryExpression(operator.value, node, this.parseMultiplicative());
    }
    return node;
  }

  parseMultiplicative() {
    let node = this.parseUnary();
    let operator;
    while ((operator = this.match(MULTIPLICATIVE_OPERATORS))) {
      node = binaryExpression(operator.value, node, this.parseUnary());
    }
    return node;
  }

  parseUnary() {
    const operator = this.match(UNARY_OPERATORS);
    if (operator) return unaryExpression(operator.value, this.parseUnary());
    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.peek();
    if (token.type === 'NUMBER') {
      this.advance();
      return literal(token.value, token.raw);
    }
    if (token.type === 'IDENTIFIER') {
      this.advance();
      return identifier(token.value);
    }
    if (token.type === 'PAREN' && token.value === '(') {
      this.advance();
      const expression = this.parseExpression();
      if (this.peek().type !== 'PAREN' || this.peek().value !== ')') {
        throw this.error('Expected closing parenthesis');
      }
      this.advance();
      return expression;
    }
    throw this.error(`Expected a number, identifier, or opening parenthesis; found "${token.value || 'end of input'}"`, token);
  }
}

export function parse(source) { return new Parser(tokenize(source)).parse(); }
