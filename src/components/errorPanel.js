/**
 * Component for accessible, clear error reporting.
 */
export function createErrorPanel() {
  const element = document.createElement('div');
  element.className = 'error-message';
  element.setAttribute('role', 'alert');
  element.setAttribute('aria-live', 'assertive');
  element.hidden = true;

  return {
    element,
    show(errorOrMessage) {
      let message = 'An error occurred while processing the expression.';
      if (typeof errorOrMessage === 'string') {
        message = errorOrMessage;
      } else if (errorOrMessage && typeof errorOrMessage === 'object') {
        message = errorOrMessage.message || message;
      }
      element.textContent = message;
      element.hidden = false;
    },
    clear() {
      element.textContent = '';
      element.hidden = true;
    }
  };
}
