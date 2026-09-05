import * as v from 'valibot';

export const fpNameSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80));

export default function parseFpName(input: unknown): string {
  return v.parse(fpNameSchema, input);
}
