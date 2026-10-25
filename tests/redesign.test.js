import assert from 'node:assert/strict';
import test from 'node:test';
import { parse } from '../src/parser/parser.js';
import { layoutAst, mapAstToNodeIds, setTreeZoom } from '../src/visualizer/treeRenderer.js';
import { preorder, inorder, postorder, formatNode } from '../src/traversal/traversal.js';

test('redesign: mapAstToNodeIds produces deterministic hierarchical IDs', () => {
  const ast = parse('a + b * 2');
  const idMap = mapAstToNodeIds(ast);

  assert.equal(idMap.get(ast), 'root');
  assert.equal(idMap.get(ast.left), 'root.0');
  assert.equal(idMap.get(ast.right), 'root.1');
  assert.equal(idMap.get(ast.right.left), 'root.1.0');
  assert.equal(idMap.get(ast.right.right), 'root.1.1');
});

test('redesign: mapAstToNodeIds handles unary and nested expressions', () => {
  const ast = parse('-(x + 3)');
  const idMap = mapAstToNodeIds(ast);

  assert.equal(idMap.get(ast), 'root'); // UnaryExpression (-)
  assert.equal(idMap.get(ast.argument), 'root.0'); // BinaryExpression (+)
  assert.equal(idMap.get(ast.argument.left), 'root.0.0'); // Identifier (x)
  assert.equal(idMap.get(ast.argument.right), 'root.0.1'); // Literal (3)
});

test('redesign: traversal sequences match exact specification for a + b * 2', () => {
  const ast = parse('a + b * 2');
  const idMap = mapAstToNodeIds(ast);

  const preNodes = preorder(ast, { asNodes: true });
  const inNodes = inorder(ast, { asNodes: true });
  const postNodes = postorder(ast, { asNodes: true });

  // Preorder: +, a, *, b, 2
  assert.deepEqual(preNodes.map(n => n.operator || n.name || n.raw), ['+', 'a', '*', 'b', '2']);
  assert.deepEqual(preNodes.map(n => idMap.get(n)), ['root', 'root.0', 'root.1', 'root.1.0', 'root.1.1']);

  // Inorder: a, +, b, *, 2
  assert.deepEqual(inNodes.map(n => n.operator || n.name || n.raw), ['a', '+', 'b', '*', '2']);
  assert.deepEqual(inNodes.map(n => idMap.get(n)), ['root.0', 'root', 'root.1.0', 'root.1', 'root.1.1']);

  // Postorder: a, b, 2, *, +
  assert.deepEqual(postNodes.map(n => n.operator || n.name || n.raw), ['a', 'b', '2', '*', '+']);
  assert.deepEqual(postNodes.map(n => idMap.get(n)), ['root.0', 'root.1.0', 'root.1.1', 'root.1', 'root']);
});

test('redesign: setTreeZoom computes scaled viewBox with clamping', () => {
  const mockSvg = {
    dataset: { baseWidth: '400', baseHeight: '300' },
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
  };

  // Zoom 1x
  setTreeZoom(mockSvg, 1);
  assert.equal(mockSvg.attributes.viewBox, '0 0 400 300');
  assert.equal(mockSvg.dataset.currentZoom, '1');

  // Zoom in 2x (viewport size halved, offset centered)
  setTreeZoom(mockSvg, 2);
  assert.equal(mockSvg.attributes.viewBox, '100 75 200 150');
  assert.equal(mockSvg.dataset.currentZoom, '2');

  // Clamping at maximum 3.0x (300%)
  setTreeZoom(mockSvg, 5);
  assert.equal(mockSvg.dataset.currentZoom, '3');

  // Clamping at minimum 0.25x (25%)
  setTreeZoom(mockSvg, 0.1);
  assert.equal(mockSvg.dataset.currentZoom, '0.25');
});

test('redesign: layoutAst retains astNode reference and dimensions', () => {
  const ast = parse('x * 4');
  const layout = layoutAst(ast);

  assert.equal(layout.nodes.length, 3);
  assert.equal(layout.edges.length, 2);
  for (const node of layout.nodes) {
    assert.ok(node.astNode, `Node ${node.id} should reference its AST node`);
    assert.ok(Number.isFinite(node.x));
    assert.ok(Number.isFinite(node.y));
    assert.equal(node.width, 64, `Node ${node.id} width must be 64`);
    assert.equal(node.height, 64, `Node ${node.id} height must be 64`);
  }
});

