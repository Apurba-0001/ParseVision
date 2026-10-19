/**
 * Component for displaying AST traversal results with educational explanations.
 */
export function createTraversalPanel() {
  const section = document.createElement('section');
  section.className = 'panel traversal-panel';
  section.setAttribute('aria-label', 'AST Traversal Explorer');

  section.innerHTML = `
    <h2>AST traversals</h2>
    <p class="traversal-intro">
      Traversals systematically visit every node in the syntax tree in a deterministic order. Compilers and interpreters use these orders for evaluation, code generation, and optimization.
    </p>

    <div class="traversal-guide">
      <h3 class="guide-title">Educational overview &amp; example: <code>a + b * 2</code></h3>
      <p>
        In the expression <code>a + b * 2</code>, the operator <code>+</code> is at the root because multiplication has higher precedence than addition. Its left subtree is <code>a</code> and its right subtree is <code>b * 2</code>:
      </p>
      <ul class="guide-list">
        <li><strong>Preorder (NLR):</strong> Visits the root <code>+</code> first, then walks the left child <code>a</code>, and finally the right subtree <code>*</code>, <code>b</code>, <code>2</code>.</li>
        <li><strong>Inorder (LNR):</strong> Visits the left child <code>a</code>, then root <code>+</code>, then walks the right subtree in infix order (<code>b</code>, <code>*</code>, <code>2</code>). <em>Note: Unary operators visit operator before operand because inorder is naturally defined for binary trees.</em></li>
        <li><strong>Postorder (LRN):</strong> Evaluates operands before operations: visits <code>a</code>, then <code>b</code>, <code>2</code>, <code>*</code>, and lastly root <code>+</code> (equivalent to Reverse Polish Notation).</li>
      </ul>
    </div>

    <div class="traversal-grid">
      <div class="traversal-card">
        <h3>Preorder</h3>
        <p class="traversal-rule"><strong>Order:</strong> Node → Left → Right</p>
        <pre class="traversal-output" data-order="preorder" aria-live="polite">Generate an expression to inspect preorder traversal.</pre>
      </div>

      <div class="traversal-card">
        <h3>Inorder</h3>
        <p class="traversal-rule"><strong>Order:</strong> Left → Node → Right</p>
        <p class="traversal-note">Unary convention: operator before operand.</p>
        <pre class="traversal-output" data-order="inorder" aria-live="polite">Generate an expression to inspect inorder traversal.</pre>
      </div>

      <div class="traversal-card">
        <h3>Postorder</h3>
        <p class="traversal-rule"><strong>Order:</strong> Left → Right → Node</p>
        <p class="traversal-note">Unary convention: operand before operator.</p>
        <pre class="traversal-output" data-order="postorder" aria-live="polite">Generate an expression to inspect postorder traversal.</pre>
      </div>
    </div>

    <p class="traversal-error error-message" role="alert" hidden></p>
  `;

  const preorderOutput = section.querySelector('[data-order="preorder"]');
  const inorderOutput = section.querySelector('[data-order="inorder"]');
  const postorderOutput = section.querySelector('[data-order="postorder"]');
  const errorElement = section.querySelector('.traversal-error');

  function formatList(items) {
    if (!items || items.length === 0) return 'No nodes visited.';
    return items.join('\n');
  }

  return {
    element: section,
    preorderOutput,
    inorderOutput,
    postorderOutput,
    errorElement,
    update({ preorder = [], inorder = [], postorder = [] }) {
      preorderOutput.textContent = formatList(preorder);
      inorderOutput.textContent = formatList(inorder);
      postorderOutput.textContent = formatList(postorder);
      errorElement.hidden = true;
      errorElement.textContent = '';
    },
    clear(message = 'Generate an expression to inspect its AST traversals.') {
      preorderOutput.textContent = message;
      inorderOutput.textContent = message;
      postorderOutput.textContent = message;
      errorElement.hidden = true;
      errorElement.textContent = '';
    },
    showError(message) {
      errorElement.textContent = message;
      errorElement.hidden = false;
    }
  };
}
