import type {SiteDocument} from './siteDocumentSchema';
import type {SitePresetId} from './sitePresetId';
import {sampleBooking, sampleFooter, sampleReviews, sampleServices} from './siteSampleCopy';
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
} from './siteThemes';

const photo = (label: string, background: string) => ({label, background});

const cleanStudio: SiteDocument = {
  schemaVersion: 1,
  businessName: 'Lumen Nail Studio',
  theme: cleanStudioTheme,
  booking: {...sampleBooking, label: 'Book now'},
  nav: {links: [{label: 'Prices', sectionId: 'prices'}]},
  sections: [
    {
      id: 'hero',
      type: 'hero',
      props: {
        layout: 'split',
        tone: 'theme',
        eyebrow: 'Southampton',
        title: 'Simple, beautiful nails in Southampton',
        body: 'Gel, BIAB and nail art in a calm studio. See prices and book online in under a minute.',
        primaryCta: {label: 'Book now', target: 'booking'},
        secondaryCta: {label: 'View prices', target: 'prices'},
        media: photo('Hero photo', 'linear-gradient(135deg,#f3f3f3,#dcdcdc)'),
      },
    },
    {
      id: 'prices',
      type: 'services',
      props: {title: 'Prices', presentation: 'rows', items: [...sampleServices]},
    },
  ],
  footer: {text: sampleFooter('Lumen Nail Studio')},
};

const softLuxury: SiteDocument = {
  schemaVersion: 1,
  businessName: 'Maison Rose Beauty',
  theme: softLuxuryTheme,
  booking: {...sampleBooking, label: 'Book your treatment'},
  nav: {
    links: [
      {label: 'About', sectionId: 'about'},
      {label: 'Treatments', sectionId: 'treatments'},
    ],
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      props: {
        layout: 'center',
        tone: 'theme',
        eyebrow: 'Beauty · Southampton',
        title: 'Considered treatments, beautifully done',
        body: 'A quiet space for facials, lashes and brows, with time taken over every appointment.',
        primaryCta: {label: 'Book your treatment', target: 'booking'},
      },
    },
    {
      id: 'about',
      type: 'about',
      props: {
        eyebrow: 'Meet the owner',
        title: "Hello, I'm Sophie",
        body: 'Ten years in beauty, fully insured and trained in advanced skin treatments. Every visit starts with a proper chat about what you want.',
        media: photo('Owner portrait', 'linear-gradient(135deg,#ead0c6,#f7e9e3)'),
      },
    },
    {
      id: 'treatments',
      type: 'services',
      props: {title: 'Treatments', presentation: 'rows', items: [...sampleServices]},
    },
  ],
  footer: {text: sampleFooter('Maison Rose Beauty')},
};

const portfolioFirst: SiteDocument = {
  schemaVersion: 1,
  businessName: 'Polished by Ava',
  theme: portfolioFirstTheme,
  booking: {...sampleBooking, label: 'Book on Fresha'},
  nav: {
    links: [
      {label: 'Gallery', sectionId: 'gallery'},
      {label: 'Book', sectionId: 'book'},
    ],
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      props: {
        layout: 'statement',
        tone: 'theme',
        eyebrow: 'Latest work',
        title: 'Nail art, made to be noticed',
      },
    },
    {
      id: 'gallery',
      type: 'gallery',
      props: {
        items: [0, 1, 2, 3, 4, 5].map((index) =>
          photo('Nail art', index % 2 === 0 ? 'linear-gradient(135deg,#e8c547,#ff6b6b)' : 'linear-gradient(135deg,#ff6b6b,#e8c547)'),
        ),
      },
    },
    {
      id: 'book',
      type: 'bookingCta',
      props: {
        title: 'Like what you see?',
        body: 'Freehand art, chrome, French and full sets. Book straight into my diary.',
      },
    },
  ],
  footer: {text: sampleFooter('Polished by Ava')},
};

