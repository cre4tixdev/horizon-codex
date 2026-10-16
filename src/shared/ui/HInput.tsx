import type { ComponentProps } from 'react'
import { HDatePicker } from './HDatePicker'
import { cn } from '../lib/cn'

export function HInput({ className, type = 'text', calendarAnchor, ...props }: ComponentProps<'input'> & { calendarAnchor?: string | undefined }) {
  const pickerType = type === 'date' ? 'date' : type === 'month' ? 'month' : type === 'datetime-local' ? 'datetime-local' : undefined
  if (pickerType) return <HDatePicker {...props} type={pickerType} calendarAnchor={calendarAnchor} className={className} />
  return <input type={type} className={cn('h-input', className)} {...props} />
}
