import type {DesignColourTokens, DesignContainer, DesignFlex} from '@so/model';
import type {CSSProperties} from 'react';

export function designPreviewStyle(tokens: DesignColourTokens): CSSProperties {
  const {colors, fonts, radii} = tokens.chakra.theme.tokens;
  return {
    '--chakra-colors-siteBackground': colors.siteBackground.value,
    '--chakra-colors-siteForeground': colors.siteForeground.value,
    '--chakra-colors-siteAccent': colors.siteAccent.value,
    '--chakra-colors-siteButtonForeground': colors.siteButtonForeground.value,
    '--chakra-colors-siteCard': colors.siteCard.value,
    '--chakra-fonts-siteHeading': fonts.siteHeading.value,
    '--chakra-fonts-siteBody': fonts.siteBody.value,
    '--chakra-radii-site': radii.site.value,
  } as CSSProperties;
}

export function designFlexStyle(layout: DesignFlex | undefined): CSSProperties {
  if (layout === undefined) {
    return {};
  }
  const direction = layout.direction ?? 'row';
  const horizontal = layout.align === undefined ? undefined : flexAlign(layout.align);
  const vertical = layout.valign === undefined ? undefined : flexAlign(layout.valign);
  return {
    display: 'flex',
    flexDirection: layout.direction,
    gap: layout.gapPx,
    flexWrap: layout.wrap,
    justifyContent: direction === 'column' ? vertical : horizontal,
    alignItems: direction === 'column' ? horizontal : vertical,
  };
}

export function designContainerStyle(container: DesignContainer | undefined): CSSProperties {
  if (container === undefined) {
    return {};
  }
  return {
    width: px(container.widthPx),
    height: px(container.heightPx),
    minWidth: px(container.minWidthPx),
    minHeight: px(container.minHeightPx),
    maxWidth: px(container.maxWidthPx),
    maxHeight: px(container.maxHeightPx),
    padding: px(container.paddingPx),
    background: container.background,
    borderRadius: px(container.radiusPx),
    borderStyle: container.borderWidthPx === undefined ? undefined : 'solid',
    borderWidth: px(container.borderWidthPx),
    borderColor: container.borderColor,
    boxSizing: 'border-box',
  };
}

function px(value: number | undefined): string | undefined {
  return value === undefined ? undefined : `${value}px`;
}

function flexAlign(value: 'start' | 'center' | 'end' | 'stretch'): CSSProperties['justifyContent'] {
  if (value === 'start') {
    return 'flex-start';
  }
  if (value === 'end') {
    return 'flex-end';
  }
  return value;
}
