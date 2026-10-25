export const PRESET_EXPRESSIONS = [
  'a + b * 2',
  '(x + y) * (a - b)',
  '-x * (y + 4)',
  'a - b - c + d',
  '(a + b) * (c - d) / 2'
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
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
      <!-- Inset Monospace Expression Input Form -->
      <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0">
        <div class="flex-1 flex items-center neu-recessed rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary-container transition-all min-w-0">
          <span class="material-symbols-outlined text-secondary text-base select-none mr-2 flex-shrink-0">function</span>
          <input class="w-full bg-transparent border-none p-0 text-label-code-lg font-label-code-lg text-on-surface focus:outline-none focus:ring-0 placeholder-secondary tracking-wide font-mono" id="expression-input" placeholder="Enter arithmetic expression..." type="text" value="${initialValue}" aria-label="Arithmetic expression"/>
          <button class="text-secondary hover:text-error transition-colors p-0.5 rounded cursor-pointer flex-shrink-0" id="clear-input-btn" type="button" title="Clear expression text" aria-label="Clear expression text">
            <span class="material-symbols-outlined text-base">cancel</span>
          </button>
        </div>
        <!-- Direct Execution Buttons -->
        <div class="flex items-center gap-2 flex-shrink-0 justify-end sm:justify-start">
          <button class="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg text-label-code-md font-label-code-md text-on-primary neu-button-primary transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap" id="btn-generate-ast" type="button" title="Generate AST from expression (Ctrl+Enter)" aria-label="Generate AST">
            <span class="material-symbols-outlined text-base">auto_awesome</span>
            <span>Generate AST</span>
          </button>
          <button class="px-3.5 py-2 rounded-lg text-label-code-md font-label-code-md neu-micro text-secondary hover:text-primary transition-all duration-150 active:scale-95 cursor-pointer whitespace-nowrap" id="btn-clear-expr" type="button" title="Reset editor and tree visualization" aria-label="Reset editor and visualization">
            Reset
          </button>
        </div>
      </div>
      <!-- Parser Diagnostic / Telemetry -->
      <div class="flex items-center gap-2 text-label-code-sm font-label-code-sm text-secondary neu-micro px-3 py-1.5 rounded-lg self-start lg:self-auto flex-shrink-0 max-w-full" id="parser-diagnostic" role="status" aria-live="polite">
        <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" id="parser-status-dot"></span>
        <span id="parser-status-text" class="truncate max-w-full">Valid arithmetic expression (parsed in <strong>1.2ms</strong>)</span>
      </div>
    </div>
    <!-- Preset Example Chips -->
    <div class="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#E3E7F0]">
      <span class="text-body-sm font-body-sm text-secondary mr-1 select-none flex-shrink-0">Presets:</span>
      <div id="preset-chips-container" class="flex flex-wrap items-center gap-1.5 flex-1 min-w-0"></div>
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
      chip.className = 'preset-btn px-2.5 py-1 rounded text-label-code-sm font-label-code-sm neu-micro-pressed text-primary font-semibold border border-primary-container bg-surface-container cursor-pointer whitespace-nowrap select-none';
    } else {
      chip.className = 'preset-btn px-2.5 py-1 rounded text-label-code-sm font-label-code-sm neu-micro text-on-surface-variant hover:text-primary transition-all cursor-pointer whitespace-nowrap select-none';
    }
    chip.textContent = expr;
    chip.title = `Load preset: ${expr}`;
    chip.setAttribute('aria-label', `Load expression: ${expr}`);
    chip.addEventListener('click', () => {
      // Update active preset styling
      section.querySelectorAll('.preset-btn').forEach((btn) => {
        btn.className = 'preset-btn px-2.5 py-1 rounded text-label-code-sm font-label-code-sm neu-micro text-on-surface-variant hover:text-primary transition-all cursor-pointer whitespace-nowrap select-none';
      });
      chip.className = 'preset-btn px-2.5 py-1 rounded text-label-code-sm font-label-code-sm neu-micro-pressed text-primary font-semibold border border-primary-container bg-surface-container cursor-pointer whitespace-nowrap select-none';

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
      diagnosticDot.className = 'inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0';
      diagnosticText.innerHTML = message
        ? `<span>${message}</span>`
        : `Valid arithmetic expression (parsed in <strong>${parseTimeMs}ms</strong>)`;
      diagnostic.className = 'flex items-center gap-2 text-label-code-sm font-label-code-sm text-secondary neu-micro px-3 py-1.5 rounded-lg self-start lg:self-auto flex-shrink-0 max-w-full';
      diagnostic.setAttribute('role', 'status');
      diagnostic.setAttribute('aria-live', 'polite');
    } else {
      diagnosticDot.className = 'inline-block w-2 h-2 rounded-full bg-rose-500 flex-shrink-0';
      diagnosticText.innerHTML = `<span class="text-rose-600 font-semibold">${message}</span>`;
      diagnostic.className = 'flex items-center gap-2 text-label-code-sm font-label-code-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg self-start lg:self-auto flex-shrink-0 max-w-full';
      diagnostic.setAttribute('role', 'alert');
      diagnostic.setAttribute('aria-live', 'assertive');
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
