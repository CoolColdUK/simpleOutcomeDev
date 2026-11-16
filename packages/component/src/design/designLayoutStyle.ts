import {DESIGN_THEME_COLOURS, type DesignColourTokens, type DesignContainer, type DesignFlex} from '@so/model';
import type {CSSProperties} from 'react';

const THEME_COLOUR_VAR: Record<(typeof DESIGN_THEME_COLOURS)[number], string> = {
  siteBackground: 'var(--chakra-colors-siteBackground)',
  siteForeground: 'var(--chakra-colors-siteForeground)',
  siteAccent: 'var(--chakra-colors-siteAccent)',
  siteButtonForeground: 'var(--chakra-colors-siteButtonForeground)',
  siteCard: 'var(--chakra-colors-siteCard)',
  hero: 'var(--site-hero-background)',
};

export function designColourCss(value: string | number | boolean | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const token = DESIGN_THEME_COLOURS.find((colour) => colour === value);
  return token === undefined ? value : THEME_COLOUR_VAR[token];
}

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
    '--site-hero-background': tokens.heroBackground === 'none' ? colors.siteBackground.value : tokens.heroBackground,
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
    margin: px(container.marginPx),
    background: designColourCss(container.background),
    borderRadius: px(container.radiusPx),
    borderStyle: container.borderWidthPx === undefined ? undefined : 'solid',
    borderWidth: px(container.borderWidthPx),
    borderColor: designColourCss(container.borderColor),
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
