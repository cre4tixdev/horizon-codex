import type { ComponentProps } from 'react'
import { cn } from '../lib/cn'

type HBadgeProps = ComponentProps<'span'> & { tone?: 'neutral' | 'info' | 'success' | 'warning' }

export function HBadge({ tone = 'neutral', className, ...props }: HBadgeProps) {
  return <span className={cn('h-badge', `h-badge--${tone}`, className)} {...props} />
}
