import * as v from 'valibot';
import {contactRequestSchema, type ContactRequest} from './contactRequestSchema';

export default function safeParseContactRequest(input: unknown): ContactRequest | undefined {
  const result = v.safeParse(contactRequestSchema, input);
  if (!result.success) {
    return undefined;
  }
  return result.output;
}
