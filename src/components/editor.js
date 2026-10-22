export const EXAMPLE_EXPRESSIONS = [
  'a + b * 2',
  '(a + b) * 2',
  '10 - 4 - 2',
  '-(a + 3) * 2',
  'total / count + 5'
];

export const PRESET_EXPRESSIONS = [
  'a + b * 2',
  '(x + y) * (a - b)',
  '-x * (y + 4)',
  '1 + 2 + 3 + 4',
  '42'
];

/**
 * Expression editor component designed from Stitch code.html and DESIGN.md.
 */
export function createEditor(options = 'a + b * 2') {
  const initialValue = typeof options === 'string' ? options : (options?.initialValue ?? 'a + b * 2');
  const onSelectExample = typeof options === 'object' && typeof options?.onSelectExample === 'function'
    ? options.onSelectExample
    : null;
  const presets = typeof options === 'object' && Array.isArray(options?.examples)
    ? options.examples
    : PRESET_EXPRESSIONS;

  const section = document.createElement('section');
  section.className = 'neu-pane rounded-xl p-3 md:p-3.5 flex flex-col gap-2.5';
  section.setAttribute('aria-label', 'Expression Editor');

  section.innerHTML = `
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <!-- Inset Monospace Expression Input Form -->
      <div class="flex-1 flex items-center gap-2">
        <div class="flex-1 flex items-center neu-recessed rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary-container transition-all">
          <span class="material-symbols-outlined text-secondary text-base select-none mr-2">function</span>
          <span class="text-label-code-sm font-label-code-sm text-secondary select-none mr-2">expr:</span>
          <input class="w-full bg-transparent border-none p-0 text-label-code-lg font-label-code-lg text-on-surface focus:outline-none focus:ring-0 placeholder-secondary tracking-wide font-mono" id="expression-input" placeholder="Enter arithmetic expression..." type="text" value="${initialValue}"/>
          <button class="text-secondary hover:text-error transition-colors p-0.5 rounded cursor-pointer" id="clear-input-btn" type="button" title="Clear input">
            <span class="material-symbols-outlined text-base">cancel</span>
          </button>
        </div>
        <!-- Direct Execution Buttons -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <button class="px-3.5 py-2 rounded-lg text-label-code-md font-label-code-md text-on-primary neu-button-primary transition-all duration-150 active:scale-95 flex items-center gap-1.5 cursor-pointer" id="btn-generate-ast" type="button">
            <span class="material-symbols-outlined text-base">auto_awesome</span>
            <span>Generate AST</span>
          </button>
          <button class="px-3 py-2 rounded-lg text-label-code-md font-label-code-md neu-micro text-secondary hover:text-primary transition-all duration-150 active:scale-95 cursor-pointer" id="btn-clear-expr" type="button">
            Clear
          </button>
        </div>
      </div>
      <!-- Parser Diagnostic / Telemetry -->
      <div class="flex items-center gap-2 text-label-code-sm font-label-code-sm text-secondary neu-micro px-3 py-1.5 rounded-lg self-start lg:self-auto" id="parser-diagnostic">
        <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" id="parser-status-dot"></span>
        <span id="parser-status-text">Valid arithmetic grammar (LL(1) / Pratt parsed in <strong>1.2ms</strong>)</span>
      </div>
    </div>
    <!-- Preset Example Chips -->
    <div class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#E3E7F0]">
      <span class="text-body-sm font-body-sm text-secondary mr-1">Presets:</span>
      <div id="preset-chips-container" class="flex flex-wrap items-center gap-1.5"></div>
    </div>
    <div class="status-message" role="status" aria-live="polite" hidden></div>
  `;

  const input = section.querySelector('#expression-input');
  const clearInputBtn = section.querySelector('#clear-input-btn');
  const button = section.querySelector('#btn-generate-ast');
  const clearButton = section.querySelector('#btn-clear-expr');
  const statusElement = section.querySelector('.status-message');
  const diagnostic = section.querySelector('#parser-diagnostic');
  const diagnosticDot = section.querySelector('#parser-status-dot');
  const diagnosticText = section.querySelector('#parser-status-text');
  const chipsContainer = section.querySelector('#preset-chips-container');
  const exampleButtons = [];

  clearInputBtn.addEventListener('click', () => {
    input.value = '';
    input.focus();
  });

  for (let i = 0; i < presets.length; i++) {
    const expr = presets[i];
    const chip = document.createElement('button');
    chip.type = 'button';
    // First preset active by default
    if (i === 0) {
      chip.className = 'preset-btn px-2.5 py-1 rounded text-label-code-sm font-label-code-sm neu-micro-pressed text-primary font-semibold border border-primary-container bg-surface-container cursor-pointer';
    } else {
      chip.className = 'preset-btn px-2.5 py-1 rounded text-label-code-sm font-label-code-sm neu-micro text-on-surface-variant hover:text-primary transition-all cursor-pointer';
    }
    chip.textContent = expr;
    chip.setAttribute('aria-label', `Load expression: ${expr}`);
    chip.addEventListener('click', () => {
      // Update active preset styling
      section.querySelectorAll('.preset-btn').forEach((btn) => {
        btn.className = 'preset-btn px-2.5 py-1 rounded text-label-code-sm font-label-code-sm neu-micro text-on-surface-variant hover:text-primary transition-all cursor-pointer';
      });
      chip.className = 'preset-btn px-2.5 py-1 rounded text-label-code-sm font-label-code-sm neu-micro-pressed text-primary font-semibold border border-primary-container bg-surface-container cursor-pointer';

      input.value = expr;
      input.focus();
      if (onSelectExample) {
        onSelectExample(expr);
      }
    });
    chipsContainer.append(chip);
    exampleButtons.push(chip);
  }

  function setDiagnostic(valid = true, message = '', parseTimeMs = '1.2') {
    if (valid) {
      diagnosticDot.className = 'inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
      diagnosticText.innerHTML = `Valid arithmetic grammar (LL(1) / Pratt parsed in <strong>${parseTimeMs}ms</strong>)`;
      diagnostic.className = 'flex items-center gap-2 text-label-code-sm font-label-code-sm text-secondary neu-micro px-3 py-1.5 rounded-lg self-start lg:self-auto';
    } else {
      diagnosticDot.className = 'inline-block w-2 h-2 rounded-full bg-rose-500';
      diagnosticText.innerHTML = `<span class="text-rose-600 font-semibold">${message}</span>`;
      diagnostic.className = 'flex items-center gap-2 text-label-code-sm font-label-code-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg self-start lg:self-auto';
    }
  }

  function setStatus(message) {
    statusElement.textContent = message;
    statusElement.hidden = !message;
  }

  function clearStatus() {
    statusElement.textContent = '';
    statusElement.hidden = true;
  }

  return {
    element: section,
    input,
    button,
    clearButton,
    exampleButtons,
    statusElement,
    setDiagnostic,
    setStatus,
    clearStatus
  };
}
