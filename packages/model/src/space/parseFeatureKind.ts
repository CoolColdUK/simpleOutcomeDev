import * as v from 'valibot';
import {FeatureKind} from './featureKind';

export const featureKindSchema = v.enum(FeatureKind);

export default function parseFeatureKind(input: unknown): FeatureKind {
  return v.parse(featureKindSchema, input);
}
