const childNodes = (node) => node.type === 'BinaryExpression' ? [node.left, node.right] : node.type === 'UnaryExpression' ? [node.argument] : [];

export function preorder(node) {
  if (!node) return [];
  return [node, ...childNodes(node).flatMap(preorder)];
}

export function postorder(node) {
  if (!node) return [];
  return [...childNodes(node).flatMap(postorder), node];
}

export function inorder(node) {
  if (!node) return [];
  if (node.type === 'BinaryExpression') return [...inorder(node.left), node, ...inorder(node.right)];
  if (node.type === 'UnaryExpression') return [node, ...inorder(node.argument)];
  return [node];
}
