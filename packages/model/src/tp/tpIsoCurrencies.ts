export interface TpIsoCurrency {
  readonly code: string;
  readonly name: string;
}

/** Curated ISO 4217 codes for trip money fields (searchable select). */
export const TP_ISO_CURRENCIES: readonly TpIsoCurrency[] = [
  {code: 'HKD', name: 'Hong Kong dollar'},
  {code: 'JPY', name: 'Japanese yen'},
  {code: 'CNY', name: 'Chinese yuan'},
  {code: 'TWD', name: 'New Taiwan dollar'},
  {code: 'KRW', name: 'South Korean won'},
  {code: 'SGD', name: 'Singapore dollar'},
  {code: 'MYR', name: 'Malaysian ringgit'},
  {code: 'THB', name: 'Thai baht'},
  {code: 'VND', name: 'Vietnamese dong'},
  {code: 'IDR', name: 'Indonesian rupiah'},
  {code: 'PHP', name: 'Philippine peso'},
  {code: 'INR', name: 'Indian rupee'},
  {code: 'AUD', name: 'Australian dollar'},
  {code: 'NZD', name: 'New Zealand dollar'},
  {code: 'USD', name: 'US dollar'},
  {code: 'CAD', name: 'Canadian dollar'},
  {code: 'GBP', name: 'Pound sterling'},
  {code: 'EUR', name: 'Euro'},
  {code: 'CHF', name: 'Swiss franc'},
  {code: 'SEK', name: 'Swedish krona'},
  {code: 'NOK', name: 'Norwegian krone'},
  {code: 'DKK', name: 'Danish krone'},
  {code: 'PLN', name: 'Polish zloty'},
  {code: 'CZK', name: 'Czech koruna'},
  {code: 'TRY', name: 'Turkish lira'},
  {code: 'AED', name: 'UAE dirham'},
  {code: 'SAR', name: 'Saudi riyal'},
  {code: 'ILS', name: 'Israeli new shekel'},
  {code: 'EGP', name: 'Egyptian pound'},
  {code: 'ZAR', name: 'South African rand'},
  {code: 'MXN', name: 'Mexican peso'},
  {code: 'BRL', name: 'Brazilian real'},
  {code: 'ARS', name: 'Argentine peso'},
  {code: 'MOP', name: 'Macanese pataca'},
] as const;

const CODE_SET = new Set(TP_ISO_CURRENCIES.map((c) => c.code));

export function isTpIsoCurrencyCode(code: string | undefined | null): boolean {
  if (code === undefined || code === null || code === '') {
    return false;
  }
  return CODE_SET.has(code.toUpperCase());
}

export function tpIsoCurrencyName(code: string | undefined): string | undefined {
  if (code === undefined || code === '') {
    return undefined;
  }
  const upper = code.toUpperCase();
  return TP_ISO_CURRENCIES.find((c) => c.code === upper)?.name;
}

export function filterTpIsoCurrencies(query: string): readonly TpIsoCurrency[] {
  const q = query.trim().toLowerCase();
  if (q === '') {
    return TP_ISO_CURRENCIES;
  }
  return TP_ISO_CURRENCIES.filter(
    (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
  );
}
