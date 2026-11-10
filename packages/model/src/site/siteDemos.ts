import type {SiteDocument} from './siteDocumentSchema';
import type {SiteSection} from './siteSectionSchema';
import type {SiteSampleService} from './siteSampleCopy';
import {homeStudioTheme} from './siteThemes';

export interface SiteDemo {
  readonly slug: string;
  readonly preset: 'home-studio';
  readonly status: 'demo';
  readonly document: SiteDocument;
}

type HoursProps = Extract<SiteSection, {type: 'hoursLocation'}>['props'];
type ContactProps = Extract<SiteSection, {type: 'contact'}>['props'];

const placeholderShots = [
  {label: 'Work photo', background: 'linear-gradient(135deg,#dfe3cf,#c7cfb0)'},
  {label: 'Work photo', background: 'linear-gradient(135deg,#c7cfb0,#f6f1e7)'},
  {label: 'Work photo', background: 'linear-gradient(135deg,#fffdf8,#dfe3cf)'},
  {label: 'Work photo', background: 'linear-gradient(135deg,#6f7d5c,#dfe3cf)'},
];

const sampleReviewItems = [
  {quote: 'Sample quote for layout only. Not a client review.', attribution: 'Sample review', stars: 5 as const},
  {quote: 'Another placeholder line so the reviews block has shape.', attribution: 'Sample review', stars: 5 as const},
  {quote: 'Replace these with real reviews only when a client asks.', attribution: 'Sample review', stars: 5 as const},
];

function homeDemo(input: {
  readonly businessName: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly heroBody: string;
  readonly aboutTitle: string;
  readonly aboutBody: string;
  readonly services: readonly SiteSampleService[];
  readonly address: HoursProps['address'];
  readonly hours: HoursProps['hours'];
  readonly hoursNote?: string;
  readonly mapsUrl: string;
  readonly freshaHref: string;
  readonly contactIntro?: string;
  readonly channels: ContactProps['channels'];
}): SiteDocument {
  return {
    schemaVersion: 1,
    businessName: input.businessName,
    theme: homeStudioTheme,
    booking: {label: 'Book on Fresha', href: input.freshaHref, provider: 'fresha'},
    nav: {
      links: [
        {label: 'About', sectionId: 'about'},
        {label: 'Prices', sectionId: 'prices'},
        {label: 'Gallery', sectionId: 'gallery'},
        {label: 'Reviews', sectionId: 'reviews'},
        {label: 'Find us', sectionId: 'find-us'},
        {label: 'Contact', sectionId: 'contact'},
      ],
    },
    sections: [
      {
        id: 'hero',
        type: 'hero',
        props: {
          layout: 'split',
          tone: 'theme',
          eyebrow: input.eyebrow,
          title: input.title,
          body: input.heroBody,
          primaryCta: {label: 'Book on Fresha', target: 'booking'},
          secondaryCta: {label: 'How to find me', target: 'find-us'},
          media: {label: 'Studio photo', background: 'linear-gradient(135deg,#dfe3cf,#c7cfb0)'},
        },
      },
      {
        id: 'about',
        type: 'about',
        props: {
          eyebrow: 'About',
          title: input.aboutTitle,
          body: input.aboutBody,
          media: {label: 'Portrait', background: 'linear-gradient(135deg,#fffdf8,#c7cfb0)'},
        },
      },
      {
        id: 'prices',
        type: 'services',
        props: {title: 'Treatments and prices', presentation: 'rows', items: [...input.services]},
      },
      {id: 'gallery', type: 'gallery', props: {title: 'Gallery', items: placeholderShots}},
      {id: 'reviews', type: 'reviews', props: {title: 'Reviews', items: sampleReviewItems}},
      {
        id: 'book',
        type: 'bookingCta',
        props: {title: 'Book on Fresha', body: 'Choose a time on the Fresha page. This demo does not take bookings itself.'},
      },
      {
        id: 'find-us',
        type: 'hoursLocation',
        props: {
          title: 'Hours and location',
          address: input.address,
          hours: input.hours,
          ...(input.hoursNote === undefined ? {} : {note: input.hoursNote}),
          mapsUrl: input.mapsUrl,
          showMapPlaceholder: true,
        },
      },
      {
        id: 'contact',
        type: 'contact',
        props: {
          title: 'Contact',
          ...(input.contactIntro === undefined ? {} : {intro: input.contactIntro}),
          channels: input.channels,
        },
      },
    ],
    footer: {text: `${input.businessName} · Sample design by Simple Outcome · Photographs are placeholders`},
  };
}

