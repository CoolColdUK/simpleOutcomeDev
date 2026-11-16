import * as v from 'valibot';
import {siteHexColourSchema} from '../site/siteTextSchema';

export const DESIGN_THEME_COLOURS = ['siteBackground', 'siteForeground', 'siteAccent', 'siteButtonForeground', 'siteCard', 'hero'] as const;

export type DesignThemeColour = (typeof DESIGN_THEME_COLOURS)[number];

export const designColourValueSchema = v.union([siteHexColourSchema, v.picklist(DESIGN_THEME_COLOURS)]);

export type DesignColourValue = v.InferOutput<typeof designColourValueSchema>;
