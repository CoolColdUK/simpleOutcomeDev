import * as v from 'valibot';
import {displayNameSchema, type DisplayName} from './displayNameSchema';

export default function parseDisplayName(input: unknown): DisplayName {
  return v.parse(displayNameSchema, input);
}
