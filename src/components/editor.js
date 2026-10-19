export function createEditor(initialValue = 'a + b * 2') {
  const section = document.createElement('section');
  section.className = 'panel editor-panel';
  section.innerHTML = `<label for="expression">Expression</label><textarea id="expression" spellcheck="false" aria-describedby="expression-help"></textarea><p id="expression-help">Try numbers, identifiers, parentheses, and + − × ÷ operators.</p><button type="button">Generate AST</button>`;
  section.querySelector('textarea').value = initialValue;
  return { element: section, input: section.querySelector('textarea'), button: section.querySelector('button') };
}
