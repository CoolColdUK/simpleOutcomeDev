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
    id: 'accordion',
    name: 'Accordion',
    document: {
      pattern: 'accordion',
      items: [
        {
          id: 'downtime',
          title: 'Is there any downtime?',
          body: 'It depends on the treatment. You leave with written aftercare either way.',
        },
        {
          id: 'results',
          title: 'How long do results last?',
          body: 'Your consultation covers what to expect before anything is booked.',
        },
      ],
    },
  },
  {
    id: 'action-row',
    name: 'Action row',
    document: {
      pattern: 'tree',
      children: [
        {
          id: 'row',
          kind: 'stack',
          direction: 'row',
          gapPx: 12,
          children: [
            {
              id: 'book',
              kind: 'atom',
              atom: 'button',
              props: {label: 'Book now', href: 'https://www.fresha.com/', background: '#111111', color: '#ffffff'},
            },
            {
              id: 'call',
              kind: 'atom',
              atom: 'iconButton',
              props: {label: 'Call', href: 'https://www.fresha.com/', icon: 'phone', background: '#111111', color: '#ffffff'},
            },
            {
              id: 'photo',
              kind: 'atom',
              atom: 'imageButton',
              props: {label: 'See work', href: 'https://www.fresha.com/', src: 'https://simpleoutcome.dev/', alt: 'Work'},
            },
            {id: 'open', kind: 'atom', atom: 'switch', props: {label: 'Open today', checked: true}},
          ],
        },
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
        {id: 'name', kind: 'atom', atom: 'text', props: {text: 'Business name', role: 'heading'}},
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
        {id: 'title', kind: 'atom', atom: 'text', props: {text: 'Section title', role: 'heading'}},
        {id: 'body', kind: 'atom', atom: 'text', props: {text: 'Supporting copy for this band.', role: 'body'}},
        {id: 'actions', kind: 'molecule', moleculeId: 'action-row'},
        {id: 'questions', kind: 'molecule', moleculeId: 'accordion'},
      ],
    },
  },
  {
    id: 'footer-bar',
    name: 'Footer bar',
    category: 'footer',
    document: {
      children: [
        {id: 'line', kind: 'atom', atom: 'text', props: {text: 'Footer', role: 'body'}},
        {id: 'home', kind: 'atom', atom: 'link', props: {label: 'Back to top', href: 'https://simpleoutcome.dev/', color: '#111111'}},
      ],
    },
  },
];
