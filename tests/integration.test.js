import assert from 'node:assert/strict';
import test from 'node:test';
import { parse, ParseError } from '../src/parser/parser.js';
import { TokenizeError } from '../src/parser/tokenizer.js';
import { layoutAst } from '../src/visualizer/treeRenderer.js';
import { preorder, inorder, postorder } from '../src/traversal/traversal.js';
import { EXAMPLE_EXPRESSIONS } from '../src/components/editor.js';

/**
 * End-to-end pipeline runner simulating the complete application flow:
 * Source Expression → Tokenizer → Parser → AST → Layout → Traversals.
 */
function runPipeline(source) {
  const ast = parse(source);
  const layout = layoutAst(ast);
  const traversals = {
    preorder: preorder(ast),
    inorder: inorder(ast),
    postorder: postorder(ast)
  };
  const json = JSON.stringify(ast, null, 2);
  return { ast, layout, traversals, json };
}

/**
 * Simulated state controller testing state transitions, stale result clearance,
 * and error recovery without DOM dependencies.
 */
class PipelineStateController {
  constructor() {
    this.reset();
  }

  reset() {
    this.ast = null;
    this.json = 'Enter an expression, then select Generate AST.';
    this.layout = null;
    this.traversals = null;
    this.error = null;
    this.status = 'Ready. Enter an expression or choose an example.';
  }

  process(source) {
    try {
      const ast = parse(source);
      const layout = layoutAst(ast);
      const pre = preorder(ast);
      const inord = inorder(ast);
      const post = postorder(ast);

      this.ast = ast;
      this.json = JSON.stringify(ast, null, 2);
      this.layout = layout;
      this.traversals = { preorder: pre, inorder: inord, postorder: post };
      this.error = null;
      this.status = `AST generated successfully (${pre.length} nodes).`;
      return { success: true };
    } catch (err) {
      // Clear stale output immediately upon failure
      this.ast = null;
      this.json = 'No AST generated due to error.';
      this.layout = null;
      this.traversals = null;
      this.error = err.message;
      this.status = '';
      return { success: false, error: err };
    }
  }
}

// ==========================================
// 1. Valid Expression Pipeline Tests
// ==========================================

test('pipeline: simple integer and decimal literals', () => {
  const intRes = runPipeline('42');
  assert.equal(intRes.ast.type, 'Literal');
  assert.equal(intRes.ast.value, 42);
  assert.equal(intRes.layout.nodes.length, 1);
  assert.deepEqual(intRes.traversals.preorder, ['Literal(42)']);

  const decRes = runPipeline('3.1415');
  assert.equal(decRes.ast.type, 'Literal');
  assert.equal(decRes.ast.value, 3.1415);
  assert.equal(decRes.layout.nodes[0].label, '3.1415');
});

test('pipeline: single identifiers', () => {
  const res = runPipeline('_alphaCount');
  assert.equal(res.ast.type, 'Identifier');
  assert.equal(res.ast.name, '_alphaCount');
  assert.equal(res.layout.nodes.length, 1);
  assert.deepEqual(res.traversals.inorder, ['Identifier(_alphaCount)']);
});

test('pipeline: addition and subtraction', () => {
  const add = runPipeline('x + 15');
  assert.equal(add.ast.type, 'BinaryExpression');
  assert.equal(add.ast.operator, '+');
  assert.equal(add.layout.nodes.length, 3);
  assert.equal(add.layout.edges.length, 2);
  assert.deepEqual(add.traversals.preorder, ['BinaryExpression(+)', 'Identifier(x)', 'Literal(15)']);

  const sub = runPipeline('20 - y');
  assert.equal(sub.ast.operator, '-');
  assert.deepEqual(sub.traversals.postorder, ['Literal(20)', 'Identifier(y)', 'BinaryExpression(-)']);
});