test('redesign: AST nodes have uniform 64x64 dimensions across all types', () => {
  const ast = parse('a + b * 2');
  const layout = layoutAst(ast);
  assert.equal(layout.nodes.length, 5);
  for (const node of layout.nodes) {
    assert.equal(node.width, 64, `Node ${node.id} width must be exactly 64`);
    assert.equal(node.height, 64, `Node ${node.id} height must be exactly 64`);
  }
});

test('redesign: formatNode representations for all node types', () => {
  assert.equal(formatNode(parse('100')), 'Literal(100)');
  assert.equal(formatNode(parse('variable_name')), 'Identifier(variable_name)');
  assert.equal(formatNode(parse('a + b')), 'BinaryExpression(+)');
  assert.equal(formatNode(parse('-x')), 'UnaryExpression(-)');
});

test('redesign: JSON representation of AST preserves schema', () => {
  const ast = parse('total / count + 5');
  const json = JSON.stringify(ast, null, 2);
  assert.ok(json.includes('"type": "BinaryExpression"'));
  assert.ok(json.includes('"operator": "+"'));
  assert.ok(json.includes('"operator": "/"'));
  assert.ok(json.includes('"name": "total"'));
  assert.ok(json.includes('"name": "count"'));
  assert.ok(json.includes('"value": 5'));
});

test('redesign: mapAstToNodeIds allows resolution of clicked node to step index', () => {
  const ast = parse('(x + y) * (a - b)');
  const idMap = mapAstToNodeIds(ast);
  const preNodes = preorder(ast, { asNodes: true });

  const steps = preNodes.map((node) => ({
    id: idMap.get(node),
    label: node.operator || node.name || node.raw
  }));

  assert.equal(steps[0].id, 'root');
  assert.equal(steps[0].label, '*');

  // Jumping to node 'root.0.1' (identifier y)
  const targetId = 'root.0.1';
  const targetIndex = steps.findIndex((s) => s.id === targetId);
  assert.ok(targetIndex !== -1);
  assert.equal(steps[targetIndex].label, 'y');
});

test('redesign: exportTreeAsSvg safely returns false for null/missing svg', () => {
  import('../src/visualizer/treeRenderer.js').then(({ exportTreeAsSvg }) => {
    assert.equal(exportTreeAsSvg(null), false);
  });
});

test('redesign: exportTreeAsPng safely returns false for null/missing AST', async () => {
  const { exportTreeAsPng } = await import('../src/visualizer/treeRenderer.js');
  const result = await exportTreeAsPng(null);
  assert.equal(result, false);
});

test('redesign: buildExportSvg generates standalone SVG representation of AST', async () => {
  const { buildExportSvg } = await import('../src/visualizer/treeRenderer.js');
  assert.equal(buildExportSvg(null), null);

  const ast = parse('a + b * 2');
  const exportData = buildExportSvg(ast);
  assert.ok(exportData, 'Should return exportData');
  assert.ok(exportData.width > 200, 'Width should be computed with padding');
  assert.ok(exportData.height > 150, 'Height should be computed with padding');
  assert.ok(exportData.svgString.includes('viewBox='), 'Should have viewBox');
  assert.ok(exportData.svgString.includes('<rect'), 'Should render background and nodes');
  assert.ok(exportData.svgString.includes('fill="#FFFFFF"'), 'Should render pure white background');
  assert.ok(exportData.svgString.includes('BinaryExpression'), 'Should render binary expression subtitle');
  assert.ok(exportData.svgString.includes('>Identifier<'), 'Should render identifier subtitle');
  assert.ok(exportData.svgString.includes('>NumericLiteral<'), 'Should render numeric literal subtitle');
  assert.ok(!exportData.svgString.includes('&apos;a&apos;'), 'Should not render semantic properties in graph labels');
  assert.ok(!exportData.svgString.includes('node-step-circle'), 'Should not render step badge numbers');
  assert.ok(!exportData.svgString.includes('visit-order-badge'), 'Export SVG must not contain transient traversal badges');
});

