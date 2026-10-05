import type {DbFpAccount} from '@/lib/api/db/mapDbFpAccount';
import type {DbFpCategory} from '@/lib/api/db/mapDbFpCategory';
import type {DbFpTransaction} from '@/lib/api/db/mapDbFpTransaction';

function escapeCsvCell(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function categoryLabel(id: string | undefined, categories: readonly DbFpCategory[]): string {
  if (id === undefined) {
    return 'Uncategorised';
  }
  return categories.find((c) => c.id === id)?.name ?? id;
}

export default function downloadFpTransactionsCsv(
  transactions: readonly DbFpTransaction[],
  accounts: readonly DbFpAccount[],
  categories: readonly DbFpCategory[],
  fileName: string,
): void {
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;
  const header = ['Date', 'Account', 'Description', 'Recipient', 'Amount', 'Category', 'Confirmed'];
  const lines = [
    header.join(','),
    ...transactions.map((t) =>
      [
        t.postedDate,
        accountName(t.accountId),
        t.description,
        t.recipient,
        String(t.amount),
        categoryLabel(t.categoryId, categories),
        t.confirmed ? 'yes' : 'no',
      ]
        .map(escapeCsvCell)
        .join(','),
    ),
  ];
  const blob = new Blob([lines.join('\n')], {type: 'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
