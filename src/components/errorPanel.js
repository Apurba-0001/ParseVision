export function createErrorPanel() {
  const element = document.createElement('p');
  element.className = 'error-message'; element.setAttribute('role', 'alert'); element.hidden = true;
  return { element, show(message) { element.textContent = message; element.hidden = false; }, clear() { element.textContent = ''; element.hidden = true; } };
}
