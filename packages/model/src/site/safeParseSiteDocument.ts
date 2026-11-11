import * as v from 'valibot';
import {siteDocumentSchema, type SiteDocument} from './siteDocumentSchema';
import {assertSiteDocument} from './parseSiteDocument';

export function safeParseSiteDocument(input: unknown): SiteDocument | undefined {
  const result = v.safeParse(siteDocumentSchema, input);
  if (!result.success) {
    return undefined;
  }
  try {
    assertSiteDocument(result.output);
  } catch {
    return undefined;
  }
  return result.output;
}
