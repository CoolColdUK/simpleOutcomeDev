import * as v from 'valibot';

export const SITE_PRESET_IDS = [
  'clean-studio',
  'soft-luxury',
  'portfolio-first',
  'home-studio',
  'bold-nail-bar',
  'clinic-professional',
  'hair-beauty-menu',
  'review-led',
  'courses-treatments',
  'neighbourhood-salon',
] as const;

export type SitePresetId = (typeof SITE_PRESET_IDS)[number];

export const sitePresetIdSchema = v.picklist(SITE_PRESET_IDS);