test('pipeline: multiplication and division', () => {
  const mul = runPipeline('width * height');
  assert.equal(mul.ast.operator, '*');
  assert.deepEqual(mul.traversals.inorder, ['Identifier(width)', 'BinaryExpression(*)', 'Identifier(height)']);

  const div = runPipeline('total / 4');
  assert.equal(div.ast.operator, '/');
  assert.deepEqual(div.traversals.preorder, ['BinaryExpression(/)', 'Identifier(total)', 'Literal(4)']);
});

test('pipeline: operator precedence (multiplication binds tighter than addition)', () => {
  const res = runPipeline('a + b * c');
  assert.equal(res.ast.operator, '+');
  assert.equal(res.ast.left.type, 'Identifier');
  assert.equal(res.ast.right.type, 'BinaryExpression');
  assert.equal(res.ast.right.operator, '*');
  assert.deepEqual(res.traversals.preorder, [
    'BinaryExpression(+)',
    'Identifier(a)',
    'BinaryExpression(*)',
    'Identifier(b)',
    'Identifier(c)'
  ]);
  assert.deepEqual(res.traversals.postorder, [
    'Identifier(a)',
    'Identifier(b)',
    'Identifier(c)',
    'BinaryExpression(*)',
    'BinaryExpression(+)'
  ]);
});

test('pipeline: left associativity for chained subtraction and division', () => {
  const subChain = runPipeline('10 - 4 - 2');
  assert.equal(subChain.ast.operator, '-');
  assert.equal(subChain.ast.left.operator, '-');
  assert.equal(subChain.ast.right.value, 2);

  const divChain = runPipeline('12 / 3 / 2');
  assert.equal(divChain.ast.operator, '/');
  assert.equal(divChain.ast.left.operator, '/');
  assert.equal(divChain.ast.right.value, 2);
  assert.deepEqual(divChain.traversals.inorder, [
    'Literal(12)',
    'BinaryExpression(/)',
    'Literal(3)',
    'BinaryExpression(/)',
    'Literal(2)'
  ]);
});

test('pipeline: unary operators and chained unary expressions', () => {
  const unaryNeg = runPipeline('-value');
  assert.equal(unaryNeg.ast.type, 'UnaryExpression');
  assert.equal(unaryNeg.ast.operator, '-');
  assert.equal(unaryNeg.layout.nodes.length, 2);

  const unaryChained = runPipeline('--x');
  assert.equal(unaryChained.ast.type, 'UnaryExpression');
  assert.equal(unaryChained.ast.argument.type, 'UnaryExpression');
  assert.deepEqual(unaryChained.traversals.preorder, [
    'UnaryExpression(-)',
    'UnaryExpression(-)',
    'Identifier(x)'
  ]);
  assert.deepEqual(unaryChained.traversals.postorder, [
    'Identifier(x)',
    'UnaryExpression(-)',
    'UnaryExpression(-)'
  ]);
});

test('pipeline: nested parentheses overriding precedence', () => {
  const paren = runPipeline('(a + b) * 2');
  assert.equal(paren.ast.operator, '*');
  assert.equal(paren.ast.left.type, 'BinaryExpression');
  assert.equal(paren.ast.left.operator, '+');
  assert.deepEqual(paren.traversals.preorder, [
    'BinaryExpression(*)',
    'BinaryExpression(+)',
    'Identifier(a)',
    'Identifier(b)',
    'Literal(2)'
  ]);
});

test('pipeline: deeply nested expressions', () => {
  const deep = runPipeline('((((1 + 2) * 3) - 4) / 5)');
  assert.equal(deep.ast.operator, '/');
  assert.equal(deep.layout.nodes.length, 9);
  assert.equal(deep.layout.edges.length, 8);
  assert.ok(deep.layout.width > 200);
  assert.ok(deep.layout.height > 200);
});

test('pipeline: whitespace and multiline expression', () => {
  const multiline = runPipeline('  \n  a  +\n  b  *\n  2  \n');
  assert.equal(multiline.ast.operator, '+');
  assert.equal(multiline.layout.nodes.length, 5);
});