const homeStudio: SiteDocument = {
  schemaVersion: 1,
  businessName: 'The Garden Room Beauty',
  theme: homeStudioTheme,
  booking: sampleBooking,
  nav: {
    links: [
      {label: 'The studio', sectionId: 'highlights'},
      {label: 'Prices', sectionId: 'prices'},
    ],
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      props: {
        layout: 'split',
        tone: 'theme',
        eyebrow: 'Home beauty studio · Southampton',
        title: 'A calm, friendly beauty room close to home',
        body: "Hi, I'm Georgia. I run a private studio from my garden room, so you get one-to-one time, no rush and free parking outside.",
        primaryCta: {label: 'Book now', target: 'booking'},
        secondaryCta: {label: 'The studio', target: 'highlights'},
        media: photo('Studio photo', 'linear-gradient(135deg,#dfe3cf,#c7cfb0)'),
      },
    },
    {
      id: 'highlights',
      type: 'highlights',
      props: {
        items: [
          {title: 'Private and calm', body: 'Just you and me, never a busy salon.'},
          {title: 'Easy parking', body: 'Free on-street parking right outside.'},
          {title: 'Book any time', body: 'Live availability, day or night.'},
        ],
      },
    },
    {
      id: 'prices',
      type: 'services',
      props: {title: 'Treatments and prices', presentation: 'rows', items: [...sampleServices]},
    },
  ],
  footer: {text: sampleFooter('The Garden Room Beauty')},
};

const boldNailBar: SiteDocument = {
  schemaVersion: 1,
  businessName: 'CANDY CLAW',
  theme: boldNailBarTheme,
  booking: {...sampleBooking, label: 'Book your set'},
  nav: {
    links: [
      {label: 'Prices', sectionId: 'prices'},
      {label: 'Gallery', sectionId: 'gallery'},
    ],
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      props: {
        layout: 'band',
        tone: 'light',
        title: 'Bright nails. Big energy.',
        body: 'Chrome, jelly, 3D art and full sets. Walk-ins welcome.',
        primaryCta: {label: 'Book your set', target: 'booking'},
      },
    },
    {
      id: 'prices',
      type: 'services',
      props: {title: 'Sets', presentation: 'cards', items: [...sampleServices]},
    },
    {
      id: 'gallery',
      type: 'gallery',
      props: {
        items: [0, 1, 2, 3].map((index) => photo('Gallery', `linear-gradient(135deg,#ff2d8a,#${index % 2 === 0 ? 'fff0f7' : '7b2dff'})`)),
      },
    },
  ],
  footer: {text: sampleFooter('CANDY CLAW')},
};

const clinic: SiteDocument = {
  schemaVersion: 1,
  businessName: 'Clearline Aesthetics',
  theme: clinicTheme,
  booking: {...sampleBooking, label: 'Book a consultation'},
  nav: {
    links: [
      {label: 'Care', sectionId: 'care'},
      {label: 'Questions', sectionId: 'questions'},
    ],
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      props: {
        layout: 'split',
        tone: 'theme',
        eyebrow: 'Medical-grade aesthetics',
        title: 'Qualified, consultation-led aesthetic care',
        body: 'Every treatment starts with a free consultation. Fully insured practitioner with accredited training.',
        primaryCta: {label: 'Book a consultation', target: 'booking'},
        secondaryCta: {label: 'Treatments', target: 'care'},
        media: photo('Clinic photo', 'linear-gradient(135deg,#d6e9ec,#b7d6dc)'),
      },
    },
    {
      id: 'care',
      type: 'highlights',
      props: {
        items: [
          {title: 'Qualified', body: 'Accredited, insured practitioner.'},
          {title: 'Consultation first', body: 'No treatment without a full chat.'},
          {title: 'Aftercare', body: 'Written aftercare and follow-up.'},
          {title: 'Clear pricing', body: 'No hidden extras.'},
        ],
      },
    },
    {
      id: 'questions',
      type: 'faq',
      props: {
        title: 'Frequently asked questions',
        items: [
          {question: 'Is there any downtime?', answer: 'It depends on the treatment. You leave with written aftercare either way.'},
          {question: 'How long do results last?', answer: 'Your consultation covers what to expect before anything is booked.'},
          {question: 'Do I need a patch test?', answer: 'Yes when the treatment needs one. We will say so before the appointment.'},
        ],
      },
    },
  ],
  footer: {text: sampleFooter('Clearline Aesthetics')},
};

