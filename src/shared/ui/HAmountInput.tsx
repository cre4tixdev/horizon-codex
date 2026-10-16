import { useState, type ComponentProps } from 'react'
import { currencySymbol, formatAmount, formatUnitAmount, parseAmountInput } from '../formatters/money'
import { HInput } from './HInput'

export function HAmountInput({ value, currency, onChange, onBlur, onFocus, inlineCurrency = false, unitPrecision = false, ...props }: Omit<ComponentProps<typeof HInput>, 'value' | 'type' | 'onChange' | 'onBlur'> & { value: number; currency: string; inlineCurrency?: boolean; unitPrecision?: boolean; onChange: (value: number) => void; onBlur?: () => void }) {
  const [draft, setDraft] = useState<string>()
  const display = Number.isFinite(value) ? inlineCurrency ? (unitPrecision ? formatUnitAmount(value, currency) : formatAmount(value, currency)) : value.toFixed(2) : ''
  return <span className={`h-amount-input${inlineCurrency ? " h-amount-input--inline" : ""}`}>
    <HInput {...props} type={inlineCurrency ? "text" : "number"} inputMode="decimal" step="0.01" data-amount-display={display} value={draft ?? display} onFocus={(event) => { event.currentTarget.select(); onFocus?.(event) }} onChange={(event) => { setDraft(event.target.value); onChange(inlineCurrency ? parseAmountInput(event.target.value, currency) : event.target.value === '' ? Number.NaN : Number(event.target.value)) }} onBlur={() => { setDraft(undefined); onBlur?.() }} />
    {!inlineCurrency && <span className="h-amount-currency" aria-hidden="true" title={currency}>{currencySymbol(currency)}</span>}
  </span>
}
