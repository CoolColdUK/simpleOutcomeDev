import * as v from 'valibot';
import {contactRequestSchema, type ContactRequest} from './contactRequestSchema';

export default function parseContactRequest(input: unknown): ContactRequest {
  return v.parse(contactRequestSchema, input);
}
