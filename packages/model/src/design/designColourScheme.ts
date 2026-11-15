import * as v from 'valibot';
import {siteFontStackSchema, siteHeroBackgroundSchema, siteHexColourSchema} from '../site/siteTextSchema';
import type {SiteTheme} from '../site/siteThemeSchema';

const chakraColour = v.strictObject({value: siteHexColourSchema});
const chakraFont = v.strictObject({value: siteFontStackSchema});
const chakraRadius = v.strictObject({value: v.pipe(v.string(), v.trim(), v.regex(/^(?:[0-9]|[1-2][0-9]|3[0-2])px$/))});

export const designColourTokensSchema = v.strictObject({
  uppercaseHeadings: v.boolean(),
  heroBackground: siteHeroBackgroundSchema,
  chakra: v.strictObject({
    theme: v.strictObject({
      tokens: v.strictObject({
        colors: v.strictObject({
          siteBackground: chakraColour,
          siteForeground: chakraColour,
          siteAccent: chakraColour,
          siteButtonForeground: chakraColour,
          siteCard: chakraColour,
        }),
        fonts: v.strictObject({
          siteHeading: chakraFont,
          siteBody: chakraFont,
        }),
        radii: v.strictObject({
          site: chakraRadius,
        }),
      }),
    }),
  }),
});

export interface DesignColourTokens extends v.InferOutput<typeof designColourTokensSchema> {}

export interface DesignColourScheme {
  id: string;
  name: string;
  tokens: DesignColourTokens;
}

export interface ChakraThemeConfig {
  theme: DesignColourTokens['chakra']['theme'];
}

export function chakraConfigFromColourScheme(tokens: DesignColourTokens): ChakraThemeConfig {
  return {theme: tokens.chakra.theme};
}

export function colourSchemeToSiteTheme(tokens: DesignColourTokens): SiteTheme {
  const {colors, fonts, radii} = tokens.chakra.theme.tokens;
  return {
    background: colors.siteBackground.value,
    foreground: colors.siteForeground.value,
    accent: colors.siteAccent.value,
    buttonForeground: colors.siteButtonForeground.value,
    cardBackground: colors.siteCard.value,
    headingFont: fonts.siteHeading.value,
    bodyFont: fonts.siteBody.value,
    uppercaseHeadings: tokens.uppercaseHeadings,
    heroBackground: tokens.heroBackground,
    radiusPx: Number.parseInt(radii.site.value, 10),
  };
}

export function siteThemeToColourTokens(theme: SiteTheme): DesignColourTokens {
  return {
    uppercaseHeadings: theme.uppercaseHeadings,
    heroBackground: theme.heroBackground,
    chakra: {
      theme: {
        tokens: {
          colors: {
            siteBackground: {value: theme.background},
            siteForeground: {value: theme.foreground},
            siteAccent: {value: theme.accent},
            siteButtonForeground: {value: theme.buttonForeground},
            siteCard: {value: theme.cardBackground},
          },
          fonts: {
            siteHeading: {value: theme.headingFont},
            siteBody: {value: theme.bodyFont},
          },
          radii: {
            site: {value: `${theme.radiusPx}px`},
          },
        },
      },
    },
  };
}
