export interface FpDuplicateFields {
  readonly accountId: string;
  readonly postedDate: string;
  readonly postedTime?: string;
  readonly amount: number;
  readonly description: string;
  readonly recipient: string;
  readonly externalId?: string;
}

export default function fpDuplicateKey(tx: FpDuplicateFields): string {
  if (tx.externalId !== undefined && tx.externalId !== '') {
    return `id:${tx.accountId}:${tx.externalId}`;
  }
  const time = tx.postedTime ?? '';
  return `c:${tx.accountId}:${tx.postedDate}:${tx.amount}:${tx.description}:${tx.recipient}:${time}`;
}