const hairBeauty: SiteDocument = {
  schemaVersion: 1,
  businessName: 'Halo Hair & Beauty',
  theme: hairBeautyTheme,
  booking: {...sampleBooking, label: 'Book an appointment'},
  nav: {
    links: [
      {label: 'Menu', sectionId: 'menu'},
      {label: 'Team', sectionId: 'team'},
    ],
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      props: {
        layout: 'band',
        tone: 'theme',
        eyebrow: 'Hair · Nails · Lashes · Brows',
        title: 'Hair, nails, lashes and brows under one roof',
        primaryCta: {label: 'Book an appointment', target: 'booking'},
      },
    },
    {
      id: 'menu',
      type: 'services',
      props: {
        title: 'Our menu',
        presentation: 'grouped',
        groups: [
          {
            label: 'Hair',
            items: [
              {name: 'Cut & blow dry', detail: '60 min', price: '£45'},
              {name: 'Full head colour', detail: '120 min', price: '£85'},
              {name: 'Balayage', detail: '180 min', price: '£120'},
              {name: 'Kids cut', detail: '30 min', price: '£15'},
            ],
          },
          {label: 'Nails', items: [...sampleServices]},
          {label: 'Lashes', items: [{name: 'Lash lift & tint', detail: '50 min', price: '£40'}]},
          {label: 'Brows', items: [{name: 'Brow shape & tint', detail: '30 min', price: '£20'}]},
        ],
      },
    },
    {
      id: 'team',
      type: 'team',
      props: {
        title: 'Meet the team',
        members: [
          {name: 'Team member', role: 'Senior stylist', media: photo('Team', 'linear-gradient(135deg,#ead9cf,#c9a894)')},
          {name: 'Team member', role: 'Colourist', media: photo('Team', 'linear-gradient(135deg,#c9a894,#ead9cf)')},
          {name: 'Team member', role: 'Nail technician', media: photo('Team', 'linear-gradient(135deg,#ead9cf,#d2b6a5)')},
          {name: 'Team member', role: 'Lash artist', media: photo('Team', 'linear-gradient(135deg,#d2b6a5,#ead9cf)')},
        ],
      },
    },
  ],
  footer: {text: sampleFooter('Halo Hair & Beauty')},
};

const reviewLed: SiteDocument = {
  schemaVersion: 1,
  businessName: 'Glow & Go Beauty',
  theme: reviewLedTheme,
  booking: {...sampleBooking, label: 'Book like they did'},
  nav: {
    links: [
      {label: 'Reviews', sectionId: 'reviews'},
      {label: 'Treatments', sectionId: 'treatments'},
    ],
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      props: {
        layout: 'quote',
        tone: 'theme',
        title: 'Loved by local clients',
        quote: "The best nails I've ever had. I wouldn't go anywhere else.",
        attribution: 'Sample review shown for layout only',
        primaryCta: {label: 'Book like they did', target: 'booking'},
      },
    },
    {id: 'reviews', type: 'reviews', props: {title: 'What clients say', items: sampleReviews}},
    {
      id: 'treatments',
      type: 'services',
      props: {title: 'Popular treatments', presentation: 'rows', items: [...sampleServices]},
    },
  ],
  footer: {text: sampleFooter('Glow & Go Beauty')},
};