export const SITE_DEMOS: readonly SiteDemo[] = [
  {
    slug: 'newbeauty',
    preset: 'home-studio',
    status: 'demo',
    document: homeDemo({
      businessName: 'New Beauty',
      eyebrow: 'Home beauty studio · Hightown',
      title: 'One-to-one beauty on Bursledon Road',
      heroBody: 'A home studio in Hightown for nails and beauty. Appointments are one client at a time, booked on Fresha.',
      aboutTitle: 'A quiet appointment, just you',
      aboutBody:
        'New Beauty is a home-based studio on Bursledon Road in Hightown, Southampton. Treatments are insured and booked individually. The house number is not shown on this sample.',
      services: [
        {name: 'Gel overlays (BIAB)', detail: '1 hr 30 min', price: '£33'},
        {name: 'Gel hands', detail: '1 hr 30 min', price: '£28'},
        {name: 'Gel feet', detail: '1 hr', price: '£28'},
        {name: 'Brow wax and tint', detail: '30 min', price: '£15'},
        {name: 'Brow wax', detail: '30 min', price: '£10'},
        {name: 'Upper lip', detail: '15 min', price: '£5'},
      ],
      address: {kind: 'street-and-area', street: 'Bursledon Road', area: 'Hightown, Southampton'},
      hours: [
        {days: 'Monday', hours: '9:30–14:30'},
        {days: 'Tuesday', hours: '9:30–14:30, 16:00–20:30'},
        {days: 'Wednesday', hours: '9:30–14:30'},
        {days: 'Thursday', hours: '9:30–14:30'},
        {days: 'Friday', hours: '9:30–14:30'},
        {days: 'Saturday', hours: 'Closed'},
        {days: 'Sunday', hours: 'Closed'},
      ],
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Bursledon%20Road%2C%20Hightown%2C%20Southampton',
      freshaHref: 'https://www.fresha.com/a/new-beauty-southampton-bursledon-road-qzclui06',
      contactIntro: 'Book on Fresha. A public phone number is not listed on this page.',
      channels: [],
    }),
  },
  {
    slug: 'soniasnails',
    preset: 'home-studio',
    status: 'demo',
    document: homeDemo({
      businessName: "Sonia's Nails UK",
      eyebrow: 'Nail salon · Southampton',
      title: 'Nails on Ruby Road',
      heroBody: 'Manicures, pedicures and extensions at Sonia’s Nails UK. Prices are not published on the booking page, so they are not invented here.',
      aboutTitle: 'A nail salon in Southampton',
      aboutBody: 'Sonia’s Nails UK is at 25 Ruby Road, Southampton, SO19 7NB. Book on Fresha or call the published salon number.',
      services: [
        {name: 'Acrylic nails', detail: 'See Fresha', price: 'Not published'},
        {name: 'Manicure and pedicure', detail: 'See Fresha', price: 'Not published'},
        {name: 'Nail extensions', detail: 'See Fresha', price: 'Not published'},
        {name: 'Nail polish', detail: 'See Fresha', price: 'Not published'},
        {name: 'Pedicure', detail: 'See Fresha', price: 'Not published'},
        {name: "Men's manicure", detail: 'See Fresha', price: 'Not published'},
        {name: "Men's pedicure", detail: 'See Fresha', price: 'Not published'},
      ],
      address: {kind: 'full', lines: ['25 Ruby Road', 'Southampton', 'SO19 7NB']},
      hours: [{days: 'Monday', hours: '9:00–18:00'}],
      hoursNote: 'Only Monday’s hours are published on Fresha. Other days are listed there without times.',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=25%20Ruby%20Road%2C%20Southampton%20SO19%207NB',
      freshaHref: 'https://www.fresha.com/lvp/sonias-nails-uk-ruby-road-PV7JQ4',
      channels: [{kind: 'phone', label: '07889 504517', href: 'tel:+447889504517'}],
    }),
  },
  {
    slug: 'lkbaesthetics',
    preset: 'home-studio',
    status: 'demo',
    document: homeDemo({
      businessName: 'LKB Aesthetics',
      eyebrow: 'Home clinic · Bitterne Village',
      title: 'Aesthetics and beauty in Bitterne Village',
      heroBody: 'A home-based clinic for nails, lashes and other treatments. Book on Fresha and read the cancellation policy there before you come.',
      aboutTitle: 'One-to-one, in Bitterne Village',
      aboutBody:
        'LKB Aesthetics works from Little Lances Hill in Bitterne Village, Southampton. This sample shows the street and area only, not the house number. Cancellation terms are on the Fresha page.',
      services: [
        {name: 'Gel polish feet', detail: '30–40 min', price: '£28'},
        {name: 'Classic lash extensions', detail: '1 hr–1 hr 45 min', price: 'from £30'},
        {name: 'Tinting', detail: '15–30 min', price: '£20'},
        {name: 'Eyebrow tidy', detail: '10 min', price: '£10'},
        {name: 'BIAB nails', detail: '15 min–1 hr 30 min', price: 'from £5'},
        {name: 'Acrylic nail extensions', detail: '15 min–1 hr 15 min', price: 'from £5'},
      ],
      address: {kind: 'street-and-area', street: 'Little Lances Hill', area: 'Bitterne Village, Southampton'},
      hours: [
        {days: 'Monday–Friday', hours: '10:00–17:00'},
        {days: 'Saturday', hours: '9:00–15:00'},
        {days: 'Sunday', hours: 'Closed'},
      ],
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Little%20Lances%20Hill%2C%20Bitterne%20Village%2C%20Southampton',
      freshaHref: 'https://www.fresha.com/a/lkb-aesthetics-southampton-uk-15-little-lances-hill-qb4x51hz',
      contactIntro: 'Book on Fresha. A public phone number is not listed on this page.',
      channels: [],
    }),
  },
];

export function findSiteDemo(slug: string): SiteDemo | undefined {
  return SITE_DEMOS.find((demo) => demo.slug === slug);
}
