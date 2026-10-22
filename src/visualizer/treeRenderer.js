import { NODE_DIMENSIONS, NODE_STYLES, TRAVERSAL_STYLES } from './nodeStyles.js';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const SUPPORTED_TYPES = new Set(Object.keys(NODE_STYLES));

function assert(condition, message) {
  if (!condition) throw new TypeError(message);
}

function childrenFor(node) {
  assert(node !== null && typeof node === 'object', 'An AST node object is required for visualization.');
  assert(SUPPORTED_TYPES.has(node.type), `Unsupported AST node type "${node.type ?? 'unknown'}".`);
  if (node.type === 'BinaryExpression') {
    assert(typeof node.operator === 'string' && node.operator.length > 0, 'BinaryExpression requires an operator label.');
    return [node.left, node.right];
  }
  if (node.type === 'UnaryExpression') {
    assert(typeof node.operator === 'string' && node.operator.length > 0, 'UnaryExpression requires an operator label.');
    return [node.argument];
  }
  if (node.type === 'Identifier') {
    assert(typeof node.name === 'string' && node.name.length > 0, 'Identifier requires a name label.');
    return [];
  }
  assert(typeof node.raw === 'string' && node.raw.length > 0, 'Literal requires raw numeric text.');
  return [];
}

/** Return the concise text shown for an AST node. */
export function nodeLabel(node) {
  childrenFor(node);
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'Literal') return node.raw;
  return node.operator;
}

function nodeWidth() {
  return NODE_DIMENSIONS.width;
}

function buildSubtree(node, depth, path, ancestors) {
  assert(!ancestors.has(node), 'AST cannot contain a circular node reference.');
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(node);
  const label = nodeLabel(node);
  const children = childrenFor(node).map((child, index) => buildSubtree(child, depth + 1, `${path}.${index}`, nextAncestors));
  const childrenWidth = children.reduce((total, child) => total + child.subtreeWidth, 0)
    + Math.max(0, children.length - 1) * NODE_DIMENSIONS.siblingGap;
  return {
    id: path,
    type: node.type,
    label,
    depth,
    width: nodeWidth(label),
    subtreeWidth: Math.max(nodeWidth(label), childrenWidth),
    children,
    astNode: node
  };
}

function assignPositions(subtree, left, nodes, edges) {
  const x = left + subtree.subtreeWidth / 2;
  const y = NODE_DIMENSIONS.margin + subtree.depth * NODE_DIMENSIONS.levelGap;
  nodes.push({
    id: subtree.id,
    type: subtree.type,
    label: subtree.label,
    x,
    y,
    width: NODE_DIMENSIONS.width,
    height: NODE_DIMENSIONS.height,
    astNode: subtree.astNode
  });
  const childrenWidth = subtree.children.reduce((total, child) => total + child.subtreeWidth, 0)
    + Math.max(0, subtree.children.length - 1) * NODE_DIMENSIONS.siblingGap;
  let childLeft = left + (subtree.subtreeWidth - childrenWidth) / 2;
  for (const child of subtree.children) {
    edges.push({ from: subtree.id, to: child.id });
    assignPositions(child, childLeft, nodes, edges);
    childLeft += child.subtreeWidth + NODE_DIMENSIONS.siblingGap;
  }
}

/** Calculate deterministic top-down positions without using the DOM. (Used by tests and SVG export) */
export function layoutAst(ast) {
  const root = buildSubtree(ast, 0, 'root', new Set());
  const nodes = [];
  const edges = [];
  assignPositions(root, NODE_DIMENSIONS.margin, nodes, edges);
  const maximumDepth = Math.max(...nodes.map((node) => Math.round((node.y - NODE_DIMENSIONS.margin) / NODE_DIMENSIONS.levelGap)));
  return {
    nodes,
    edges,
    width: Math.ceil(root.subtreeWidth + NODE_DIMENSIONS.margin * 2),
    height: NODE_DIMENSIONS.margin * 2 + NODE_DIMENSIONS.height + maximumDepth * NODE_DIMENSIONS.levelGap
  };
}

