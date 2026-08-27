import * as v from 'valibot';

export const contactRequestSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Name is required')),
  email: v.pipe(v.string(), v.trim(), v.email('Invalid email address')),
  message: v.pipe(v.string(), v.trim(), v.minLength(1, 'Message is required')),
});

export interface ContactRequest {
  readonly name: string;
  readonly email: string;
  readonly message: string;
}
