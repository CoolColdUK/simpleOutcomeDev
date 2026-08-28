import * as v from 'valibot';
import {FEATURE_KINDS, type FeatureKind} from './featureKind';

export const featureKindSchema = v.picklist(FEATURE_KINDS);

export default function parseFeatureKind(input: unknown): FeatureKind {
  return v.parse(featureKindSchema, input);
}
