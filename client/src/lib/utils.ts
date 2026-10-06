export type ReportTab = 'summary' | 'daily' | 'monthly' | 'items' | 'inventory';

export function formatMoney(value: number, currencySymbol = 'د.إ'): string {
  return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${currencySymbol}`;
}

export function marginPercent(salePrice: number, purchasePrice: number): number {
  if (!purchasePrice) return 0;
  return ((salePrice - purchasePrice) / purchasePrice) * 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
