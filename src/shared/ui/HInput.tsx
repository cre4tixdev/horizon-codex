import type { ComponentProps } from 'react'
import { X } from 'lucide-react'
import { HButton } from './HButton'
import { HDatePicker } from './HDatePicker'
import { cn } from '../lib/cn'

export function HInput({ className, type = 'text', calendarAnchor, onClear, clearLabel = 'Effacer le champ', ...props }: ComponentProps<'input'> & { calendarAnchor?: string | undefined; onClear?: (() => void) | undefined; clearLabel?: string }) {
  const pickerType = type === 'date' ? 'date' : type === 'month' ? 'month' : type === 'datetime-local' ? 'datetime-local' : undefined
  if (pickerType) return <HDatePicker {...props} type={pickerType} calendarAnchor={calendarAnchor} className={className} />
  const input = <input type={type} className={cn('h-input', className)} {...props} />
  return onClear ? <span className="h-clearable-input">{input}{props.value !== '' && props.value !== undefined && <HButton type="button" size="icon" variant="ghost" className="h-input-clear" disabled={props.disabled || props.readOnly} aria-label={clearLabel} title={clearLabel} onClick={onClear}><X size={13} /></HButton>}</span> : input
}
