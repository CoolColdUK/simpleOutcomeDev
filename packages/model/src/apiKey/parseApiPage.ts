export interface ApiPage {
  readonly limit: number;
  readonly offset: number;
}

export default function parseApiPage(limit: number | undefined, offset: number | undefined): ApiPage {
  return {
    limit: limit ?? 50,
    offset: offset ?? 0,
  };
}
