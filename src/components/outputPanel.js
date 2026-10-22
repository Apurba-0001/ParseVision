import { setTreeZoom, renderTree, renderEmptyTree, mapAstToNodeIds, nodeLabel, updateTreeTraversal } from '../visualizer/treeRenderer.js';
import { preorder, inorder, postorder, formatNode } from '../traversal/traversal.js';
import { showToast } from './toast.js';

/**
 * Output panel with integrated Traversal Controls and AST Visualization Canvas.
 * Directly integrates Preorder, Inorder, and Postorder playback, visit step numbering,
 * active node pulse, speed selector, and viewport controls.
 */
export function createOutputPanel(options = {}) {
  const section = document.createElement('section');
  section.className = 'relative neu-pane rounded-xl p-3 md:p-4 flex flex-col flex-1 min-h-[500px] bg-grid-dots overflow-hidden';
  section.setAttribute('aria-label', 'AST Visualization Canvas');

  const onNodeClickCallback = typeof options.onNodeClick === 'function' ? options.onNodeClick : null;

  section.innerHTML = `
    <!-- Top Canvas Bar with Embedded Traversal Toolbar & Viewport Controls -->
    <div class="flex flex-wrap items-center justify-between gap-2.5 z-10 select-none pb-2.5 border-b border-[#E3E7F0]/60">
      <div class="flex items-center gap-2">
        <span class="text-headline-sm font-headline-sm text-on-surface">Syntax Tree Graph</span>
        <span class="text-label-code-sm font-label-code-sm px-2 py-0.5 rounded bg-surface-container text-secondary border border-outline-variant" id="viz-hierarchy-badge">Orthogonal Hierarchy</span>
      </div>

      <!-- Integrated Controls Cluster -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Compact Traversal Toolbar -->
        <div class="flex items-center gap-1.5 bg-[#F8F9FC] p-1 rounded-lg border border-[#E3E7F0] shadow-sm" role="toolbar" aria-label="AST Traversal Controls">
          <!-- Traversal Strategy Selector -->
          <div class="flex items-center p-0.5 bg-[#F1F3F8] rounded-md neu-recessed" role="radiogroup" aria-label="Traversal Mode">
            <button class="trav-mode-btn px-2.5 py-0.5 rounded text-label-code-sm font-label-code-sm text-secondary hover:text-on-surface cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" data-mode="preorder" role="radio" aria-checked="false" id="btn-mode-preorder" title="Preorder (Node → Left → Right)" type="button">
              Preorder
            </button>
            <button class="trav-mode-btn px-2.5 py-0.5 rounded text-label-code-sm font-label-code-sm neu-micro text-primary font-semibold shadow-xs cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" data-mode="inorder" role="radio" aria-checked="true" id="btn-mode-inorder" title="Inorder (Left → Node → Right)" type="button">
              Inorder
            </button>
            <button class="trav-mode-btn px-2.5 py-0.5 rounded text-label-code-sm font-label-code-sm text-secondary hover:text-on-surface cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" data-mode="postorder" role="radio" aria-checked="false" id="btn-mode-postorder" title="Postorder (Left → Right → Node)" type="button">
              Postorder
            </button>
          </div>

          <div class="h-4 w-px bg-outline-variant/60 mx-0.5"></div>

          <!-- Play / Pause / Replay Button -->
          <button class="px-2.5 h-7 rounded neu-button-primary text-white flex items-center gap-1 text-label-code-sm font-label-code-sm font-medium transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" id="btn-canvas-play" type="button" title="Play traversal animation" aria-label="Play traversal animation">
            <span class="material-symbols-outlined text-base leading-none" id="icon-canvas-play">play_arrow</span>
            <span id="label-canvas-play">Play</span>
          </button>

          <!-- Reset Button -->
          <button class="w-7 h-7 rounded flex items-center justify-center neu-micro text-secondary hover:text-primary transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" id="btn-canvas-reset" type="button" title="Reset traversal" aria-label="Reset traversal">
            <span class="material-symbols-outlined text-sm">replay</span>
          </button>

          <!-- Compact Progress Indicator (e.g. 0 / 5) -->
          <div class="flex items-center px-2 h-7 rounded neu-recessed text-label-code-sm font-label-code-sm font-mono text-secondary" id="trav-progress-indicator" title="Traversal progress: step / total nodes" aria-live="polite">
            <span id="trav-progress-text">0 / 5</span>
          </div>

          <!-- Compact Playback Speed Selector -->
          <div class="flex items-center gap-0.5 pl-0.5" title="Playback speed">
            <button class="trav-speed-btn px-1.5 h-6 rounded text-[11px] font-mono neu-micro-pressed text-primary font-bold cursor-pointer transition-all focus:outline-none" data-speed="1" type="button" title="1x Normal speed">1x</button>
            <button class="trav-speed-btn px-1.5 h-6 rounded text-[11px] font-mono text-secondary hover:text-on-surface cursor-pointer transition-all focus:outline-none" data-speed="1.5" type="button" title="1.5x Fast speed">1.5x</button>
            <button class="trav-speed-btn px-1.5 h-6 rounded text-[11px] font-mono text-secondary hover:text-on-surface cursor-pointer transition-all focus:outline-none" data-speed="2" type="button" title="2x High speed">2x</button>
          </div>
        </div>

        <!-- Viewport Controls (Zoom / Fit / Center) -->
        <div class="flex items-center gap-1 bg-[#F8F9FC] p-1 rounded-lg border border-[#E3E7F0] shadow-sm">
          <button class="w-7 h-7 rounded flex items-center justify-center neu-micro text-secondary hover:text-primary cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" title="Zoom In" type="button" id="btn-tree-zoom-in" aria-label="Zoom In">
            <span class="material-symbols-outlined text-sm">add</span>
          </button>
          <button class="w-7 h-7 rounded flex items-center justify-center neu-micro text-secondary hover:text-primary cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" title="Zoom Out" type="button" id="btn-tree-zoom-out" aria-label="Zoom Out">
            <span class="material-symbols-outlined text-sm">remove</span>
          </button>
          <div class="h-4 w-px bg-outline-variant/60 mx-0.5"></div>
          <button class="px-2 h-7 rounded flex items-center justify-center neu-micro text-label-code-sm font-label-code-sm text-secondary hover:text-primary cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" title="Reset Zoom to 100%" type="button" id="btn-tree-zoom-reset">
            100%
          </button>
          <button class="w-7 h-7 rounded flex items-center justify-center neu-micro text-secondary hover:text-primary cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" title="Center Tree Viewport" type="button" id="btn-tree-center" aria-label="Center Tree Viewport">
            <span class="material-symbols-outlined text-sm">filter_center_focus</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Interactive Canvas Coordinate Plane -->
    <div class="relative flex-1 w-full min-h-[380px] overflow-auto flex items-center justify-center" id="tree-canvas-viewport" tabindex="0" role="region" aria-label="AST Tree Viewport">
      <div class="relative w-[780px] min-h-[340px] select-none mx-auto" id="tree-coordinate-plane">
        <!-- SVG Connecting Lines -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none" id="tree-svg-edges" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="edgeGradient" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stop-color="#94A3B8" stop-opacity="0.9"></stop>
              <stop offset="100%" stop-color="#CBD5E1" stop-opacity="0.7"></stop>
            </linearGradient>
            <filter height="120%" id="lineShadow" width="120%" x="-10%" y="-10%">
              <feDropShadow dx="0" dy="1" flood-color="#A6B2C9" flood-opacity="0.3" stdDeviation="1"></feDropShadow>
            </filter>
          </defs>
          <g class="tree-edges-group"></g>
        </svg>
        <!-- AST Nodes DOM Container -->
        <div id="tree-nodes-container" class="absolute inset-0 pointer-events-auto"></div>
      </div>
    </div>

    <!-- Canvas Footer: Legend of AST Node Classes & Inspection Prompt -->
    <div class="pt-2 border-t border-[#E3E7F0] flex flex-wrap items-center justify-between gap-2 z-10 text-label-code-sm font-label-code-sm">
      <div class="flex items-center gap-2">
        <span class="text-secondary font-medium">Node Schema:</span>
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="px-2 py-0.5 rounded bg-[#DCE7FF] text-[#1D4ED8] border border-[#B4C6FC]">BinaryExpression</span>
          <span class="px-2 py-0.5 rounded bg-[#FCE8C8] text-[#B45309] border border-[#F5D099]">UnaryExpression</span>
          <span class="px-2 py-0.5 rounded bg-[#D9F2E4] text-[#047857] border border-[#B3E5C8]">Identifier</span>
          <span class="px-2 py-0.5 rounded bg-[#EDE0FF] text-[#6D28D9] border border-[#D5BFFC]">NumericLiteral</span>
        </div>
      </div>
      <div class="text-secondary text-xs flex items-center gap-1" id="node-inspector-tip">
        <span class="material-symbols-outlined text-sm">touch_app</span>
        <span>Click any node to inspect semantic properties</span>
      </div>
    </div>
  `;

  // DOM Elements
  const canvasViewport = section.querySelector('#tree-canvas-viewport');
  const coordinatePlane = section.querySelector('#tree-coordinate-plane');
  const svg = section.querySelector('#tree-svg-edges');
  const hierarchyBadge = section.querySelector('#viz-hierarchy-badge');

  // Zoom controls
  const btnZoomIn = section.querySelector('#btn-tree-zoom-in');
  const btnZoomOut = section.querySelector('#btn-tree-zoom-out');
  const btnZoomReset = section.querySelector('#btn-tree-zoom-reset');
  const btnCenter = section.querySelector('#btn-tree-center');

  // Traversal controls
  const modeButtons = section.querySelectorAll('.trav-mode-btn');
  const btnPlay = section.querySelector('#btn-canvas-play');
  const iconPlay = section.querySelector('#icon-canvas-play');
  const labelPlay = section.querySelector('#label-canvas-play');
  const btnReset = section.querySelector('#btn-canvas-reset');
  const progressText = section.querySelector('#trav-progress-text');
  const speedButtons = section.querySelectorAll('.trav-speed-btn');

  // Zoom state
  let currentZoom = 1;

  function applyZoom(zoom) {
    currentZoom = Math.min(Math.max(zoom, 0.5), 2.5);
    setTreeZoom(coordinatePlane, currentZoom);
    btnZoomReset.textContent = `${Math.round(currentZoom * 100)}%`;
  }

  function centerTree() {
    applyZoom(1);
    if (canvasViewport && coordinatePlane) {
      const scrollX = Math.max(0, (coordinatePlane.clientWidth - canvasViewport.clientWidth) / 2);
      canvasViewport.scrollLeft = scrollX;
      canvasViewport.scrollTop = 0;
    }
  }

  btnZoomIn.addEventListener('click', () => applyZoom(currentZoom + 0.2));
  btnZoomOut.addEventListener('click', () => applyZoom(currentZoom - 0.2));
  btnZoomReset.addEventListener('click', () => applyZoom(1));
  btnCenter.addEventListener('click', centerTree);

  // ==========================================
  // Integrated Traversal Controller
  // ==========================================
  let currentAst = null;
  let activeMode = options.defaultMode || 'inorder'; // 'inorder' | 'preorder' | 'postorder'
  let steps = []; // [{ id, node, label, type, formatted }]
  let currentStepIndex = -1; // -1 = unstarted / reset; 0..steps.length-1
  let isPlaying = false;
  let playTimer = null;
  let playbackSpeed = 1;
  const BASE_INTERVAL = 800; // ms per step at 1x
  let selectedNodeId = null;

  function computeSteps(ast, mode) {
    if (!ast) return [];
    try {
      const idMap = mapAstToNodeIds(ast);
      let nodes = [];
      if (mode === 'preorder') nodes = preorder(ast, { asNodes: true });
      else if (mode === 'inorder') nodes = inorder(ast, { asNodes: true });
      else if (mode === 'postorder') nodes = postorder(ast, { asNodes: true });

      return nodes.map((node) => {
        const id = idMap.get(node) || 'root';
        const label = nodeLabel(node);
        return {
          id,
          node,
          label,
          type: node.type,
          formatted: formatNode(node)
        };
      });
    } catch {
      return [];
    }
  }

  function updateTraversalUi() {
    const total = steps.length;

    if (!currentAst || total === 0) {
      btnPlay.disabled = true;
      btnReset.disabled = true;
      iconPlay.textContent = 'play_arrow';
      labelPlay.textContent = 'Play';
      btnPlay.setAttribute('aria-label', 'Play traversal animation (disabled)');
      progressText.textContent = '0 / 0';
      updateTreeTraversal(coordinatePlane, {
        activeNodeId: null,
        visitedMap: new Map(),
        stepNumber: 0,
        selectedNodeId: null
      });
      return;
    }

    btnPlay.disabled = false;
    btnReset.disabled = false;

    const isAtEnd = currentStepIndex >= total - 1;
    const isUnstarted = currentStepIndex < 0;

    // Button label and icon
    if (isPlaying) {
      iconPlay.textContent = 'pause';
      labelPlay.textContent = 'Pause';
      btnPlay.setAttribute('aria-label', 'Pause traversal animation');
    } else if (isAtEnd) {
      iconPlay.textContent = 'replay';
      labelPlay.textContent = 'Replay';
      btnPlay.setAttribute('aria-label', 'Replay traversal from beginning');
    } else {
      iconPlay.textContent = 'play_arrow';
      labelPlay.textContent = 'Play';
      btnPlay.setAttribute('aria-label', isUnstarted ? 'Play traversal animation' : 'Resume traversal animation');
    }

    // Progress counter
    const currentStepDisplay = isUnstarted ? 0 : currentStepIndex + 1;
    progressText.textContent = `${currentStepDisplay} / ${total}`;

    // Visited map for tree node badges
    const visitedMap = new Map();
    if (!isUnstarted) {
      for (let i = 0; i <= currentStepIndex; i++) {
        if (steps[i]) {
          visitedMap.set(steps[i].id, i + 1);
        }
      }
    }

    const activeNodeId = (currentStepIndex >= 0 && steps[currentStepIndex]) ? steps[currentStepIndex].id : null;

    updateTreeTraversal(coordinatePlane, {
      activeNodeId,
      visitedMap,
      stepNumber: currentStepDisplay,
      selectedNodeId
    });
  }

  function pauseTraversal() {
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
    isPlaying = false;
    updateTraversalUi();
  }

  function startTraversal() {
    if (!currentAst || steps.length === 0) return;

    // Prevent concurrent loops
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }

    // If at end or unstarted, restart from 0
    if (currentStepIndex >= steps.length - 1 || currentStepIndex < 0) {
      currentStepIndex = 0;
    }

    isPlaying = true;
    updateTraversalUi();

    const interval = Math.max(150, BASE_INTERVAL / playbackSpeed);

    playTimer = setInterval(() => {
      if (currentStepIndex < steps.length - 1) {
        currentStepIndex += 1;
        updateTraversalUi();
      } else {
        // Traversal finished: stop at final node
        pauseTraversal();
      }
    }, interval);
  }

  function resetTraversal() {
    pauseTraversal();
    currentStepIndex = -1;
    selectedNodeId = null;
    updateTraversalUi();
  }

  function setMode(mode) {
    if (activeMode === mode && steps.length > 0) return;
    pauseTraversal();
    activeMode = mode;

    modeButtons.forEach((btn) => {
      const isTarget = btn.getAttribute('data-mode') === mode;
      btn.setAttribute('aria-checked', String(isTarget));
      if (isTarget) {
        btn.className = 'trav-mode-btn px-2.5 py-0.5 rounded text-label-code-sm font-label-code-sm neu-micro text-primary font-semibold shadow-xs cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary';
      } else {
        btn.className = 'trav-mode-btn px-2.5 py-0.5 rounded text-label-code-sm font-label-code-sm text-secondary hover:text-on-surface cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary';
      }
    });

    if (currentAst) {
      steps = computeSteps(currentAst, activeMode);
    } else {
      steps = [];
    }
    currentStepIndex = -1;
    selectedNodeId = null;
    updateTraversalUi();
  }

  function setSpeed(speed) {
    playbackSpeed = speed;
    speedButtons.forEach((btn) => {
      const btnSpeed = parseFloat(btn.getAttribute('data-speed')) || 1;
      if (btnSpeed === speed) {
        btn.className = 'trav-speed-btn px-1.5 h-6 rounded text-[11px] font-mono neu-micro-pressed text-primary font-bold cursor-pointer transition-all focus:outline-none';
      } else {
        btn.className = 'trav-speed-btn px-1.5 h-6 rounded text-[11px] font-mono text-secondary hover:text-on-surface cursor-pointer transition-all focus:outline-none';
      }
    });

    // If currently running, apply speed update immediately
    if (isPlaying) {
      if (playTimer) {
        clearInterval(playTimer);
        playTimer = null;
      }
      const interval = Math.max(150, BASE_INTERVAL / playbackSpeed);
      playTimer = setInterval(() => {
        if (currentStepIndex < steps.length - 1) {
          currentStepIndex += 1;
          updateTraversalUi();
        } else {
          pauseTraversal();
        }
      }, interval);
    }
  }

  // Event Listeners for Traversal Controls
  btnPlay.addEventListener('click', () => {
    if (isPlaying) {
      pauseTraversal();
    } else {
      startTraversal();
    }
  });

  btnReset.addEventListener('click', () => {
    resetTraversal();
  });

  modeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      setMode(mode);
    });
  });

  speedButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.getAttribute('data-speed')) || 1;
      setSpeed(speed);
    });
  });

  // Node Click: Semantic Inspection without corrupting traversal
  function handleNodeClick(nodeId) {
    selectedNodeId = nodeId;

    // Find node details from AST
    if (currentAst) {
      const idMap = mapAstToNodeIds(currentAst);
      let targetNode = null;
      for (const [node, path] of idMap.entries()) {
        if (path === nodeId) {
          targetNode = node;
          break;
        }
      }

      if (targetNode) {
        let desc = `${targetNode.type}`;
        if (targetNode.type === 'BinaryExpression') {
          desc = `BinaryExpression: operator '${targetNode.operator}'`;
        } else if (targetNode.type === 'UnaryExpression') {
          desc = `UnaryExpression: operator '${targetNode.operator}'`;
        } else if (targetNode.type === 'Identifier') {
          desc = `Identifier: '${targetNode.name}'`;
        } else if (targetNode.type === 'Literal') {
          desc = `NumericLiteral: '${targetNode.raw ?? targetNode.value}'`;
        }
        showToast(desc);
      }
    }

    if (onNodeClickCallback) {
      onNodeClickCallback(nodeId);
    }

    // Refresh highlighting to show selection ring
    updateTraversalUi();
  }

  function setMetrics(nodeCount, maxDepth) {
    hierarchyBadge.textContent = 'Orthogonal Hierarchy';
    if (nodeCount > 0) {
      hierarchyBadge.title = `${nodeCount} nodes · depth ${maxDepth}`;
    }
  }

  function resetZoom() {
    currentZoom = 1;
    btnZoomReset.textContent = '100%';
    setTreeZoom(coordinatePlane, 1);
  }

  function updateAst(ast) {
    pauseTraversal();
    currentAst = ast;
    coordinatePlane.__currentAst = ast;
    selectedNodeId = null;
    currentStepIndex = -1;

    if (ast) {
      renderTree(coordinatePlane, ast, {
        onNodeClick: handleNodeClick
      });
      steps = computeSteps(ast, activeMode);
    } else {
      renderEmptyTree(coordinatePlane);
      steps = [];
    }

    updateTraversalUi();
  }

  function clearAst() {
    updateAst(null);
  }

  function focusTraversalControls() {
    btnPlay.focus();
  }

  function cleanup() {
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
    isPlaying = false;
  }

  return {
    element: section,
    svg,
    container: coordinatePlane,
    viewport: canvasViewport,
    setMetrics,
    resetZoom,
    centerTree,
    updateAst,
    clearAst,
    setMode,
    getActiveMode: () => activeMode,
    startTraversal,
    pauseTraversal,
    resetTraversal,
    focusTraversalControls,
    cleanup
  };
}
