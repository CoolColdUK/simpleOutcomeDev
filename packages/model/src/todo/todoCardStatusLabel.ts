export default function todoCardStatusLabel(columnTitle: string | undefined): string {
  if (columnTitle === undefined || columnTitle === '') {
    return 'Archive';
  }
  return columnTitle;
}