/**
 * Maps each AST node object in the tree to its deterministic path ID ('root', 'root.0', etc.).
 */
export function mapAstToNodeIds(ast) {
  const map = new Map();
  function walk(current, path) {
    if (!current || typeof current !== 'object') return;
    map.set(current, path);
    if (current.type === 'BinaryExpression') {
      walk(current.left, `${path}.0`);
      walk(current.right, `${path}.1`);
    } else if (current.type === 'UnaryExpression') {
      walk(current.argument, `${path}.0`);
    }
  }
  walk(ast, 'root');
  return map;
}

/**
 * Calculates responsive pixel coordinates for the canvas and export SVG.
 * Uses uniform 64x64 node sizing and subtree widths so subtrees, nodes,
 * and labels never collide or overlap.
 */
export function computeCanvasCoordinates(ast) {
  if (!ast) return { nodes: [], edges: [], width: 780, height: 340 };
  const root = buildSubtree(ast, 0, 'root', new Set());
  const nodes = [];
  const rawEdges = [];

  // Canvas base width is 780px. If tree is wider, expand with padding.
  const canvasWidth = Math.max(780, Math.ceil(root.subtreeWidth + 96));
  const startLeft = Math.max(24, Math.floor((canvasWidth - root.subtreeWidth) / 2));

  function assignCanvasPositions(subtree, left) {
    const x = Math.round(left + subtree.subtreeWidth / 2);
    const y = 20 + subtree.depth * NODE_DIMENSIONS.levelGap;

    nodes.push({
      id: subtree.id,
      type: subtree.type,
      label: subtree.label,
      node: subtree.astNode,
      depth: subtree.depth,
      x,
      y,
      width: NODE_DIMENSIONS.width,
      height: NODE_DIMENSIONS.height
    });

    const childrenWidth = subtree.children.reduce((total, child) => total + child.subtreeWidth, 0)
      + Math.max(0, subtree.children.length - 1) * NODE_DIMENSIONS.siblingGap;
    let childLeft = left + (subtree.subtreeWidth - childrenWidth) / 2;
    for (const child of subtree.children) {
      rawEdges.push({ from: subtree.id, to: child.id });
      assignCanvasPositions(child, childLeft);
      childLeft += child.subtreeWidth + NODE_DIMENSIONS.siblingGap;
    }
  }

  assignCanvasPositions(root, startLeft);

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const edges = rawEdges.map(e => {
    const parent = nodeMap.get(e.from);
    const child = nodeMap.get(e.to);
    return {
      from: e.from,
      to: e.to,
      parentX: parent ? parent.x : 0,
      parentY: parent ? parent.y : 0,
      childX: child ? child.x : 0,
      childY: child ? child.y : 0
    };
  });

  const maxY = Math.max(...nodes.map(n => n.y), 20);
  const canvasHeight = Math.max(340, maxY + 100);

  return { nodes, edges, width: canvasWidth, height: canvasHeight };
}

/**
 * Generates cubic bezier SVG path between parent and child node coordinates.
 */
function generateBezierPath(parentX, parentY, childX, childY) {
  const startY = parentY + 64; // Bottom center of 64px box
  const deltaY = childY - startY;
  const cp1Y = startY + deltaY * 0.45;
  const cp2Y = startY + deltaY * 0.65;
  return `M ${parentX} ${startY} C ${parentX} ${cp1Y}, ${childX} ${cp2Y}, ${childX} ${childY}`;
}

/**
 * Render empty state in the canvas.
 */
export function renderEmptyTree(container, message = 'Enter an arithmetic expression and select Generate AST to view its tree.') {
  if (!container) return;
  const plane = container.querySelector('#tree-coordinate-plane') || container;
  const nodesContainer = plane.querySelector('#tree-nodes-container');
  const edgesGroup = plane.querySelector('.tree-edges-group');

  if (edgesGroup) edgesGroup.innerHTML = '';
  if (nodesContainer) {
    nodesContainer.innerHTML = `
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-secondary select-none">
        <span class="material-symbols-outlined text-4xl text-outline-variant mb-2">account_tree</span>
        <p class="text-label-code-md font-label-code-md">${message}</p>
      </div>
    `;
  }
}

