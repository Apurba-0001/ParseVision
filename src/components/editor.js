export function createEditor(initialValue = 'a + b * 2') {
  const section = document.createElement('section');
  section.className = 'panel editor-panel';
  section.innerHTML = `<label for="expression">Expression</label><textarea id="expression" spellcheck="false" aria-describedby="expression-help"></textarea><p id="expression-help">Try numbers, identifiers, parentheses, and + − × ÷ operators.</p><div class="editor-actions"><button type="button">Generate AST</button><button class="button-secondary" type="button">Clear</button></div>`;
  section.querySelector('textarea').value = initialValue;
  const [button, clearButton] = section.querySelectorAll('button');
  return { element: section, input: section.querySelector('textarea'), button, clearButton };
}
