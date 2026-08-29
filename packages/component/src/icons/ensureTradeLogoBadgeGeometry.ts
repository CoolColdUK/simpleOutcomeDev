/** Production badge background — aligned with `packages/web/public/favicon.svg`. */
export const ensureTradeLogoBadgeBackgroundProd = '#0f172a';

export const ensureTradeLogoBadgeForeground = '#22c55e';

export const ensureTradeLogoBadgeViewBoxSize = 32;

export const ensureTradeLogoBadgeCornerRadius = 8;

export interface EnsureTradeLogoBadgeRect {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
}

/** Filled rects for the ET monogram in a 32×32 viewBox (matches favicon). */
export const ensureTradeLogoBadgeRects: readonly EnsureTradeLogoBadgeRect[] = [
  {x: 5, y: 9, width: 2.25, height: 14, rx: 0.45},
  {x: 5, y: 9, width: 8, height: 2.25, rx: 0.45},
  {x: 5, y: 14.875, width: 5.5, height: 2.25, rx: 0.45},
  {x: 5, y: 20.75, width: 8, height: 2.25, rx: 0.45},
  {x: 16.5, y: 9, width: 10.5, height: 2.25, rx: 0.45},
  {x: 20.25, y: 11.25, width: 2.25, height: 11.75, rx: 0.45},
];
