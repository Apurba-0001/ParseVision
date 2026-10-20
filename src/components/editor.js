export const EXAMPLE_EXPRESSIONS = [
  'a + b * 2',
  '(a + b) * 2',
  '10 - 4 - 2',
  '-(a + 3) * 2',
  'total / count + 5'
];

/**
 * Expression editor component with action buttons, status feedback,
 * and selectable example expressions.
 */
export function createEditor(options = 'a + b * 2') {
  const initialValue = typeof options === 'string' ? options : (options?.initialValue ?? 'a + b * 2');
  const onSelectExample = typeof options === 'object' && typeof options?.onSelectExample === 'function'
    ? options.onSelectExample
    : null;
  const examples = typeof options === 'object' && Array.isArray(options?.examples)
    ? options.examples
    : EXAMPLE_EXPRESSIONS;

  const section = document.createElement('section');
  section.className = 'panel editor-panel';
  section.innerHTML = `
    <label for="expression">Expression</label>
    <textarea id="expression" spellcheck="false" aria-describedby="expression-help" placeholder="e.g. a + b * 2"></textarea>
    <p id="expression-help">Try numbers, identifiers, parentheses, and +, -, *, / operators.</p>
    <div class="editor-actions">
      <button type="button" class="button-primary">Generate AST</button>
      <button type="button" class="button-secondary">Clear</button>
    </div>
    <div class="status-message" role="status" aria-live="polite" hidden></div>
    <div class="examples-container">
      <span class="examples-label" id="examples-heading">Examples:</span>
      <div class="example-chips" role="group" aria-labelledby="examples-heading"></div>
    </div>
  `;

  const input = section.querySelector('textarea');
  input.value = initialValue;

  const [button, clearButton] = section.querySelectorAll('.editor-actions button');
  const statusElement = section.querySelector('.status-message');
  const chipsContainer = section.querySelector('.example-chips');
  const exampleButtons = [];

  for (const expr of examples) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'example-btn';
    chip.textContent = expr;
    chip.setAttribute('aria-label', `Load example: ${expr}`);
    chip.addEventListener('click', () => {
      input.value = expr;
      input.focus();
      if (onSelectExample) {
        onSelectExample(expr);
      }
    });
    chipsContainer.append(chip);
    exampleButtons.push(chip);
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
    setStatus,
    clearStatus
  };
}
