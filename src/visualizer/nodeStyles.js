/** Centralized visual tokens for AST nodes adhering to Stitch code.html & DESIGN.md. */
export const NODE_STYLES = Object.freeze({
  BinaryExpression: Object.freeze({
    fill: '#DCE7FF',
    stroke: '#B4C6FC',
    text: '#1D4ED8',
    badgeBg: '#1D4ED8',
    badgeText: '#FFFFFF',
    border: '#B4C6FC',
    label: 'BinaryExpression'
  }),
  UnaryExpression: Object.freeze({
    fill: '#FCE8C8',
    stroke: '#F5D099',
    text: '#B45309',
    badgeBg: '#B45309',
    badgeText: '#FFFFFF',
    border: '#F5D099',
    label: 'UnaryExpression'
  }),
  Identifier: Object.freeze({
    fill: '#D9F2E4',
    stroke: '#B3E5C8',
    text: '#047857',
    badgeBg: '#047857',
    badgeText: '#FFFFFF',
    border: '#B3E5C8',
    label: 'Identifier'
  }),
  Literal: Object.freeze({
    fill: '#EDE0FF',
    stroke: '#D5BFFC',
    text: '#6D28D9',
    badgeBg: '#6D28D9',
    badgeText: '#FFFFFF',
    border: '#D5BFFC',
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

export const NODE_DIMENSIONS = Object.freeze({
  width: 64,
  height: 64,
  minWidth: 64,
  horizontalPadding: 8,
  cornerRadius: 12,
  levelGap: 126,
  siblingGap: 48,
  margin: 36,
  badgeRadius: 11
});

