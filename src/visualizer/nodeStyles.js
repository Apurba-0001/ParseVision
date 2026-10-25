/** Centralized visual tokens for AST nodes adhering to design specifications. */
export const ROOT_NODE_STYLE = Object.freeze({
  fill: '#FEE2E2',
  border: '#DC2626',
  stroke: '#DC2626',
  text: '#991B1B',
  badgeBg: '#991B1B',
  badgeText: '#FFFFFF',
  label: 'Root Node'
});

export const NODE_STYLES = Object.freeze({
  Root: ROOT_NODE_STYLE,
  BinaryExpression: Object.freeze({
    fill: '#DBEAFE',
    border: '#2563EB',
    stroke: '#2563EB',
    text: '#1E40AF',
    badgeBg: '#1E40AF',
    badgeText: '#FFFFFF',
    label: 'BinaryExpression'
  }),
  UnaryExpression: Object.freeze({
    fill: '#FFEDD5',
    border: '#EA580C',
    stroke: '#EA580C',
    text: '#9A3412',
    badgeBg: '#9A3412',
    badgeText: '#FFFFFF',
    label: 'UnaryExpression'
  }),
  Identifier: Object.freeze({
    fill: '#D1FAE5',
    border: '#059669',
    stroke: '#059669',
    text: '#065F46',
    badgeBg: '#065F46',
    badgeText: '#FFFFFF',
    label: 'Identifier'
  }),
  Literal: Object.freeze({
    fill: '#F3E8FF',
    border: '#9333EA',
    stroke: '#9333EA',
    text: '#6B21A8',
    badgeBg: '#6B21A8',
    badgeText: '#FFFFFF',
    label: 'NumericLiteral'
  }),
  NumericLiteral: Object.freeze({
    fill: '#F3E8FF',
    border: '#9333EA',
    stroke: '#9333EA',
    text: '#6B21A8',
    badgeBg: '#6B21A8',
    badgeText: '#FFFFFF',
    label: 'NumericLiteral'
  })
});

export const TRAVERSAL_STYLES = Object.freeze({
  activeStroke: '#416FD0',
  activeStrokeWidth: 2.5,
  badgeFill: '#416FD0',
  badgeText: '#FFFFFF',
  visitedBadgeFill: '#68758A',
  visitedBadgeText: '#FFFFFF'
});

export const CONNECTOR_STYLE = Object.freeze({
  stroke: '#94A3B8',
  strokeWidth: 2,
  activeStroke: '#2156B5',
  activeStrokeWidth: 2.5
});

export const NODE_DIMENSIONS = Object.freeze({
  width: 64,
  height: 64,
  minWidth: 64,
  horizontalPadding: 8,
  cornerRadius: 12,
  levelGap: 126,
  siblingGap: 60,
  margin: 36,
  badgeRadius: 11,
  subtitleGap: 4,
  subtitleHeight: 20,
  totalHeight: 88
});

/**
 * Resolves the visual style tokens for an AST node type.
 * Enforces that root nodes always receive the prominent ROOT_NODE_STYLE (red),
 * while child nodes strictly derive their color from their AST node type.
 */
export function getNodeStyle(type, isRoot = false) {
  if (isRoot) return ROOT_NODE_STYLE;
  return NODE_STYLES[type] || NODE_STYLES.Literal;
}

/**
 * Returns canonical legend item descriptors synchronized with the active node style tokens.
 */
export function getLegendItems() {
  return [
    {
      type: 'Root',
      label: 'Root Node',
      fill: ROOT_NODE_STYLE.fill,
      border: ROOT_NODE_STYLE.border,
      text: ROOT_NODE_STYLE.text,
      fontBold: true,
      classNames: 'bg-[#FEE2E2] text-[#991B1B] border-[#DC2626] font-semibold'
    },
    {
      type: 'BinaryExpression',
      label: 'BinaryExpression',
      fill: NODE_STYLES.BinaryExpression.fill,
      border: NODE_STYLES.BinaryExpression.border,
      text: NODE_STYLES.BinaryExpression.text,
      classNames: 'bg-[#DBEAFE] text-[#1E40AF] border-[#2563EB]'
    },
    {
      type: 'UnaryExpression',
      label: 'UnaryExpression',
      fill: NODE_STYLES.UnaryExpression.fill,
      border: NODE_STYLES.UnaryExpression.border,
      text: NODE_STYLES.UnaryExpression.text,
      classNames: 'bg-[#FFEDD5] text-[#9A3412] border-[#EA580C]'
    },
    {
      type: 'Identifier',
      label: 'Identifier',
      fill: NODE_STYLES.Identifier.fill,
      border: NODE_STYLES.Identifier.border,
      text: NODE_STYLES.Identifier.text,
      classNames: 'bg-[#D1FAE5] text-[#065F46] border-[#059669]'
    },
    {
      type: 'NumericLiteral',
      label: 'NumericLiteral',
      fill: NODE_STYLES.NumericLiteral.fill,
      border: NODE_STYLES.NumericLiteral.border,
      text: NODE_STYLES.NumericLiteral.text,
      classNames: 'bg-[#F3E8FF] text-[#6B21A8] border-[#9333EA]'
    }
  ];
}


