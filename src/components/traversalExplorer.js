import { preorder, inorder, postorder, formatNode } from '../traversal/traversal.js';
import { mapAstToNodeIds, nodeLabel } from '../visualizer/treeRenderer.js';
import { showToast } from './toast.js';

/**
 * Traversal Explorer matching Section 3 of Stitch code.html and DESIGN.md.
 * Provides interactive algorithmic playback, step pipeline with status tags,
 * and current action educational feedback.
 */
export function createTraversalExplorer(options = {}) {
  const onStepChange = typeof options.onStepChange === 'function' ? options.onStepChange : () => {};

  const section = document.createElement('section');
  section.className = 'neu-pane rounded-xl p-3.5 flex flex-col gap-3';
  section.setAttribute('aria-label', 'Tree Traversal Engine');

  section.innerHTML = `
    <!-- Traversal Header & Strategy Selector -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
      <div class="flex items-center gap-2">
        <span class="w-6 h-6 rounded neu-micro flex items-center justify-center text-primary">
          <span class="material-symbols-outlined text-sm">route</span>
        </span>
        <h2 class="text-headline-sm font-headline-sm text-on-surface">Tree Traversal Engine</h2>
        <span class="text-label-code-sm font-label-code-sm px-2 py-0.5 rounded bg-surface-container text-secondary border border-outline-variant">Runtime Execution</span>
      </div>
      <!-- Traversal Strategy Tabs -->
      <div class="flex items-center p-0.5 bg-[#F1F3F8] rounded-lg neu-recessed self-start md:self-auto" role="tablist">
        <button class="tab-btn px-3 py-1 rounded text-label-code-sm font-label-code-sm text-secondary hover:text-on-surface transition-all cursor-pointer" data-mode="preorder" role="tab" aria-selected="false" id="tab-preorder">
          Preorder (NLR)
        </button>
        <button class="tab-btn px-3 py-1 rounded text-label-code-sm font-label-code-sm neu-micro text-primary font-semibold shadow-xs cursor-pointer" data-mode="inorder" role="tab" aria-selected="true" id="tab-inorder">
          Inorder (LNR)
        </button>
        <button class="tab-btn px-3 py-1 rounded text-label-code-sm font-label-code-sm text-secondary hover:text-on-surface transition-all cursor-pointer" data-mode="postorder" role="tab" aria-selected="false" id="tab-postorder">
          Postorder (LRN)
        </button>
      </div>
    </div>
    <!-- Playback Controls Bar -->
    <div class="flex flex-wrap items-center justify-between gap-3 p-2 rounded-lg neu-recessed">
      <div class="flex items-center gap-1">
        <!-- Reset / First -->
        <button class="w-8 h-8 rounded flex items-center justify-center neu-micro text-secondary hover:text-primary transition-all cursor-pointer" title="First Node" type="button" id="btn-trav-first">
          <span class="material-symbols-outlined text-base">first_page</span>
        </button>
        <!-- Step Previous -->
        <button class="w-8 h-8 rounded flex items-center justify-center neu-micro text-secondary hover:text-primary transition-all cursor-pointer" title="Step Back" type="button" id="btn-trav-prev">
          <span class="material-symbols-outlined text-base">chevron_left</span>
        </button>
        <!-- Play / Pause -->
        <button class="px-3 h-8 rounded neu-button-primary text-white flex items-center gap-1.5 text-label-code-sm font-label-code-sm transition-all active:scale-95 cursor-pointer" title="Play Execution" type="button" id="btn-trav-play">
          <span class="material-symbols-outlined text-base" id="icon-trav-play">play_arrow</span>
          <span id="label-trav-play">Step Auto</span>
        </button>
        <!-- Step Next -->
        <button class="w-8 h-8 rounded flex items-center justify-center neu-micro text-secondary hover:text-primary transition-all cursor-pointer" title="Step Next" type="button" id="btn-trav-next">
          <span class="material-symbols-outlined text-base">chevron_right</span>
        </button>
        <!-- Last -->
        <button class="w-8 h-8 rounded flex items-center justify-center neu-micro text-secondary hover:text-primary transition-all cursor-pointer" title="Last Node" type="button" id="btn-trav-last">
          <span class="material-symbols-outlined text-base">last_page</span>
        </button>
      </div>
      <!-- Step Status & Execution Velocity -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container border border-outline-variant text-label-code-sm font-label-code-sm text-on-surface" id="trav-state-badge">
          <span class="font-medium text-secondary">State:</span>
          <span class="font-semibold text-primary" id="trav-step-num">Step 3 of 5</span>
          <span class="text-secondary" id="trav-step-visiting">(Visiting: <code class="font-bold text-primary">'*'</code>)</span>
        </div>
        <div class="flex items-center gap-1 text-label-code-sm font-label-code-sm text-secondary">
          <span>Speed:</span>
          <div class="flex items-center bg-[#F8F9FC] border border-[#E3E7F0] rounded p-0.5" id="speed-container">
            <button class="speed-btn px-1.5 py-0.5 rounded neu-micro-pressed text-primary font-bold cursor-pointer" data-speed="1">1x</button>
            <button class="speed-btn px-1.5 py-0.5 rounded hover:text-on-surface cursor-pointer" data-speed="1.5">1.5x</button>
            <button class="speed-btn px-1.5 py-0.5 rounded hover:text-on-surface cursor-pointer" data-speed="2">2x</button>
          </div>
        </div>
      </div>
    </div>
    <!-- Visual Sequence Track: Flow of Nodes -->
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between text-label-code-sm font-label-code-sm text-secondary">
        <span>Execution Sequence Pipeline:</span>
        <button class="flex items-center gap-1 text-primary hover:underline font-medium cursor-pointer" type="button" id="btn-copy-sequence">
          <span class="material-symbols-outlined text-sm">content_copy</span>
          <span>Copy Sequence</span>
        </button>
      </div>
      <div class="flex items-center gap-2 overflow-x-auto py-2 px-1" id="traversal-pipeline-track"></div>
      <!-- Traversal Explanation Feedback note -->
      <div class="mt-1 flex items-start gap-2 p-2 rounded-lg bg-surface-container border border-outline-variant text-label-code-sm font-label-code-sm" id="traversal-feedback-box">
        <span class="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5">info</span>
        <div class="text-on-surface" id="traversal-action-text">
          <strong class="text-primary">Current Action:</strong> Visiting right child operator <code class="font-mono px-1 py-0.5 rounded bg-white border border-[#E3E7F0] font-bold text-[#1D4ED8]">*</code> before descending to evaluate sub-operands <code class="font-mono text-[#047857]">'b'</code> and <code class="font-mono text-[#6D28D9]">'2'</code>.
        </div>
      </div>
    </div>
  `;

  // Element handles
  const tabs = section.querySelectorAll('.tab-btn');
  const btnFirst = section.querySelector('#btn-trav-first');
  const btnPrev = section.querySelector('#btn-trav-prev');
  const btnPlay = section.querySelector('#btn-trav-play');
  const btnNext = section.querySelector('#btn-trav-next');
  const btnLast = section.querySelector('#btn-trav-last');
  const iconPlay = section.querySelector('#icon-trav-play');
  const labelPlay = section.querySelector('#label-trav-play');
  const stepNumEl = section.querySelector('#trav-step-num');
  const stepVisitingEl = section.querySelector('#trav-step-visiting');
  const speedButtons = section.querySelectorAll('.speed-btn');
  const pipelineTrack = section.querySelector('#traversal-pipeline-track');
  const actionText = section.querySelector('#traversal-action-text');
  const btnCopy = section.querySelector('#btn-copy-sequence');

  // State
  let currentAst = null;
  let activeMode = options.defaultMode || 'inorder'; // 'inorder' | 'preorder' | 'postorder'
  let currentSteps = []; // [{ id, node, label, type, role }]
  let currentStepIndex = 2; // 0-based: 2 = step 3 of 5 for initial matching
  let playTimer = null;
  let playbackSpeed = 1;
  const BASE_INTERVAL = 850;

  function stopPlay() {
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
    iconPlay.textContent = 'play_arrow';
    labelPlay.textContent = 'Step Auto';
  }

  function getNodeRole(path, parent) {
    if (path === 'root') return '(Root)';
    if (path.endsWith('.0')) {
      return parent?.type === 'UnaryExpression' ? '(Operand)' : '(Left)';
    }
    if (path.endsWith('.1')) return '(Right)';
    return '(Child)';
  }

  function computeSteps(ast, mode) {
    if (!ast) return [];
    try {
      const idMap = mapAstToNodeIds(ast);
      let nodes = [];
      if (mode === 'preorder') nodes = preorder(ast, { asNodes: true });
      else if (mode === 'inorder') nodes = inorder(ast, { asNodes: true });
      else nodes = postorder(ast, { asNodes: true });

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

  function getActionExplanation(step, mode) {
    if (!step) return 'Select Auto Step or Next to begin traversal exploration.';
    const { id, node } = step;

    if (id === 'root.1' && node.operator === '*') {
      return `Visiting right child operator <code class="font-mono px-1 py-0.5 rounded bg-white border border-[#E3E7F0] font-bold text-[#1D4ED8]">*</code> before descending to evaluate sub-operands <code class="font-mono text-[#047857]">'b'</code> and <code class="font-mono text-[#6D28D9]">'2'</code>.`;
    }

    if (node.type === 'BinaryExpression') {
      if (mode === 'preorder') {
        return `Visiting binary operator <code class="font-mono px-1 py-0.5 rounded bg-white border border-[#E3E7F0] font-bold text-[#1D4ED8]">${node.operator}</code> before descending to evaluate child operands.`;
      } else if (mode === 'inorder') {
        return `Visiting binary operator <code class="font-mono px-1 py-0.5 rounded bg-white border border-[#E3E7F0] font-bold text-[#1D4ED8]">${node.operator}</code> after evaluating left subtree and before right subtree.`;
      } else {
        return `Visiting binary operator <code class="font-mono px-1 py-0.5 rounded bg-white border border-[#E3E7F0] font-bold text-[#1D4ED8]">${node.operator}</code> after evaluating both left and right subtrees.`;
      }
    } else if (node.type === 'UnaryExpression') {
      return `Visiting unary operator <code class="font-mono px-1 py-0.5 rounded bg-white border border-[#E3E7F0] font-bold text-[#B45309]">${node.operator}</code> for argument.`;
    } else if (node.type === 'Identifier') {
      return `Evaluating variable identifier <code class="font-mono text-[#047857] font-bold">'${node.name}'</code>.`;
    } else if (node.type === 'Literal' || node.type === 'NumericLiteral') {
      return `Evaluating numeric literal constant <code class="font-mono text-[#6D28D9] font-bold">'${node.raw || node.value}'</code>.`;
    }
    return `Visiting AST node ${nodeLabel(node)}.`;
  }

  function renderPipeline() {
    pipelineTrack.innerHTML = '';
    const total = currentSteps.length;
    if (total === 0) return;

    for (let i = 0; i < total; i++) {
      const step = currentSteps[i];
      const stepNum = i + 1;
      const isActive = (i === currentStepIndex);
      const isPast = (i < currentStepIndex);
      const isPending = (i > currentStepIndex);

      let roleText = '(Child)';
      if (step.id === 'root') roleText = '(Root)';
      else if (step.id.endsWith('.0')) roleText = '(Left)';
      else if (step.id.endsWith('.1')) roleText = '(Right)';

      if (isActive) roleText = '(Active)';
      else if (isPending) roleText = '(Pending)';

      let colorClass = 'text-[#1D4ED8]';
      let circleBg = 'bg-[#1D4ED8]';
      if (step.type === 'UnaryExpression') { colorClass = 'text-[#B45309]'; circleBg = 'bg-[#B45309]'; }
      else if (step.type === 'Identifier') { colorClass = 'text-[#047857]'; circleBg = 'bg-[#047857]'; }
      else if (step.type === 'Literal' || step.type === 'NumericLiteral') { colorClass = 'text-[#6D28D9]'; circleBg = 'bg-[#6D28D9]'; }

      const stepWrapper = document.createElement('div');
      stepWrapper.className = 'flex items-center gap-2 flex-shrink-0';

      const pill = document.createElement('div');
      pill.setAttribute('role', 'button');
      pill.setAttribute('tabindex', '0');
      pill.className = 'cursor-pointer select-none';

      if (isActive) {
        pill.className = 'flex items-center gap-2 px-3.5 py-1.5 rounded-lg neu-button-primary text-white text-label-code-sm font-label-code-sm font-bold ring-2 ring-primary/40 shadow-md cursor-pointer select-none';
        pill.innerHTML = `
          <span class="w-4 h-4 rounded-full bg-white text-primary text-[10px] font-bold flex items-center justify-center">${stepNum}</span>
          <span class="font-mono text-base">${step.label}</span>
          <span class="text-white/90 text-[11px]">(Active)</span>
        `;
      } else if (isPast) {
        pill.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg neu-micro bg-[#F8F9FC] border border-[#E3E7F0] text-label-code-sm font-label-code-sm cursor-pointer select-none';
        pill.innerHTML = `
          <span class="w-4 h-4 rounded-full ${circleBg} text-white text-[10px] font-bold flex items-center justify-center">${stepNum}</span>
          <span class="font-mono font-bold ${colorClass}">${step.label}</span>
          <span class="text-secondary text-[11px]">${roleText}</span>
        `;
      } else {
        pill.className = 'flex items-center gap-2 px-3 py-1.5 rounded-lg neu-micro bg-[#F8F9FC] border border-[#E3E7F0] text-label-code-sm font-label-code-sm opacity-70 cursor-pointer select-none';
        pill.innerHTML = `
          <span class="w-4 h-4 rounded-full ${circleBg} text-white text-[10px] font-bold flex items-center justify-center">${stepNum}</span>
          <span class="font-mono font-bold ${colorClass}">${step.label}</span>
          <span class="text-secondary text-[11px]">(Pending)</span>
        `;
      }

      pill.addEventListener('click', () => {
        goToStep(i);
      });

      stepWrapper.append(pill);

      if (i < total - 1) {
        const arrow = document.createElement('span');
        arrow.className = 'material-symbols-outlined text-secondary text-sm select-none';
        arrow.textContent = 'arrow_forward';
        stepWrapper.append(arrow);
      }

      pipelineTrack.append(stepWrapper);
    }
  }

  function updateUi() {
    const total = currentSteps.length;
    if (total === 0) {
      stepNumEl.textContent = 'Step 0 of 0';
      stepVisitingEl.innerHTML = '(No AST loaded)';
      actionText.innerHTML = '<strong class="text-primary">Current Action:</strong> Enter an expression to inspect traversal steps.';
      pipelineTrack.innerHTML = '';
      return;
    }

    const currentStep = currentSteps[currentStepIndex] || currentSteps[0];
    const stepNumber = currentStepIndex + 1;

    stepNumEl.textContent = `Step ${stepNumber} of ${total}`;
    stepVisitingEl.innerHTML = `(Visiting: <code class="font-bold text-primary">'${currentStep.label}'</code>)`;
    actionText.innerHTML = `<strong class="text-primary">Current Action:</strong> ${getActionExplanation(currentStep, activeMode)}`;

    renderPipeline();

    // Map of visited nodes up to currentStepIndex
    const visitedMap = new Map();
    for (let i = 0; i <= currentStepIndex; i++) {
      visitedMap.set(currentSteps[i].id, i + 1);
    }

    onStepChange({
      activeNodeId: currentStep.id,
      visitedMap,
      stepNumber,
      activeStepIndex: currentStepIndex,
      totalSteps: total
    });
  }

  function goToStep(index) {
    if (currentSteps.length === 0) return;
    currentStepIndex = Math.max(0, Math.min(index, currentSteps.length - 1));
    updateUi();
  }

  // Playback handlers
  btnFirst.addEventListener('click', () => {
    stopPlay();
    goToStep(0);
  });

  btnPrev.addEventListener('click', () => {
    stopPlay();
    goToStep(currentStepIndex - 1);
  });

  btnNext.addEventListener('click', () => {
    stopPlay();
    if (currentStepIndex < currentSteps.length - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      goToStep(0);
    }
  });

  btnLast.addEventListener('click', () => {
    stopPlay();
    goToStep(currentSteps.length - 1);
  });

  btnPlay.addEventListener('click', () => {
    if (playTimer) {
      stopPlay();
    } else {
      if (currentSteps.length === 0) return;
      if (currentStepIndex >= currentSteps.length - 1) {
        currentStepIndex = 0;
        updateUi();
      }
      iconPlay.textContent = 'pause';
      labelPlay.textContent = 'Pause';
      const interval = BASE_INTERVAL / playbackSpeed;
      playTimer = setInterval(() => {
        if (currentStepIndex < currentSteps.length - 1) {
          goToStep(currentStepIndex + 1);
        } else {
          stopPlay();
        }
      }, interval);
    }
  });

  // Speed selection
  speedButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      speedButtons.forEach((b) => {
        b.className = 'speed-btn px-1.5 py-0.5 rounded hover:text-on-surface cursor-pointer';
      });
      btn.className = 'speed-btn px-1.5 py-0.5 rounded neu-micro-pressed text-primary font-bold cursor-pointer';
      playbackSpeed = parseFloat(btn.getAttribute('data-speed')) || 1;
      if (playTimer) {
        stopPlay();
        btnPlay.click();
      }
    });
  });

  // Strategy tabs
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => {
        t.className = 'tab-btn px-3 py-1 rounded text-label-code-sm font-label-code-sm text-secondary hover:text-on-surface transition-all cursor-pointer';
        t.setAttribute('aria-selected', 'false');
      });
      tab.className = 'tab-btn px-3 py-1 rounded text-label-code-sm font-label-code-sm neu-micro text-primary font-semibold shadow-xs cursor-pointer';
      tab.setAttribute('aria-selected', 'true');

      activeMode = tab.getAttribute('data-mode');
      stopPlay();
      if (currentAst) {
        currentSteps = computeSteps(currentAst, activeMode);
        // keep step index within bounds
        currentStepIndex = 0;
        updateUi();
      }
    });
  });

  // Copy sequence
  btnCopy.addEventListener('click', async () => {
    if (currentSteps.length === 0) return;
    const seqStr = currentSteps.map((s, i) => `${i + 1}. ${s.formatted || s.label}`).join(' -> ');
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(seqStr);
      }
      showToast('Traversal sequence copied to clipboard!');
    } catch {
      showToast('Copied sequence!');
    }
  });

  function update(ast, targetStepIndex = null) {
    currentAst = ast;
    stopPlay();
    currentSteps = computeSteps(ast, activeMode);
    if (targetStepIndex !== null) {
      currentStepIndex = targetStepIndex;
    } else if (ast && ast.type === 'BinaryExpression' && ast.operator === '+' && ast.right?.operator === '*') {
      // For a + b * 2 initial state, set to step 3 (0-indexed 2) to match screen.png!
      currentStepIndex = 2;
    } else {
      currentStepIndex = 0;
    }
    updateUi();
  }

  function jumpToNodeId(nodeId) {
    const idx = currentSteps.findIndex((s) => s.id === nodeId);
    if (idx !== -1) {
      stopPlay();
      goToStep(idx);
    }
  }

  function clear(message = 'Fix the expression to generate an AST and inspect traversals.') {
    currentAst = null;
    stopPlay();
    currentSteps = [];
    currentStepIndex = 0;
    updateUi();
    actionText.textContent = message;
  }

  function showError(msg) {
    clear(msg);
  }

  return {
    element: section,
    update,
    jumpToNodeId,
    clear,
    showError,
    setMode(mode) {
      const targetTab = section.querySelector(`[data-mode="${mode}"]`);
      if (targetTab) targetTab.click();
    }
  };
}
