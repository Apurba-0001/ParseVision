export function createOutputPanel() {
  const section = document.createElement('section');
  section.className = 'panel output-panel';
  section.innerHTML = '<h2>AST output</h2><pre aria-live="polite">Generate an expression to inspect its AST.</pre><div class="visualization-scroll"><svg role="img" aria-label="AST visualization area"></svg></div>';
  return { element: section, json: section.querySelector('pre'), svg: section.querySelector('svg') };
}
