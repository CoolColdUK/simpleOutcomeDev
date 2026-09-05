import type {FpDuplicateFields} from './fpDuplicateKey';

export default function fpIsDuplicate(incoming: FpDuplicateFields, existing: FpDuplicateFields): boolean {
  if (incoming.accountId !== existing.accountId) {
    return false;
  }
  if (incoming.externalId !== undefined && incoming.externalId !== '') {
    return incoming.externalId === existing.externalId;
  }
  if (
    incoming.postedDate !== existing.postedDate ||
    incoming.amount !== existing.amount ||
    incoming.description !== existing.description ||
    incoming.recipient !== existing.recipient
  ) {
    return false;
  }
  if (incoming.postedTime !== undefined && existing.postedTime !== undefined) {
    return incoming.postedTime === existing.postedTime;
  }
  return true;
}
