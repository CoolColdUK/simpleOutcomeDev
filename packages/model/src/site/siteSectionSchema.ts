import * as v from 'valibot';
import {siteMediaSchema} from './siteMediaSchema';
import {
  siteBodySchema,
  siteDetailSchema,
  siteHttpUrlSchema,
  sitePriceSchema,
  siteSectionIdSchema,
  siteShortTextSchema,
} from './siteTextSchema';

const siteCtaSchema = v.strictObject({
  label: siteShortTextSchema,
  target: v.union([v.literal('booking'), siteSectionIdSchema]),
});

const siteServiceItemSchema = v.strictObject({
  name: siteShortTextSchema,
  detail: siteDetailSchema,
  price: sitePriceSchema,
});

const siteServiceListSchema = v.pipe(v.array(siteServiceItemSchema), v.minLength(1), v.maxLength(24));

const noHouseNumber = (value: string) => !/^\d/.test(value);

const siteStreetAndAreaSchema = v.strictObject({
  kind: v.literal('street-and-area'),
  street: v.pipe(siteShortTextSchema, v.check(noHouseNumber, 'A home address cannot start with a house number')),
  area: v.pipe(siteShortTextSchema, v.check(noHouseNumber, 'A home area cannot start with a house number')),
});

const siteFullAddressSchema = v.strictObject({
  kind: v.literal('full'),
  lines: v.pipe(v.array(siteShortTextSchema), v.minLength(1), v.maxLength(6)),
});

const siteChannelSchema = v.strictObject({
  kind: v.picklist(['phone', 'email', 'whatsapp', 'instagram']),
  label: siteShortTextSchema,
  href: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(300)),
});

export const siteSectionSchema = v.variant('type', [
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('hero'),
    props: v.strictObject({
      layout: v.picklist(['split', 'center', 'statement', 'band', 'quote']),
      tone: v.picklist(['theme', 'light']),
      eyebrow: v.optional(siteShortTextSchema),
      title: siteShortTextSchema,
      body: v.optional(siteBodySchema),
      primaryCta: v.optional(siteCtaSchema),
      secondaryCta: v.optional(siteCtaSchema),
      media: v.optional(siteMediaSchema),
      quote: v.optional(siteBodySchema),
      attribution: v.optional(siteShortTextSchema),
    }),
  }),
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('highlights'),
    props: v.strictObject({
      items: v.pipe(
        v.array(v.strictObject({title: siteShortTextSchema, body: siteBodySchema})),
        v.minLength(1),
        v.maxLength(12),
      ),
    }),
  }),
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('services'),
    props: v.variant('presentation', [
      v.strictObject({title: siteShortTextSchema, presentation: v.literal('rows'), items: siteServiceListSchema}),
      v.strictObject({title: siteShortTextSchema, presentation: v.literal('cards'), items: siteServiceListSchema}),
      v.strictObject({
        title: siteShortTextSchema,
        presentation: v.literal('grouped'),
        groups: v.pipe(
          v.array(v.strictObject({label: siteShortTextSchema, items: siteServiceListSchema})),
          v.minLength(1),
          v.maxLength(8),
        ),
      }),
    ]),
  }),
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('about'),
    props: v.strictObject({
      eyebrow: siteShortTextSchema,
      title: siteShortTextSchema,
      body: siteBodySchema,
      media: v.optional(siteMediaSchema),
    }),
  }),
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('gallery'),
    props: v.strictObject({
      title: v.optional(siteShortTextSchema),
      items: v.pipe(v.array(siteMediaSchema), v.minLength(1), v.maxLength(24)),
    }),
  }),
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('reviews'),
    props: v.strictObject({
      title: v.optional(siteShortTextSchema),
      items: v.pipe(
        v.array(
          v.strictObject({
            quote: siteBodySchema,
            attribution: siteShortTextSchema,
            stars: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5)),
          }),
        ),
        v.minLength(1),
        v.maxLength(12),
      ),
    }),
  }),
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('bookingCta'),
    props: v.strictObject({
      title: siteShortTextSchema,
      body: v.optional(siteBodySchema),
    }),
  }),
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('hoursLocation'),
    props: v.strictObject({
      title: siteShortTextSchema,
      address: v.variant('kind', [siteStreetAndAreaSchema, siteFullAddressSchema]),
      hours: v.pipe(
        v.array(v.strictObject({days: siteShortTextSchema, hours: siteShortTextSchema})),
        v.minLength(1),
        v.maxLength(14),
      ),
      note: v.optional(siteBodySchema),
      mapsUrl: v.optional(siteHttpUrlSchema),
      showMapPlaceholder: v.boolean(),
    }),
  }),
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('contact'),
    props: v.strictObject({
      title: siteShortTextSchema,
      intro: v.optional(siteBodySchema),
      channels: v.pipe(v.array(siteChannelSchema), v.maxLength(8)),
    }),
  }),
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('faq'),
    props: v.strictObject({
      title: siteShortTextSchema,
      items: v.pipe(
        v.array(v.strictObject({question: siteShortTextSchema, answer: siteBodySchema})),
        v.minLength(1),
        v.maxLength(12),
      ),
    }),
  }),
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('team'),
    props: v.strictObject({
      title: siteShortTextSchema,
      members: v.pipe(
        v.array(v.strictObject({name: siteShortTextSchema, role: siteShortTextSchema, media: siteMediaSchema})),
        v.minLength(1),
        v.maxLength(12),
      ),
    }),
  }),
  v.strictObject({
    id: siteSectionIdSchema,
    type: v.literal('splitCta'),
    props: v.strictObject({
      items: v.pipe(
        v.array(
          v.strictObject({
            title: siteShortTextSchema,
            body: siteBodySchema,
            ctaLabel: siteShortTextSchema,
            href: siteHttpUrlSchema,
            media: siteMediaSchema,
          }),
        ),
        v.length(2),
      ),
    }),
  }),
]);

export type SiteSection = v.InferOutput<typeof siteSectionSchema>;
