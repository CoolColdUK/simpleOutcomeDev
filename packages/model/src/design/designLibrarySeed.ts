import {
  boldNailBarTheme,
  cleanStudioTheme,
  clinicTheme,
  coursesTheme,
  hairBeautyTheme,
  homeStudioTheme,
  neighbourhoodTheme,
  portfolioFirstTheme,
  reviewLedTheme,
  softLuxuryTheme,
} from '../site/siteThemes';
import {siteThemeToColourTokens, type DesignColourScheme} from './designColourScheme';

function scheme(id: string, name: string, theme: Parameters<typeof siteThemeToColourTokens>[0]): DesignColourScheme {
  return {id, name, tokens: siteThemeToColourTokens(theme)};
}

export const DESIGN_COLOUR_SCHEME_SEED: readonly DesignColourScheme[] = [
  scheme('clean-studio', 'Clean Studio', cleanStudioTheme),
  scheme('soft-luxury', 'Soft Luxury', softLuxuryTheme),
  scheme('portfolio-first', 'Portfolio First', portfolioFirstTheme),
  scheme('home-studio', 'Home Studio', homeStudioTheme),
  scheme('bold-nail-bar', 'Bold Nail Bar', boldNailBarTheme),
  scheme('clinic-professional', 'Clinic Professional', clinicTheme),
  scheme('hair-beauty-menu', 'Hair Beauty Menu', hairBeautyTheme),
  scheme('review-led', 'Review Led', reviewLedTheme),
  scheme('courses-treatments', 'Courses Treatments', coursesTheme),
  scheme('neighbourhood-salon', 'Neighbourhood Salon', neighbourhoodTheme),
];