test('pipeline: division by zero parses successfully and is not a syntax error', () => {
  const divZero = runPipeline('10 / 0');
  assert.equal(divZero.ast.type, 'BinaryExpression');
  assert.equal(divZero.ast.operator, '/');
  assert.equal(divZero.ast.left.value, 10);
  assert.equal(divZero.ast.right.value, 0);
  assert.deepEqual(divZero.traversals.preorder, [
    'BinaryExpression(/)',
    'Literal(10)',
    'Literal(0)'
  ]);
});

// ==========================================
// 2. All Documented Example Expressions
// ==========================================

test('pipeline: all 5 required example expressions', () => {
  assert.deepEqual(EXAMPLE_EXPRESSIONS, [
    'a + b * 2',
    '(a + b) * 2',
    '10 - 4 - 2',
    '-(a + 3) * 2',
    'total / count + 5'
  ]);

  for (const expr of EXAMPLE_EXPRESSIONS) {
    const res = runPipeline(expr);
    assert.ok(res.ast, `AST exists for "${expr}"`);
    assert.ok(res.layout.nodes.length > 0, `Layout nodes exist for "${expr}"`);
    assert.ok(res.traversals.preorder.length > 0, `Preorder exists for "${expr}"`);
    assert.ok(res.traversals.inorder.length > 0, `Inorder exists for "${expr}"`);
    assert.ok(res.traversals.postorder.length > 0, `Postorder exists for "${expr}"`);
    assert.ok(res.json.includes(res.ast.type), `JSON includes type for "${expr}"`);
  }
});

// ==========================================
// 3. Invalid Expression and Error Tests
// ==========================================

test('pipeline: rejects empty input with zero-position ParseError', () => {
  assert.throws(() => parse(''), (err) => {
    return err instanceof ParseError && err.position === 0 && /cannot be empty/.test(err.message);
  });
});

test('pipeline: rejects whitespace-only input with EOF-position ParseError', () => {
  assert.throws(() => parse('   \t\n  '), (err) => {
    return err instanceof ParseError && err.position === 7 && /cannot be empty/.test(err.message);
  });
});

test('pipeline: rejects unsupported characters with TokenizeError and offset', () => {
  assert.throws(() => parse('a @ b'), (err) => {
    return err instanceof TokenizeError && err.start === 2 && /Invalid character "@"/.test(err.message);
  });
  assert.throws(() => parse('x $ y'), (err) => {
    return err instanceof TokenizeError && err.start === 2 && /Invalid character "\$"/.test(err.message);
  });
  assert.throws(() => parse('a # 3'), (err) => {
    return err instanceof TokenizeError && err.start === 2 && /Invalid character "#"/.test(err.message);
  });
});

test('pipeline: rejects missing operands with source positions', () => {
  assert.throws(() => parse('a +'), (err) => {
    return err instanceof ParseError && err.position === 3 && /Expected a number/.test(err.message);
  });
  assert.throws(() => parse('- '), (err) => {
    return err instanceof ParseError && err.position === 2 && /Expected a number/.test(err.message);
  });
});

test('pipeline: rejects consecutive invalid operators', () => {
  assert.throws(() => parse('a + * b'), (err) => {
    return err instanceof ParseError && err.position === 4 && /Expected a number/.test(err.message);
  });
  assert.throws(() => parse('a * / b'), (err) => {
    return err instanceof ParseError && err.position === 4 && /Expected a number/.test(err.message);
  });
  assert.throws(() => parse('* a'), (err) => {
    return err instanceof ParseError && err.position === 0 && /Expected a number/.test(err.message);
  });
});

test('pipeline: rejects unmatched parentheses', () => {
  assert.throws(() => parse('(a + b'), (err) => {
    return err instanceof ParseError && err.position === 6 && /Expected closing parenthesis/.test(err.message);
  });
  assert.throws(() => parse('a + b)'), (err) => {
    return err instanceof ParseError && err.position === 5 && /Unexpected trailing token/.test(err.message);
  });
  assert.throws(() => parse('((a + b)'), (err) => {
    return err instanceof ParseError && err.position === 8 && /Expected closing parenthesis/.test(err.message);
  });
});

