export interface TpIsoCountry {
  readonly code: string;
  readonly name: string;
}

/** ISO 3166-1 alpha-2 codes for location country (searchable select). */
export const TP_ISO_COUNTRIES: readonly TpIsoCountry[] = [
  {code: 'HK', name: 'Hong Kong'},
  {code: 'JP', name: 'Japan'},
  {code: 'CN', name: 'China'},
  {code: 'TW', name: 'Taiwan'},
  {code: 'KR', name: 'South Korea'},
  {code: 'SG', name: 'Singapore'},
  {code: 'MY', name: 'Malaysia'},
  {code: 'TH', name: 'Thailand'},
  {code: 'VN', name: 'Vietnam'},
  {code: 'ID', name: 'Indonesia'},
  {code: 'PH', name: 'Philippines'},
  {code: 'IN', name: 'India'},
  {code: 'AU', name: 'Australia'},
  {code: 'NZ', name: 'New Zealand'},
  {code: 'US', name: 'United States'},
  {code: 'CA', name: 'Canada'},
  {code: 'GB', name: 'United Kingdom'},
  {code: 'IE', name: 'Ireland'},
  {code: 'FR', name: 'France'},
  {code: 'DE', name: 'Germany'},
  {code: 'IT', name: 'Italy'},
  {code: 'ES', name: 'Spain'},
  {code: 'PT', name: 'Portugal'},
  {code: 'NL', name: 'Netherlands'},
  {code: 'BE', name: 'Belgium'},
  {code: 'CH', name: 'Switzerland'},
  {code: 'AT', name: 'Austria'},
  {code: 'SE', name: 'Sweden'},
  {code: 'NO', name: 'Norway'},
  {code: 'DK', name: 'Denmark'},
  {code: 'FI', name: 'Finland'},
  {code: 'PL', name: 'Poland'},
  {code: 'CZ', name: 'Czechia'},
  {code: 'GR', name: 'Greece'},
  {code: 'TR', name: 'Turkey'},
  {code: 'AE', name: 'United Arab Emirates'},
  {code: 'SA', name: 'Saudi Arabia'},
  {code: 'IL', name: 'Israel'},
  {code: 'EG', name: 'Egypt'},
  {code: 'ZA', name: 'South Africa'},
  {code: 'MX', name: 'Mexico'},
  {code: 'BR', name: 'Brazil'},
  {code: 'AR', name: 'Argentina'},
  {code: 'MO', name: 'Macao'},
] as const;

const CODE_SET = new Set(TP_ISO_COUNTRIES.map((c) => c.code));

export function isTpIsoCountryCode(code: string | undefined | null): boolean {
  if (code === undefined || code === null || code === '') {
    return false;
  }
  return CODE_SET.has(code.toUpperCase());
}

export function tpIsoCountryName(code: string | undefined): string | undefined {
  if (code === undefined || code === '') {
    return undefined;
  }
  const upper = code.toUpperCase();
  return TP_ISO_COUNTRIES.find((c) => c.code === upper)?.name;
}

export function filterTpIsoCountries(query: string): readonly TpIsoCountry[] {
  const q = query.trim().toLowerCase();
  if (q === '') {
    return TP_ISO_COUNTRIES;
  }
  return TP_ISO_COUNTRIES.filter(
    (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
  );
}