test('redesign: node colors assign red to root and distinct colors to all node types', async () => {
  const { buildExportSvg } = await import('../src/visualizer/treeRenderer.js');
  const { ROOT_NODE_STYLE, NODE_STYLES } = await import('../src/visualizer/nodeStyles.js');

  // Root node should have red tokens: fill #FEE2E2, border #DC2626, text #991B1B
  assert.equal(ROOT_NODE_STYLE.fill, '#FEE2E2');
  assert.equal(ROOT_NODE_STYLE.border, '#DC2626');
  assert.equal(ROOT_NODE_STYLE.text, '#991B1B');

  // Node type tokens
  assert.equal(NODE_STYLES.BinaryExpression.fill, '#DBEAFE');
  assert.equal(NODE_STYLES.BinaryExpression.border, '#2563EB');
  assert.equal(NODE_STYLES.BinaryExpression.text, '#1E40AF');

  assert.equal(NODE_STYLES.UnaryExpression.fill, '#FFEDD5');
  assert.equal(NODE_STYLES.UnaryExpression.border, '#EA580C');
  assert.equal(NODE_STYLES.UnaryExpression.text, '#9A3412');

  assert.equal(NODE_STYLES.Identifier.fill, '#D1FAE5');
  assert.equal(NODE_STYLES.Identifier.border, '#059669');
  assert.equal(NODE_STYLES.Identifier.text, '#065F46');

  assert.equal(NODE_STYLES.Literal.fill, '#F3E8FF');
  assert.equal(NODE_STYLES.Literal.border, '#9333EA');
  assert.equal(NODE_STYLES.Literal.text, '#6B21A8');

  // Verify in export SVG of expression with multiplication root
  const astMul = parse('(x + y) * -(a - 2)');
  const exportMul = buildExportSvg(astMul);
  assert.ok(exportMul.svgString.includes('fill="#FEE2E2" stroke="#DC2626"'), 'Root node must be red regardless of operator');
  assert.ok(exportMul.svgString.includes('fill="#991B1B">'), 'Root node label text must be red (#991B1B)');
  assert.ok(exportMul.svgString.includes('fill="#DBEAFE" stroke="#2563EB"'), 'Child BinaryExpression must be blue');
  assert.ok(exportMul.svgString.includes('fill="#FFEDD5" stroke="#EA580C"'), 'Child UnaryExpression must be orange');
  assert.ok(exportMul.svgString.includes('fill="#D1FAE5" stroke="#059669"'), 'Child Identifier must be emerald');
  assert.ok(exportMul.svgString.includes('fill="#F3E8FF" stroke="#9333EA"'), 'Child NumericLiteral must be purple');
});

test('redesign: stress test layout on ~173 nodes, depth 12 arithmetic expression', async () => {
  const { computeCanvasCoordinates, buildExportSvg } = await import('../src/visualizer/treeRenderer.js');
  const { countNodes } = await import('../src/components/inspectAstPanel.js');

  function makeChain(depth) {
    if (depth <= 1) return 'x + 1';
    return '(' + makeChain(depth - 1) + ' + 1)';
  }
  function makeBalanced(leafCount) {
    if (leafCount <= 1) return 'v';
    const left = Math.floor(leafCount / 2);
    const right = leafCount - left;
    return '(' + makeBalanced(left) + ' + ' + makeBalanced(right) + ')';
  }

  // 173 nodes, depth 12
  const expr = '(' + makeChain(11) + ' + ' + makeBalanced(75) + ')';
  const ast = parse(expr);
  const total = countNodes(ast);
  assert.equal(total, 173);

  const coords = computeCanvasCoordinates(ast);
  assert.equal(coords.nodes.length, 173);
  assert.equal(coords.edges.length, 172);
  assert.ok(coords.width > 2000, 'Canvas width accommodates large subtree widths');
  assert.ok(coords.height > 1000, 'Canvas height accommodates 12 levels of tree');

  // Verify all coordinates are finite and non-negative
  for (const n of coords.nodes) {
    assert.ok(Number.isFinite(n.x) && n.x > 0);
    assert.ok(Number.isFinite(n.y) && n.y > 0);
    assert.equal(n.width, 64);
    assert.equal(n.height, 64);
  }

  // Verify export SVG generates cleanly for this large tree
  const exportData = buildExportSvg(ast);
  assert.ok(exportData);
  assert.ok(exportData.svgString.length > 50000);
});

test('redesign: traversal order computation for all modes on nested expressions', () => {
  const ast = parse('(a + b) * (c - 4)');
  const idMap = mapAstToNodeIds(ast);

  const preNodes = preorder(ast, { asNodes: true });
  const inNodes = inorder(ast, { asNodes: true });
  const postNodes = postorder(ast, { asNodes: true });

  assert.equal(preNodes.length, 7);
  assert.equal(inNodes.length, 7);
  assert.equal(postNodes.length, 7);

  // Preorder: * + a b - c 4
  assert.deepEqual(preNodes.map(n => n.operator || n.name || n.raw), ['*', '+', 'a', 'b', '-', 'c', '4']);
  // Inorder: a + b * c - 4
  assert.deepEqual(inNodes.map(n => n.operator || n.name || n.raw), ['a', '+', 'b', '*', 'c', '-', '4']);
  // Postorder: a b + c 4 - *
  assert.deepEqual(postNodes.map(n => n.operator || n.name || n.raw), ['a', 'b', '+', 'c', '4', '-', '*']);
});

