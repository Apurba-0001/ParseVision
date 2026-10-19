/** Centralized visual tokens for AST nodes. */
export const NODE_STYLES = Object.freeze({
  BinaryExpression: Object.freeze({ fill: '#dbeafe', stroke: '#1d4ed8', text: '#172554' }),
  UnaryExpression: Object.freeze({ fill: '#fef3c7', stroke: '#b45309', text: '#78350f' }),
  Identifier: Object.freeze({ fill: '#dcfce7', stroke: '#15803d', text: '#14532d' }),
  Literal: Object.freeze({ fill: '#f3e8ff', stroke: '#7e22ce', text: '#581c87' })
});

export const NODE_DIMENSIONS = Object.freeze({
  height: 48,
  minWidth: 56,
  horizontalPadding: 18,
  cornerRadius: 10,
  levelGap: 96,
  siblingGap: 30,
  margin: 36
});