test('pipeline: rejects trailing tokens', () => {
  assert.throws(() => parse('a b'), (err) => {
    return err instanceof ParseError && err.position === 2 && /Unexpected trailing token "b"/.test(err.message);
  });
  assert.throws(() => parse('1 2'), (err) => {
    return err instanceof ParseError && err.position === 2 && /Unexpected trailing token "2"/.test(err.message);
  });
  assert.throws(() => parse('a + b 3'), (err) => {
    return err instanceof ParseError && err.position === 6 && /Unexpected trailing token "3"/.test(err.message);
  });
});

test('pipeline: rejects malformed numeric literals with multiple decimal points', () => {
  assert.throws(() => parse('1.2.3'), (err) => {
    return err instanceof TokenizeError && err.start === 0 && /Malformed numeric literal/.test(err.message);
  });
  assert.throws(() => parse('7..'), (err) => {
    return err instanceof TokenizeError && err.start === 0 && /Malformed numeric literal/.test(err.message);
  });
});

// ==========================================
// 4. State Transitions & Stale Output Tests
// ==========================================

test('state controller: initial state is empty', () => {
  const controller = new PipelineStateController();
  assert.equal(controller.ast, null);
  assert.equal(controller.layout, null);
  assert.equal(controller.traversals, null);
  assert.equal(controller.error, null);
  assert.ok(controller.json.includes('Enter an expression'));
});

test('state controller: successful parse populates all outputs', () => {
  const controller = new PipelineStateController();
  const res = controller.process('a + b * 2');
  assert.ok(res.success);
  assert.ok(controller.ast !== null);
  assert.ok(controller.layout !== null);
  assert.equal(controller.traversals.preorder.length, 5);
  assert.equal(controller.error, null);
  assert.ok(controller.status.includes('5 nodes'));
});

test('state controller: a new successful parse replaces prior output', () => {
  const controller = new PipelineStateController();
  controller.process('a + b * 2');
  assert.equal(controller.ast.operator, '+');

  controller.process('10 - 4 - 2');
  assert.equal(controller.ast.operator, '-');
  assert.deepEqual(controller.traversals.inorder, [
    'Literal(10)',
    'BinaryExpression(-)',
    'Literal(4)',
    'BinaryExpression(-)',
    'Literal(2)'
  ]);
});

test('state controller: failed parse clears stale outputs completely', () => {
  const controller = new PipelineStateController();
  controller.process('a + b * 2');
  assert.ok(controller.ast !== null);

  // Now submit invalid input
  const failRes = controller.process('a +');
  assert.equal(failRes.success, false);
  assert.equal(controller.ast, null, 'AST must be cleared on parse failure');
  assert.equal(controller.layout, null, 'Layout must be cleared on parse failure');
  assert.equal(controller.traversals, null, 'Traversals must be cleared on parse failure');
  assert.equal(controller.json, 'No AST generated due to error.');
  assert.ok(controller.error.includes('Expected a number'));
  assert.equal(controller.status, '');
});

test('state controller: recovery after error on subsequent valid input', () => {
  const controller = new PipelineStateController();
  controller.process('invalid + + * syntax');
  assert.equal(controller.ast, null);
  assert.ok(controller.error !== null);

  // Recover with valid input
  const recoverRes = controller.process('total / count + 5');
  assert.ok(recoverRes.success);
  assert.ok(controller.ast !== null);
  assert.equal(controller.error, null);
  assert.equal(controller.ast.operator, '+');
  assert.ok(controller.status.includes('5 nodes'));
});

test('state controller: reset restores clean empty state', () => {
  const controller = new PipelineStateController();
  controller.process('a + b * 2');
  assert.ok(controller.ast !== null);

  controller.reset();
  assert.equal(controller.ast, null);
  assert.equal(controller.layout, null);
  assert.equal(controller.traversals, null);
  assert.equal(controller.error, null);
  assert.ok(controller.json.includes('Enter an expression'));
});