test('redesign: updateTreeTraversal applies visit badges and handles active vs visited nodes', async () => {
  const { updateTreeTraversal } = await import('../src/visualizer/treeRenderer.js');

  // Create lightweight mock DOM container
  function createMockClassList() {
    const set = new Set();
    return {
      add: (...cls) => cls.forEach(c => set.add(c)),
      remove: (...cls) => cls.forEach(c => set.delete(c)),
      contains: (c) => set.has(c),
      has: (c) => set.has(c)
    };
  }

  function createMockNode(id, type) {
    const cardClassList = createMockClassList();
    const pulseClassList = createMockClassList();
    pulseClassList.add('hidden');
    const badgeClassList = createMockClassList();
    badgeClassList.add('hidden');

    const card = { classList: cardClassList };
    const pulse = { classList: pulseClassList };
    const badge = { classList: badgeClassList, textContent: '', className: '' };
    const subtitle = { className: '', textContent: '' };

    return {
      getAttribute: (attr) => attr === 'data-node-id' ? id : type,
      querySelector: (sel) => {
        if (sel === '.node-badge-card') return card;
        if (sel === '.active-pulse-indicator') return pulse;
        if (sel === '.visit-order-badge') return badge;
        if (sel === '.node-subtitle-tag') return subtitle;
        return null;
      },
      card, pulse, badge, subtitle
    };
  }

  const nodeRoot = createMockNode('root', 'BinaryExpression');
  const nodeLeft = createMockNode('root.0', 'Identifier');
  const nodeRight = createMockNode('root.1', 'Literal');

  const nodes = [nodeRoot, nodeLeft, nodeRight];
  const container = {
    querySelector: (sel) => {
      if (sel === '#tree-nodes-container') {
        return { querySelectorAll: () => nodes };
      }
      return null;
    }
  };

  // Traversal Step 1: Visiting nodeRoot (step 1 of 3)
  const visitedStep1 = new Map([['root', 1]]);
  updateTreeTraversal(container, {
    activeNodeId: 'root',
    visitedMap: visitedStep1,
    stepNumber: 1
  });

  assert.equal(nodeRoot.badge.textContent, '1');
  assert.equal(nodeRoot.badge.classList.contains('hidden'), false);
  assert.equal(nodeRoot.card.classList.contains('node-selected'), true);
  assert.equal(nodeRoot.pulse.classList.contains('hidden'), false);

  // Unvisited nodes are hidden and have opacity-75
  assert.equal(nodeLeft.badge.classList.contains('hidden'), true);
  assert.equal(nodeLeft.card.classList.contains('opacity-75'), true);

  // Traversal Step 2: Visiting nodeLeft (step 2 of 3)
  const visitedStep2 = new Map([['root', 1], ['root.0', 2]]);
  updateTreeTraversal(container, {
    activeNodeId: 'root.0',
    visitedMap: visitedStep2,
    stepNumber: 2
  });

  // root is previously visited: has badge '1', not selected
  assert.equal(nodeRoot.badge.textContent, '1');
  assert.equal(nodeRoot.badge.classList.contains('hidden'), false);
  assert.equal(nodeRoot.card.classList.contains('node-selected'), false);

  // nodeLeft is active: has badge '2', is selected
  assert.equal(nodeLeft.badge.textContent, '2');
  assert.equal(nodeLeft.badge.classList.contains('hidden'), false);
  assert.equal(nodeLeft.card.classList.contains('node-selected'), true);

  // Reset: clear all traversal
  updateTreeTraversal(container, {
    activeNodeId: null,
    visitedMap: new Map(),
    stepNumber: 0
  });

  assert.equal(nodeRoot.badge.classList.contains('hidden'), true);
  assert.equal(nodeLeft.badge.classList.contains('hidden'), true);
  assert.equal(nodeRoot.card.classList.contains('node-selected'), false);
  assert.equal(nodeLeft.card.classList.contains('node-selected'), false);
  assert.equal(nodeRoot.card.classList.contains('opacity-75'), false);
  assert.equal(nodeLeft.card.classList.contains('opacity-75'), false);
});

