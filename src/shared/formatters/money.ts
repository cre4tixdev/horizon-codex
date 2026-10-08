const currencyFormatter = (currency: string) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const formatAmount = (amount: number, currency: string) => currencyFormatter(currency).format(amount)
export const currencySymbol = (currency: string) => currencyFormatter(currency).formatToParts(0).find((part) => part.type === 'currency')!.value

/** Accept plain numeric editing and amounts copied from Horizon's French display. */
export function parseAmountInput(value: string, currency: string) {
  const numeric = value.replace(currencySymbol(currency), '').replace(/\s/g, '').replace(',', '.')
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(numeric) ? Number(numeric) : Number.NaN
}