/**
 * Renders the AST tree on the canvas matching Stitch code.html and screen.png exactly.
 */
export function renderTree(container, ast, options = {}) {
  if (!container || !ast) return;
  const onNodeClick = typeof options.onNodeClick === 'function' ? options.onNodeClick : null;

  const plane = container.querySelector('#tree-coordinate-plane') || container;
  const nodesContainer = plane.querySelector('#tree-nodes-container');
  const edgesGroup = plane.querySelector('.tree-edges-group');

  if (!nodesContainer || !edgesGroup) return;

  const { nodes, edges, width, height } = computeCanvasCoordinates(ast);

  if (plane && plane.style) {
    if (width > 780) {
      plane.style.minWidth = `${width}px`;
    } else {
      plane.style.minWidth = '';
    }
    if (height > 340) {
      plane.style.minHeight = `${height}px`;
    } else {
      plane.style.minHeight = '';
    }
  }

  const svg = plane.querySelector('svg');
  if (svg) {
    const planeW = Math.max(780, width);
    const planeH = Math.max(340, height);
    svg.setAttribute('viewBox', `0 0 ${planeW} ${planeH}`);
    svg.setAttribute('width', `${planeW}`);
    svg.setAttribute('height', `${planeH}`);
  }

  // Render SVG Bezier Edges
  let edgesHtml = '';
  for (const edge of edges) {
    const d = generateBezierPath(edge.parentX, edge.parentY, edge.childX, edge.childY);
    edgesHtml += `
      <path data-from="${edge.from}" data-to="${edge.to}" d="${d}" fill="none" filter="url(#lineShadow)" stroke="url(#edgeGradient)" stroke-linecap="round" stroke-width="2"></path>
    `;
  }
  edgesGroup.innerHTML = edgesHtml;

  // Render HTML Node Badges
  let nodesHtml = '';
  for (let i = 0; i < nodes.length; i++) {
    const { id, type, label, node, x, y } = nodes[i];
    // Fixed uniform 64px x 64px box for all node types
    const cardSize = 'w-16 h-16 min-w-[64px] min-h-[64px] max-w-[64px] max-h-[64px]';
    let cardBg = 'bg-[#DCE7FF]';
    let cardBorder = 'border-[#B4C6FC]';
    let textColor = 'text-[#1D4ED8]';
    let subtitle = '';

    if (type === 'BinaryExpression') {
      cardBg = 'bg-[#DCE7FF]';
      cardBorder = 'border-[#B4C6FC]';
      textColor = 'text-[#1D4ED8]';
      subtitle = 'BinaryExpression';
    } else if (type === 'UnaryExpression') {
      cardBg = 'bg-[#FCE8C8]';
      cardBorder = 'border-[#F5D099]';
      textColor = 'text-[#B45309]';
      subtitle = 'UnaryExpression';
    } else if (type === 'Identifier') {
      cardBg = 'bg-[#D9F2E4]';
      cardBorder = 'border-[#B3E5C8]';
      textColor = 'text-[#047857]';
      subtitle = 'Identifier';
    } else if (type === 'Literal') {
      cardBg = 'bg-[#EDE0FF]';
      cardBorder = 'border-[#D5BFFC]';
      textColor = 'text-[#6D28D9]';
      subtitle = 'NumericLiteral';
    }

    // Controlled font scaling for long values inside the 64x64 box
    const labelStr = String(label ?? '');
    let textClass = 'font-label-code-lg text-headline-md font-bold';
    if (labelStr.length > 6) {
      textClass = 'font-mono text-[11px] font-bold tracking-tight';
    } else if (labelStr.length > 4) {
      textClass = 'font-mono text-[13px] font-bold';
    } else if (labelStr.length > 2) {
      textClass = 'font-mono text-[16px] font-bold';
    }

    nodesHtml += `
      <div class="ast-tree-node absolute left-[${x}px] top-[${y}px] -translate-x-1/2 flex flex-col items-center group cursor-pointer" data-node-id="${id}" data-node-type="${type}">
        <div class="relative">
          <div class="node-badge-card flex items-center justify-center ${cardSize} rounded-xl ${cardBg} border ${cardBorder} ast-badge-shadow transition-all group-hover:scale-105 p-1 text-center select-none overflow-hidden">
            <span class="${textClass} ${textColor} text-center select-none truncate max-w-full px-1" title="${labelStr}">${labelStr}</span>
            <span class="active-pulse-indicator absolute top-1 right-1 flex h-2.5 w-2.5 hidden">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
          </div>
          <!-- Visit Order Badge: Compact number badge on node top-left -->
          <span class="visit-order-badge absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[#2156B5] text-white text-[11px] font-mono font-bold flex items-center justify-center shadow-md border-2 border-white select-none z-20 hidden" aria-label="Visit step"></span>
        </div>
        <div class="node-subtitle-tag mt-1.5 px-2.5 py-0.5 rounded bg-white/80 border border-[#E3E7F0] shadow-xs text-label-code-sm font-label-code-sm text-secondary select-none whitespace-nowrap text-center">
          ${subtitle}
        </div>
      </div>
    `;
  }

  nodesContainer.innerHTML = nodesHtml;

  // Add click listeners to nodes
  nodesContainer.querySelectorAll('.ast-tree-node').forEach((nodeEl) => {
    nodeEl.addEventListener('click', () => {
      const nodeId = nodeEl.getAttribute('data-node-id');
      if (onNodeClick) onNodeClick(nodeId);
    });
  });

  return { nodes, edges };
}

