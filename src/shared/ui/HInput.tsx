import type { ComponentProps } from 'react'
import { cn } from '../lib/cn'

export function HInput({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return <input type={type} className={cn('h-input', className)} {...props} />
}
