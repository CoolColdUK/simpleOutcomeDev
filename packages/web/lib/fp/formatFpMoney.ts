export default function formatFpMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {style: 'currency', currency}).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