/**
 * Updates traversal highlighting and numbering on the canvas.
 * Distinguishes active node, previously visited nodes (with step numbers),
 * and not-yet-visited nodes.
 */
export function updateTreeTraversal(container, { activeNodeId = null, visitedMap = new Map(), stepNumber = null, selectedNodeId = null } = {}) {
  if (!container) return;
  const plane = container.querySelector('#tree-coordinate-plane') || container;
  const nodesContainer = plane.querySelector('#tree-nodes-container');
  const edgesGroup = plane.querySelector('.tree-edges-group');

  if (!nodesContainer) return;

  const hasVisited = visitedMap && visitedMap.size > 0;
  const nodeEls = nodesContainer.querySelectorAll('.ast-tree-node');

  nodeEls.forEach((nodeEl) => {
    const id = nodeEl.getAttribute('data-node-id');
    const card = nodeEl.querySelector('.node-badge-card');
    const pulse = nodeEl.querySelector('.active-pulse-indicator');
    const badge = nodeEl.querySelector('.visit-order-badge');
    const subtitle = nodeEl.querySelector('.node-subtitle-tag');
    const nodeType = nodeEl.getAttribute('data-node-type');
    const displayType = (nodeType === 'Literal' ? 'NumericLiteral' : nodeType);

    const isActive = (id === activeNodeId);
    const isVisited = visitedMap && visitedMap.has(id);
    const isManuallySelected = (id === selectedNodeId);

    // 1. Visit Order Badge display
    if (badge) {
      if (isVisited) {
        badge.textContent = String(visitedMap.get(id));
        badge.classList.remove('hidden');
        if (isActive) {
          badge.className = 'visit-order-badge absolute -top-2 -left-2 w-5 h-5 rounded-full bg-primary text-white text-[11px] font-mono font-bold flex items-center justify-center shadow-md border-2 border-white ring-2 ring-primary/40 select-none z-20 scale-110 transition-transform';
        } else {
          badge.className = 'visit-order-badge absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[#3B475B] text-white text-[11px] font-mono font-bold flex items-center justify-center shadow-sm border border-white/80 select-none z-20 scale-100 transition-transform';
        }
      } else {
        badge.classList.add('hidden');
      }
    }

    // 2. Card highlighting & active pulse
    if (isActive) {
      card.classList.add('border-2', 'border-[#2156B5]', 'node-selected', 'ring-2', 'ring-[#2156B5]/30');
      card.classList.remove('opacity-75');
      if (pulse) pulse.classList.remove('hidden');
      if (subtitle) {
        subtitle.className = 'node-subtitle-tag mt-1.5 px-2.5 py-0.5 rounded bg-primary-container text-white text-label-code-sm font-label-code-sm shadow-xs font-semibold select-none text-center';
        subtitle.textContent = displayType;
      }
    } else if (isVisited) {
      card.classList.remove('border-2', 'border-[#2156B5]', 'node-selected', 'ring-2', 'ring-[#2156B5]/30');
      card.classList.remove('opacity-75');
      if (pulse) pulse.classList.add('hidden');
      if (subtitle) {
        subtitle.className = 'node-subtitle-tag mt-1.5 px-2.5 py-0.5 rounded bg-white/80 border border-[#E3E7F0] shadow-xs text-label-code-sm font-label-code-sm text-secondary select-none whitespace-nowrap text-center';
        subtitle.textContent = displayType;
      }
    } else {
      // Not yet visited
      card.classList.remove('border-2', 'border-[#2156B5]', 'node-selected', 'ring-2', 'ring-[#2156B5]/30');
      if (pulse) pulse.classList.add('hidden');
      if (subtitle) {
        subtitle.className = 'node-subtitle-tag mt-1.5 px-2.5 py-0.5 rounded bg-white/80 border border-[#E3E7F0] shadow-xs text-label-code-sm font-label-code-sm text-secondary select-none whitespace-nowrap text-center';
        subtitle.textContent = displayType;
      }
      if (hasVisited) {
        card.classList.add('opacity-75');
      } else {
        card.classList.remove('opacity-75');
      }
    }

    // 3. Manual node selection indicator (if not already active)
    if (isManuallySelected && !isActive) {
      card.classList.add('ring-2', 'ring-secondary/50');
    } else if (!isActive) {
      card.classList.remove('ring-2', 'ring-secondary/50');
    }
  });

  // Update edge stroke for active node
  if (edgesGroup) {
    const paths = edgesGroup.querySelectorAll('path');
    paths.forEach((path) => {
      const toId = path.getAttribute('data-to');
      if (toId === activeNodeId) {
        path.classList.add('stroke-primary');
        path.setAttribute('stroke-width', '2.5');
      } else {
        path.classList.remove('stroke-primary');
        path.setAttribute('stroke-width', '2');
      }
    });
  }
}

