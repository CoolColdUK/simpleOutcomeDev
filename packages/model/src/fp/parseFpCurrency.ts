import * as v from 'valibot';

export const fpCurrencySchema = v.pipe(v.string(), v.trim(), v.minLength(3), v.maxLength(8));

export default function parseFpCurrency(input: unknown): string {
  return v.parse(fpCurrencySchema, input);
}
