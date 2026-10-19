export function createOutputPanel() {
  const section = document.createElement('section');
  section.className = 'panel output-panel';
  section.innerHTML = '<h2>AST output</h2><pre aria-live="polite">Generate an expression to inspect its AST.</pre><svg role="img"></svg>';
  return { element: section, json: section.querySelector('pre'), svg: section.querySelector('svg') };
}
