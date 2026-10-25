import {isTpIsoCurrencyCode} from './tpIsoCurrencies';

/** Empty money field: trip budget currency, then pod default, when on the curated list. */
export default function tpMoneyDefaultCurrency(
  budgetCurrency?: string,
  podDefaultCurrency?: string,
): string {
  if (budgetCurrency !== undefined && budgetCurrency !== '' && isTpIsoCurrencyCode(budgetCurrency)) {
    return budgetCurrency.toUpperCase();
  }
  if (podDefaultCurrency !== undefined && podDefaultCurrency !== '' && isTpIsoCurrencyCode(podDefaultCurrency)) {
    return podDefaultCurrency.toUpperCase();
  }
  return '';
}
