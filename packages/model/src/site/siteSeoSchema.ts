import * as v from 'valibot';

function optionalText(maxLength: number) {
  return v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(maxLength),
      v.transform((value) => (value.length === 0 ? undefined : value)),
    ),
  );
}

function optionalHttpsUrl() {
  return v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.maxLength(400),
      v.check((value) => value.length === 0 || value.startsWith('https://'), 'Use an https URL'),
      v.transform((value) => (value.length === 0 ? undefined : value)),
    ),
  );
}

export const siteSeoSchema = v.strictObject({
  title: optionalText(120),
  description: optionalText(160),
  locale: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.union([v.literal(''), v.literal('en-GB')]),
      v.transform((value): 'en-GB' | undefined => (value === '' ? undefined : 'en-GB')),
    ),
  ),
  ogImageUrl: optionalHttpsUrl(),
  googleBusinessProfileUrl: optionalHttpsUrl(),
  geo: v.optional(
    v.strictObject({
      latitude: v.pipe(v.number(), v.minValue(-90), v.maxValue(90)),
      longitude: v.pipe(v.number(), v.minValue(-180), v.maxValue(180)),
    }),
  ),
});

export interface SiteSeo extends v.InferOutput<typeof siteSeoSchema> {}
