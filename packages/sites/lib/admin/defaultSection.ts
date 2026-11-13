import type {SiteSection, SiteSectionType} from '@so/model';

export function createDefaultSection(type: SiteSectionType, id: string): SiteSection {
  if (type === 'hero') {
    return {
      id,
      type: 'hero',
      props: {
        layout: 'split',
        tone: 'theme',
        title: 'New hero',
        body: 'Add your opening line.',
      },
    };
  }
  if (type === 'highlights') {
    return {id, type: 'highlights', props: {items: [{title: 'Highlight', body: 'A short point.'}]}};
  }
  if (type === 'services') {
    return {
      id,
      type: 'services',
      props: {title: 'Treatments', presentation: 'rows', items: [{name: 'Treatment', detail: '30 min', price: '£30'}]},
    };
  }
  if (type === 'about') {
    return {id, type: 'about', props: {eyebrow: 'About', title: 'About the studio', body: 'Tell your story.'}};
  }
  if (type === 'gallery') {
    return {
      id,
      type: 'gallery',
      props: {title: 'Gallery', items: [{label: 'Work photo', background: 'linear-gradient(135deg,#dfe3cf,#c7cfb0)'}]},
    };
  }
  if (type === 'reviews') {
    return {
      id,
      type: 'reviews',
      props: {title: 'Reviews', items: [{quote: 'A sample review.', attribution: 'Client', stars: 5}]},
    };
  }
  if (type === 'bookingCta') {
    return {id, type: 'bookingCta', props: {title: 'Book now', body: 'Choose a time on the booking page.'}};
  }
  if (type === 'hoursLocation') {
    return {
      id,
      type: 'hoursLocation',
      props: {
        title: 'Hours and location',
        address: {kind: 'street-and-area', street: 'High Street', area: 'Town'},
        hours: [{days: 'Monday–Friday', hours: '9:00–17:00'}],
        showMapPlaceholder: true,
      },
    };
  }
  if (type === 'contact') {
    return {id, type: 'contact', props: {title: 'Contact', intro: 'Get in touch.', channels: []}};
  }
  if (type === 'contactForm') {
    return {id, type: 'contactForm', props: {title: 'Send a message', submitLabel: 'Send'}};
  }
  if (type === 'faq') {
    return {id, type: 'faq', props: {title: 'FAQ', items: [{question: 'A question?', answer: 'An answer.'}]}};
  }
  if (type === 'team') {
    return {
      id,
      type: 'team',
      props: {
        title: 'Team',
        members: [
          {
            name: 'Name',
            role: 'Role',
            media: {label: 'Portrait', background: 'linear-gradient(135deg,#fffdf8,#c7cfb0)'},
          },
        ],
      },
    };
  }
  return {
    id,
    type: 'splitCta',
    props: {
      items: [
        {
          title: 'Left',
          body: 'Left card',
          ctaLabel: 'Open',
          href: 'https://example.com',
          media: {label: 'Photo', background: 'linear-gradient(135deg,#dfe3cf,#c7cfb0)'},
        },
        {
          title: 'Right',
          body: 'Right card',
          ctaLabel: 'Open',
          href: 'https://example.com',
          media: {label: 'Photo', background: 'linear-gradient(135deg,#c7cfb0,#f6f1e7)'},
        },
      ],
    },
  };
}

export function newSectionId(type: SiteSectionType): string {
  return `${type}-${Math.random().toString(36).slice(2, 8)}`;
}