test('redesign: countNodes calculates accurate AST node counts across shapes', async () => {
  const { countNodes } = await import('../src/components/inspectAstPanel.js');

  assert.equal(countNodes(null), 0);
  assert.equal(countNodes(parse('42')), 1);
  assert.equal(countNodes(parse('x')), 1);
  assert.equal(countNodes(parse('-x')), 2);
  assert.equal(countNodes(parse('a + b')), 3);
  assert.equal(countNodes(parse('a + b * 2')), 5);
  assert.equal(countNodes(parse('(a + b) * (c - 4)')), 7);
});

test('redesign: highlightJson applies distinct color classes to JSON elements', async () => {
  const { highlightJson } = await import('../src/components/inspectAstPanel.js');

  const ast = parse('x + 1');
  const raw = JSON.stringify(ast, null, 2);
  const highlighted = highlightJson(raw);

  assert.ok(highlighted.includes('text-[#1D4ED8]'), 'Keys must be highlighted blue');
  assert.ok(highlighted.includes('text-[#047857]'), 'Strings must be highlighted green');
  assert.ok(highlighted.includes('text-[#6D28D9]'), 'Numbers must be highlighted purple');
});

test('redesign: createInspectAstPanel exposes required modal lifecycle methods', async () => {
  const { createInspectAstPanel } = await import('../src/components/inspectAstPanel.js');

  const panel = createInspectAstPanel();
  assert.ok(typeof panel.open === 'function');
  assert.ok(typeof panel.close === 'function');
  assert.ok(typeof panel.toggle === 'function');
  assert.ok(typeof panel.isOpen === 'function');
  assert.ok(typeof panel.update === 'function');
  assert.ok(typeof panel.clear === 'function');
  assert.equal(panel.isOpen(), false);
});

test('redesign: outputPanel defaults to inorder traversal mode', async () => {
  const { createOutputPanel } = await import('../src/components/outputPanel.js');

  const panelDefault = createOutputPanel();
  assert.equal(panelDefault.getActiveMode(), 'inorder', 'Default mode must be inorder');

  const panelExplicit = createOutputPanel({ defaultMode: 'postorder' });
  assert.equal(panelExplicit.getActiveMode(), 'postorder', 'Explicit mode should be respected');
});

test('redesign: PRESET_EXPRESSIONS contains the exact 5 updated preset expressions', async () => {
  const { PRESET_EXPRESSIONS } = await import('../src/components/editor.js');
  assert.deepEqual(PRESET_EXPRESSIONS, [
    'a + b * 2',
    '(x + y) * (a - b)',
    '-x * (y + 4)',
    'a - b - c + d',
    '(a + b) * (c - d) / 2'
  ]);
  assert.ok(!PRESET_EXPRESSIONS.includes('1 + 2 + 3 + 4'), 'Must not include removed preset 1 + 2 + 3 + 4');
  assert.ok(!PRESET_EXPRESSIONS.includes('42'), 'Must not include removed preset 42');
});

test('redesign: each updated preset generates valid AST with accurate node count and depth', async () => {
  const { PRESET_EXPRESSIONS } = await import('../src/components/editor.js');

  function calculateTreeMetrics(node) {
    let count = 0;
    let maxDepth = 0;
    function walk(current, depth) {
      if (!current || typeof current !== 'object') return;
      count += 1;
      if (depth > maxDepth) maxDepth = depth;
      if (current.type === 'BinaryExpression') {
        walk(current.left, depth + 1);
        walk(current.right, depth + 1);
      } else if (current.type === 'UnaryExpression') {
        walk(current.argument, depth + 1);
      }
    }
    walk(node, 1);
    return { count, maxDepth };
  }

  const expectedMetrics = {
    'a + b * 2': { count: 5, maxDepth: 3 },
    '(x + y) * (a - b)': { count: 7, maxDepth: 3 },
    '-x * (y + 4)': { count: 6, maxDepth: 3 },
    'a - b - c + d': { count: 7, maxDepth: 4 },
    '(a + b) * (c - d) / 2': { count: 9, maxDepth: 4 }
  };

  for (const expr of PRESET_EXPRESSIONS) {
    const ast = parse(expr);
    assert.ok(ast, `AST must exist for preset "${expr}"`);
    const metrics = calculateTreeMetrics(ast);
    assert.deepEqual(metrics, expectedMetrics[expr], `Metrics for "${expr}" must match`);
  }
});
