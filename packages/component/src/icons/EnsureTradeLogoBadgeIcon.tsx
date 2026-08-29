import {
  ensureTradeLogoBadgeBackgroundProd,
  ensureTradeLogoBadgeCornerRadius,
  ensureTradeLogoBadgeForeground,
  ensureTradeLogoBadgeRects,
  ensureTradeLogoBadgeViewBoxSize,
} from './ensureTradeLogoBadgeGeometry';
import type {IconProps} from './IconProps';

export interface EnsureTradeLogoBadgeIconProps extends IconProps {
  /** Badge square background (default production slate). */
  background?: string;
  /** ET letter fill (default brand green). */
  foreground?: string;
}

/**
 * Square ET badge (geometry matches `packages/web/public/favicon.svg`).
 */
export function EnsureTradeLogoBadgeIcon({
  size = 24,
  background = ensureTradeLogoBadgeBackgroundProd,
  foreground = ensureTradeLogoBadgeForeground,
}: EnsureTradeLogoBadgeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${ensureTradeLogoBadgeViewBoxSize} ${ensureTradeLogoBadgeViewBoxSize}`}
      fill="none"
      role="img"
      aria-hidden
    >
      <rect
        width={ensureTradeLogoBadgeViewBoxSize}
        height={ensureTradeLogoBadgeViewBoxSize}
        rx={ensureTradeLogoBadgeCornerRadius}
        fill={background}
      />
      <g fill={foreground}>
        {ensureTradeLogoBadgeRects.map((rect) => (
          <rect
            key={`${rect.x}-${rect.y}-${rect.width}-${rect.height}`}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            rx={rect.rx}
          />
        ))}
      </g>
    </svg>
  );
}
