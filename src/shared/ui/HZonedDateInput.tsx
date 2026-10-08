import { useState } from 'react'
import { HInput } from './HInput'
import { zonedInput, zonedInstant } from '../time/zonedDate'
export function HZonedDateInput({ id, value, timezone, onChange, required = false, disabled = false }: { id?: string; value: string; timezone: string; onChange: (value: string) => void; required?: boolean; disabled?: boolean }) {
  const [error, setError] = useState('')
  return <><HInput id={id} type="datetime-local" value={zonedInput(value, timezone)} required={required} disabled={disabled} aria-invalid={Boolean(error)} onChange={(event) => { try { const next = zonedInstant(event.target.value, timezone); event.currentTarget.setCustomValidity(''); setError(''); onChange(next) } catch (error) { const message = error instanceof Error ? error.message : 'Date invalide.'; event.currentTarget.setCustomValidity(message); setError(message) } }} />{error && <span role="alert" className="field-error">{error}</span>}</>
}
