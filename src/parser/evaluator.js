/**
 * Expression evaluator for ParseVision's expression AST.
 *
 * Evaluates semantic plain-object AST nodes:
 * - AssignmentExpression (=)
 * - BinaryExpression (+, -, *, /, %, **, ^)
 * - UnaryExpression (+, -)
 * - Literal / NumericLiteral
 * - Identifier (resolved via environment map)
 *
 * Arithmetic and expression semantics:
 * - Addition, subtraction, multiplication, division, modulo, and exponentiation
 * - Left associativity for additive and multiplicative operations
 * - Right associativity for exponentiation (** and ^) and assignment (=)
 * - Prefix unary + returns the numeric operand
 * - Prefix unary - negates the numeric operand; follows standard algebraic convention: -2 ** 2 === -4
 * - Identifiers are resolved via the provided env map; throws ReferenceError if unresolved
 * - Assignment stores the evaluated right-hand value in the environment and returns the value
 * - Division by zero evaluates to Infinity / -Infinity according to IEEE 754 arithmetic
 * - Modulo by zero throws a RangeError
 */

const defaultEnv = {};

export function getEnvironment() {
  return defaultEnv;
}

export function resetEnvironment() {
  for (const key of Object.keys(defaultEnv)) {
    delete defaultEnv[key];
  }
  return defaultEnv;
}

export function evaluate(node, env = defaultEnv) {
  if (!node || typeof node !== 'object') {
    throw new TypeError('Evaluation requires a valid AST node object.');
  }

  switch (node.type) {
    case 'Literal':
    case 'NumericLiteral': {
      const val = typeof node.value === 'number' ? node.value : Number(node.raw ?? node.value);
      if (!Number.isFinite(val)) {
        throw new TypeError(`Invalid literal value: ${node.value ?? node.raw}`);
      }
      return val;
    }

    case 'Identifier': {
      if (typeof node.name !== 'string' || node.name.length === 0) {
        throw new TypeError('Identifier node requires a valid name property.');
      }
      if (env && Object.prototype.hasOwnProperty.call(env, node.name)) {
        const val = Number(env[node.name]);
        if (Number.isNaN(val)) {
          throw new TypeError(`Identifier "${node.name}" in environment is not a valid number: ${env[node.name]}`);
        }
        return val;
      }
      throw new ReferenceError(`Unresolved identifier "${node.name}".`);
    }

    case 'AssignmentExpression': {
      if (!node.left || typeof node.left !== 'object' || node.left.type !== 'Identifier') {
        throw new TypeError('AssignmentExpression requires an Identifier left child node.');
      }
      if (!node.right || typeof node.right !== 'object') {
        throw new TypeError('AssignmentExpression requires a right child node.');
      }
      if (node.operator !== '=') {
        throw new TypeError(`Unsupported assignment operator "${node.operator}".`);
      }
      const value = evaluate(node.right, env);
      if (env && typeof env === 'object') {
        env[node.left.name] = value;
      }
      return value;
    }

    case 'UnaryExpression': {
      if (!node.argument || typeof node.argument !== 'object') {
        throw new TypeError('UnaryExpression requires an argument child node.');
      }
      const argVal = evaluate(node.argument, env);
      if (node.operator === '+') {
        return +argVal;
      }
      if (node.operator === '-') {
        return -argVal;
      }
      throw new TypeError(`Unsupported unary operator "${node.operator}".`);
    }

    case 'BinaryExpression': {
      if (!node.left || typeof node.left !== 'object') {
        throw new TypeError('BinaryExpression requires a left child node.');
      }
      if (!node.right || typeof node.right !== 'object') {
        throw new TypeError('BinaryExpression requires a right child node.');
      }
      const leftVal = evaluate(node.left, env);
      const rightVal = evaluate(node.right, env);

      switch (node.operator) {
        case '+':
          return leftVal + rightVal;
        case '-':
          return leftVal - rightVal;
        case '*':
          return leftVal * rightVal;
        case '/':
          return leftVal / rightVal;
        case '%': {
          if (rightVal === 0) {
            throw new RangeError('Modulo by zero.');
          }
          return leftVal % rightVal;
        }
        case '**':
        case '^':
          return leftVal ** rightVal;
        default:
          throw new TypeError(`Unsupported binary operator "${node.operator}".`);
      }
    }

    default:
      throw new TypeError(`Unsupported AST node type "${node.type}".`);
  }
}
