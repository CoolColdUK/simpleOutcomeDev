export interface FpParsedTransaction {
  readonly postedDate: string;
  readonly postedTime?: string;
  readonly amount: number;
  readonly description: string;
  readonly recipient: string;
  readonly externalId?: string;
  readonly notes: string;
}
