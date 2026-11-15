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
import type {DesignMolecule} from './designMolecule';
import type {DesignOrganism} from './designOrganism';

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

export const DESIGN_MOLECULE_SEED: readonly DesignMolecule[] = [
  {
    id: 'action-row',
    name: 'Action row',
    document: {
      pattern: 'tree',
      layout: {direction: 'row', gapPx: 12, align: 'center', valign: 'center', wrap: 'wrap'},
      children: [
        {id: 'book', kind: 'atom', atom: 'button', style: {background: '#111111', color: '#ffffff', radiusPx: 8}, slots: ['label', 'href']},
        {id: 'call', kind: 'atom', atom: 'iconButton', style: {background: '#111111', color: '#ffffff', radiusPx: 8}, slots: ['label', 'href', 'icon']},
        {id: 'photo', kind: 'atom', atom: 'imageButton', style: {radiusPx: 8}, slots: ['label', 'href', 'src', 'alt']},
      ],
    },
  },
  {
    id: 'grouped',
    name: 'Grouped',
    document: {
      pattern: 'combine',
      layout: {direction: 'column', gapPx: 8},
      children: [
        {id: 'intro', kind: 'atom', atom: 'text', style: {}, slots: ['text']},
        {id: 'actions', kind: 'molecule', moleculeId: 'action-row'},
      ],
    },
  },
];

export const DESIGN_ORGANISM_SEED: readonly DesignOrganism[] = [
  {
    id: 'header-bar',
    name: 'Header bar',
    category: 'header',
    document: {
      children: [
        {id: 'name', kind: 'atom', atom: 'text', style: {}, slots: ['text', 'role']},
        {id: 'actions', kind: 'molecule', moleculeId: 'action-row'},
      ],
    },
  },
  {
    id: 'page-band',
    name: 'Page band',
    category: 'page',
    document: {
      children: [
        {id: 'title', kind: 'atom', atom: 'text', style: {}, slots: ['text']},
        {id: 'body', kind: 'atom', atom: 'text', style: {}, slots: ['text']},
        {id: 'actions', kind: 'molecule', moleculeId: 'action-row'},
        {id: 'group', kind: 'molecule', moleculeId: 'grouped'},
      ],
    },
  },
  {
    id: 'footer-bar',
    name: 'Footer bar',
    category: 'footer',
    document: {
      children: [
        {id: 'line', kind: 'atom', atom: 'text', style: {}, slots: ['text']},
        {id: 'home', kind: 'atom', atom: 'link', style: {color: '#111111'}, slots: ['label', 'href']},
      ],
    },
  },
];
