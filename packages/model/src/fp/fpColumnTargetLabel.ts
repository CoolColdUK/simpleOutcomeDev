import {FpColumnTarget} from './fpColumnTarget';

export default function fpColumnTargetLabel(target: FpColumnTarget): string {
  if (target === FpColumnTarget.DATE) {
    return 'Date';
  }
  if (target === FpColumnTarget.TIME) {
    return 'Time';
  }
  if (target === FpColumnTarget.AMOUNT) {
    return 'Amount';
  }
  if (target === FpColumnTarget.DESCRIPTION) {
    return 'Description';
  }
  if (target === FpColumnTarget.RECIPIENT) {
    return 'Recipient';
  }
  if (target === FpColumnTarget.EXTERNAL_ID) {
    return 'External ID';
  }
  return 'Notes';
}