/**
 * Adjusts zoom scale while maintaining centering. Compatible with tests.
 */
export function setTreeZoom(svgOrPlane, zoomFactor = 1) {
  if (!svgOrPlane) return;
  const clampedZoom = Math.min(Math.max(zoomFactor, 0.5), 2.5);

  // If mockSvg with dataset baseWidth/baseHeight
  if (svgOrPlane.dataset && svgOrPlane.dataset.baseWidth && svgOrPlane.dataset.baseHeight && typeof svgOrPlane.setAttribute === 'function') {
    const baseW = Number(svgOrPlane.dataset.baseWidth);
    const baseH = Number(svgOrPlane.dataset.baseHeight);
    const scaledW = baseW / clampedZoom;
    const scaledH = baseH / clampedZoom;
    const offsetX = (baseW - scaledW) / 2;
    const offsetY = (baseH - scaledH) / 2;
    svgOrPlane.setAttribute('viewBox', `${offsetX} ${offsetY} ${scaledW} ${scaledH}`);
    svgOrPlane.dataset.currentZoom = String(clampedZoom);
    return;
  }

  // DOM plane zoom via CSS transform
  const plane = svgOrPlane.querySelector('#tree-coordinate-plane') || svgOrPlane;
  if (plane && plane.style) {
    plane.style.transform = `scale(${clampedZoom})`;
    plane.style.transformOrigin = 'center center';
  }
}

