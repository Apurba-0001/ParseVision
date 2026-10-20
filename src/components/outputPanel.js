/**
 * Output panel containing SVG tree visualization and formatted AST JSON representation.
 */
export function createOutputPanel() {
  const section = document.createElement('section');
  section.className = 'panel output-panel';
  section.innerHTML = `
    <div class="visualization-panel-header">
      <h2>AST visualization</h2>
      <div class="tree-legend" role="group" aria-label="AST node color legend">
        <span class="legend-item legend-binary"><span class="legend-swatch"></span>Binary</span>
        <span class="legend-item legend-unary"><span class="legend-swatch"></span>Unary</span>
        <span class="legend-item legend-identifier"><span class="legend-swatch"></span>Identifier</span>
        <span class="legend-item legend-literal"><span class="legend-swatch"></span>Literal</span>
      </div>
    </div>
    <div class="visualization-scroll" tabindex="0" role="region" aria-label="AST Tree Viewport">
      <svg role="img" aria-label="AST visualization area"></svg>
    </div>

    <div class="json-panel-header">
      <h2>AST JSON</h2>
    </div>
    <pre aria-live="polite">Enter an expression, then select Generate AST.</pre>
  `;

  return {
    element: section,
    json: section.querySelector('pre'),
    svg: section.querySelector('svg')
  };
}
