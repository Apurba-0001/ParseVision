import { createTraversalExplorer } from './traversalExplorer.js';

/**
 * Backward-compatible wrapper providing createTraversalPanel interface
 * backed by the interactive Traversal Explorer.
 */
export function createTraversalPanel(options = {}) {
  return createTraversalExplorer(options);
}

export { createTraversalExplorer };