/**
 * Escapes characters for safe inclusion in SVG markup.
 */
function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds standalone, pixel-perfect SVG markup for exporting the AST tree.
 * Computes exact extents across all nodes, subtitle tags, and connectors to ensure
 * zero clipping, crisp typography, and consistent solid background.
 */
export function buildExportSvg(ast) {
  if (!ast) return null;

  const { nodes, edges } = computeCanvasCoordinates(ast);
  if (!nodes || nodes.length === 0) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const processedNodes = nodes.map((item, index) => {
    const { id, type, label, node, x, y } = item;
    const stepNum = index + 1;
    const labelStr = String(label || '');

    // Uniform 64x64 node box for all node types
    const cardW = 64;
    const cardH = 64;
    let cardBg = '#DCE7FF';
    let cardBorder = '#B4C6FC';
    let textColor = '#1D4ED8';
    let subtitle = '';

    if (type === 'BinaryExpression') {
      cardBg = '#DCE7FF';
      cardBorder = '#B4C6FC';
      textColor = '#1D4ED8';
      subtitle = 'BinaryExpression';
    } else if (type === 'UnaryExpression') {
      cardBg = '#FCE8C8';
      cardBorder = '#F5D099';
      textColor = '#B45309';
      subtitle = 'UnaryExpression';
    } else if (type === 'Identifier') {
      cardBg = '#D9F2E4';
      cardBorder = '#B3E5C8';
      textColor = '#047857';
      subtitle = 'Identifier';
    } else if (type === 'Literal') {
      cardBg = '#EDE0FF';
      cardBorder = '#D5BFFC';
      textColor = '#6D28D9';
      subtitle = 'NumericLiteral';
    }

    // Font scaling for value text inside 64x64 box
    let fontSize = 20;
    if (labelStr.length > 6) {
      fontSize = 11;
    } else if (labelStr.length > 4) {
      fontSize = 13;
    } else if (labelStr.length > 2) {
      fontSize = 16;
    }

    const pillW = Math.max(76, subtitle.length * 6.5 + 16);
    const pillH = 20;

    const leftExtent = Math.min(x - cardW / 2, x - pillW / 2);
    const rightExtent = Math.max(x + cardW / 2, x + pillW / 2);
    const topExtent = y;
    const bottomExtent = y + cardH + 4 + pillH;

    minX = Math.min(minX, leftExtent);
    maxX = Math.max(maxX, rightExtent);
    minY = Math.min(minY, topExtent);
    maxY = Math.max(maxY, bottomExtent);

    return {
      id, type, label: labelStr, node, x, y, stepNum,
      cardW, cardH, cardBg, cardBorder, textColor, fontSize,
      subtitle, pillW, pillH
    };
  });

  const padding = 50;
  const exportX = Math.round(minX - padding);
  const exportY = Math.round(minY - padding);
  const exportWidth = Math.round((maxX - minX) + padding * 2);
  const exportHeight = Math.round((maxY - minY) + padding * 2);

  // Generate Bezier edge paths
  let edgesSvg = '';
  for (const edge of edges) {
    const d = generateBezierPath(edge.parentX, edge.parentY, edge.childX, edge.childY);
    edgesSvg += `    <path d="${d}" fill="none" stroke="url(#exportEdgeGrad)" stroke-width="2.5" stroke-linecap="round" filter="url(#exportLineShadow)" />\n`;
  }

  // Generate Nodes markup
  let nodesSvg = '';
  for (const n of processedNodes) {
    const cardX = n.x - n.cardW / 2;
    const cardY = n.y;
    const pillX = n.x - n.pillW / 2;
    const pillY = cardY + n.cardH + 4;
    const pillTextY = pillY + 14;
    const textCenterY = cardY + 32 + (n.fontSize * 0.35);

    nodesSvg += `    <g class="ast-node" data-id="${escapeXml(n.id)}" data-type="${escapeXml(n.type)}">\n`;
    nodesSvg += `      <!-- Uniform 64x64 Card -->\n`;
    nodesSvg += `      <rect x="${cardX}" y="${cardY}" width="64" height="64" rx="12" fill="${n.cardBg}" stroke="${n.cardBorder}" stroke-width="1.5" filter="url(#exportNodeShadow)" />\n`;
    nodesSvg += `      <!-- Centered Label -->\n`;
    nodesSvg += `      <text x="${n.x}" y="${textCenterY}" text-anchor="middle" font-family="'JetBrains Mono', 'Fira Code', Consolas, monospace" font-size="${n.fontSize}" font-weight="700" fill="${n.textColor}">${escapeXml(n.label)}</text>\n`;
    nodesSvg += `      <!-- Subtitle Tag below box -->\n`;
    nodesSvg += `      <rect x="${pillX}" y="${pillY}" width="${n.pillW}" height="${n.pillH}" rx="5" fill="#FFFFFF" stroke="#E3E7F0" stroke-width="1" />\n`;
    nodesSvg += `      <text x="${n.x}" y="${pillTextY}" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="500" fill="#68758A">${escapeXml(n.subtitle)}</text>\n`;
    nodesSvg += `    </g>\n`;
  }


  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${exportX} ${exportY} ${exportWidth} ${exportHeight}" width="${exportWidth}" height="${exportHeight}">
  <defs>
    <filter id="exportNodeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.08" />
    </filter>
    <filter id="exportLineShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#64748B" flood-opacity="0.15" />
    </filter>
    <linearGradient id="exportEdgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#94A3B8" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#CBD5E1" stop-opacity="0.8" />
    </linearGradient>
  </defs>

  <!-- Clean Solid Background -->
  <rect x="${exportX}" y="${exportY}" width="${exportWidth}" height="${exportHeight}" fill="#F8F9FC" />

  <!-- Edges -->
  <g class="edges">
${edgesSvg}  </g>

  <!-- Nodes -->
  <g class="nodes">
${nodesSvg}  </g>
</svg>`;

  return {
    svgString,
    width: exportWidth,
    height: exportHeight
  };
}

/**
 * Rasterizes SVG markup to a high-resolution PNG Blob using an offscreen HTML5 canvas.
 */
function rasterizeSvgToPng(svgString, logicalWidth, logicalHeight, scale = 2.5) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(null);
      return;
    }

    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        try {
          const width = logicalWidth || img.naturalWidth || 800;
          const height = logicalHeight || img.naturalHeight || 400;

          const canvas = document.createElement('canvas');
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(null);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);

          canvas.toBlob((pngBlob) => {
            resolve(pngBlob);
          }, 'image/png');
        } catch {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Exports currently displayed AST graph as a high-quality downloadable PNG image.
 */
export async function exportTreeAsPng(containerOrSvg, filename = 'parsevision-ast.png', explicitAst = null) {
  if (!containerOrSvg && !explicitAst) return false;
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  try {
    let ast = explicitAst;
    if (!ast && containerOrSvg) {
      if (containerOrSvg.__currentAst) {
        ast = containerOrSvg.__currentAst;
      } else if (typeof window !== 'undefined' && window.__parsevision_ast) {
        ast = window.__parsevision_ast;
      }
    }

    if (!ast) {
      return false;
    }

    const exportData = buildExportSvg(ast);
    if (!exportData || !exportData.svgString) return false;

    const pngBlob = await rasterizeSvgToPng(exportData.svgString, exportData.width, exportData.height, 2.5);
    if (!pngBlob) return false;

    const url = URL.createObjectURL(pngBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'parsevision-ast.png';
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1500);

    return true;
  } catch (err) {
    console.error('Failed to export AST as PNG:', err);
    return false;
  }
}

/**
 * Legacy stub for SVG export (retained for backward test compatibility).
 */
export function exportTreeAsSvg(svgOrContainer) {
  if (!svgOrContainer) return false;
  return false;
}

