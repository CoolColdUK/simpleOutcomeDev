export interface SiteSampleService {
  readonly name: string;
  readonly detail: string;
  readonly price: string;
}

export const sampleServices: readonly SiteSampleService[] = [
  {name: 'Gel manicure', detail: '45 min', price: '£28'},
  {name: 'BIAB overlay', detail: '60 min', price: '£35'},
  {name: 'Lash lift & tint', detail: '50 min', price: '£40'},
  {name: 'Brow shape & tint', detail: '30 min', price: '£20'},
];

export const sampleBooking = {
  label: 'Book now',
  href: 'https://www.fresha.com/',
  provider: 'fresha' as const,
};

export const sampleReviews = [
  {quote: 'Lovely, relaxed appointment and my nails lasted weeks.', attribution: 'Sample review', stars: 5},
  {quote: 'Always on time and so friendly. Highly recommend.', attribution: 'Sample review', stars: 5},
  {quote: 'Easy to book and beautiful results every visit.', attribution: 'Sample review', stars: 5},
];

export function sampleFooter(businessName: string): string {
  return `${businessName} · Sample design by Simple Outcome · Fictional business and placeholder content`;
}
