import { useState, type ComponentProps } from 'react'
import { HInput } from './HInput'

// Keep the text being edited separate from the numeric form value.
export function HNumberInput({ value, onChange, onFocus, onBlur, ...props }: Omit<ComponentProps<typeof HInput>, 'value' | 'type' | 'onChange'> & { value: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState<string>()
  return <HInput {...props} type="number" inputMode="decimal" value={draft ?? (Number.isFinite(value) ? String(value) : '')} onFocus={(event) => { event.currentTarget.select(); onFocus?.(event) }} onChange={(event) => { setDraft(event.target.value); onChange(event.target.valueAsNumber) }} onBlur={(event) => { setDraft(undefined); onBlur?.(event) }} />
}
