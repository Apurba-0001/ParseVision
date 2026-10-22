/**
 * Component for accessible, human-readable error reporting with zero-based source offsets.
 */
export function createErrorPanel() {
  const element = document.createElement('div');
  element.className = 'error-message';
  element.setAttribute('role', 'alert');
  element.setAttribute('aria-live', 'assertive');
  element.hidden = true;

  element.innerHTML = `
    <div class="error-content">
      <svg class="error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span class="error-text"></span>
    </div>
  `;

  const textElement = element.querySelector('.error-text');

  return {
    element,
    show(errorOrMessage) {
      let message = 'An error occurred while processing the expression.';
      if (typeof errorOrMessage === 'string') {
        message = errorOrMessage;
      } else if (errorOrMessage && typeof errorOrMessage === 'object') {
        message = errorOrMessage.message || message;
      }
      textElement.textContent = message;
      element.hidden = false;
    },
    clear() {
      textElement.textContent = '';
      element.hidden = true;
    }
  };
}