const courses: SiteDocument = {
  schemaVersion: 1,
  businessName: 'Atelier Nails Academy',
  theme: coursesTheme,
  booking: {...sampleBooking, label: 'Book a treatment'},
  nav: {
    links: [
      {label: 'Choose', sectionId: 'choose'},
      {label: 'Courses', sectionId: 'courses'},
    ],
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      props: {
        layout: 'center',
        tone: 'theme',
        eyebrow: 'Nail studio and training academy',
        title: 'Book a treatment, or learn the craft',
      },
    },
    {
      id: 'choose',
      type: 'splitCta',
      props: {
        items: [
          {
            title: 'Treatments',
            body: 'Gel, BIAB, extensions and nail art in a bright studio.',
            ctaLabel: 'Book a treatment',
            href: 'https://www.fresha.com/',
            media: photo('Treatment photo', 'linear-gradient(135deg,#ddd5fa,#f3d6ef)'),
          },
          {
            title: 'Courses',
            body: 'Small-group and one-to-one courses with certification on completion.',
            ctaLabel: 'See upcoming courses',
            href: 'https://www.fresha.com/',
            media: photo('Course photo', 'linear-gradient(135deg,#c2b4f3,#8f7ae8)'),
          },
        ],
      },
    },
    {
      id: 'courses',
      type: 'services',
      props: {
        title: 'Upcoming courses',
        presentation: 'rows',
        items: [
          {name: 'Gel polish foundation', detail: '1 day · sample date', price: '£249'},
          {name: 'BIAB masterclass', detail: '1 day · sample date', price: '£299'},
          {name: 'Nail art essentials', detail: '2 days · sample date', price: '£399'},
        ],
      },
    },
  ],
  footer: {text: sampleFooter('Atelier Nails Academy')},
};

const neighbourhood: SiteDocument = {
  schemaVersion: 1,
  businessName: 'Portswood Nails & Beauty',
  theme: neighbourhoodTheme,
  booking: {...sampleBooking, label: 'Book online'},
  nav: {
    links: [
      {label: 'Find us', sectionId: 'find-us'},
      {label: 'Prices', sectionId: 'prices'},
    ],
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      props: {
        layout: 'split',
        tone: 'theme',
        eyebrow: 'Portswood Road, Southampton',
        title: 'Your local salon, open six days a week',
        body: 'Nails, lashes and brows on the high street. Walk-ins welcome when we have space.',
        primaryCta: {label: 'Book online', target: 'booking'},
        secondaryCta: {label: 'Call or WhatsApp', target: 'find-us'},
        media: photo('Shopfront photo', 'linear-gradient(135deg,#cfe8d9,#a9d3bb)'),
      },
    },
    {
      id: 'find-us',
      type: 'hoursLocation',
      props: {
        title: 'Opening hours',
        address: {kind: 'full', lines: ['Portswood Road', 'Southampton']},
        hours: [
          {days: 'Mon–Fri', hours: '9:30–18:30'},
          {days: 'Saturday', hours: '9:00–17:00'},
          {days: 'Sunday', hours: 'Closed'},
        ],
        note: 'Bus stop and pay-and-display parking nearby.',
        showMapPlaceholder: true,
      },
    },
    {
      id: 'prices',
      type: 'services',
      props: {title: 'Prices', presentation: 'rows', items: [...sampleServices]},
    },
  ],
  footer: {text: sampleFooter('Portswood Nails & Beauty')},
};

export const SITE_PRESETS: Record<SitePresetId, SiteDocument> = {
  'clean-studio': cleanStudio,
  'soft-luxury': softLuxury,
  'portfolio-first': portfolioFirst,
  'home-studio': homeStudio,
  'bold-nail-bar': boldNailBar,
  'clinic-professional': clinic,
  'hair-beauty-menu': hairBeauty,
  'review-led': reviewLed,
  'courses-treatments': courses,
  'neighbourhood-salon': neighbourhood,
};
