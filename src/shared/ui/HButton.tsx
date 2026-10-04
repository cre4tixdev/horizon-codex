import type { ComponentProps } from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../lib/cn'

const buttonStyles = cva('h-button', {
  variants: {
    variant: { primary: 'h-button--primary', secondary: 'h-button--secondary', ghost: 'h-button--ghost' },
    size: { default: '', icon: 'h-button--icon', small: 'h-button--small' },
  },
  defaultVariants: { variant: 'secondary', size: 'default' },
})

type HButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonStyles> & { asChild?: boolean }

export function HButton({ asChild = false, variant, size, className, type = 'button', ...props }: HButtonProps) {
  const Component = asChild ? Slot.Root : 'button'
  return <Component {...(!asChild ? { type } : {})} className={cn(buttonStyles({ variant, size }), className)} {...props} />
}
