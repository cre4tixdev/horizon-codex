import { useState, type ComponentProps } from 'react'
import { currencySymbol, formatAmount, parseAmountInput } from '../formatters/money'
import { HInput } from './HInput'

export function HAmountInput({ value, currency, onChange, onBlur, inlineCurrency = false, ...props }: Omit<ComponentProps<typeof HInput>, 'value' | 'type' | 'onChange' | 'onBlur'> & { value: number; currency: string; inlineCurrency?: boolean; onChange: (value: number) => void; onBlur?: () => void }) {
  const [draft, setDraft] = useState<string>()
  return <span className={`h-amount-input${inlineCurrency ? " h-amount-input--inline" : ""}`}>
    <HInput {...props} type={inlineCurrency ? "text" : "number"} inputMode="decimal" step="0.01" value={draft ?? (Number.isFinite(value) ? inlineCurrency ? formatAmount(value, currency) : value.toFixed(2) : '')} onChange={(event) => { setDraft(event.target.value); onChange(inlineCurrency ? parseAmountInput(event.target.value, currency) : event.target.value === '' ? Number.NaN : Number(event.target.value)) }} onBlur={() => { setDraft(undefined); onBlur?.() }} />
    {!inlineCurrency && <span className="h-amount-currency" aria-hidden="true" title={currency}>{currencySymbol(currency)}</span>}
  </span>
}
