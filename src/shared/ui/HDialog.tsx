import type { ComponentProps, ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { HButton } from './HButton'

type HDialogProps = {
  className?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  titleBadge?: ReactNode
  description: string
  actions?: ReactNode
  trigger?: ReactNode
  children: ReactNode
  onCloseAutoFocus?: ComponentProps<typeof Dialog.Content>['onCloseAutoFocus']
  onOpenAutoFocus?: ComponentProps<typeof Dialog.Content>['onOpenAutoFocus']
}

export function HDialog({ open, onOpenChange, title, titleBadge, description, actions, trigger, children, onOpenAutoFocus, onCloseAutoFocus, className }: HDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className={`dialog-content${className ? ` ${className}` : ''}`} onOpenAutoFocus={onOpenAutoFocus} onCloseAutoFocus={onCloseAutoFocus}>
          <div className="dialog-heading">
            <div><div className="dialog-title-row"><Dialog.Title>{title}</Dialog.Title>{titleBadge}</div><Dialog.Description>{description}</Dialog.Description></div>
            <div className="dialog-heading-actions">{actions}<Dialog.Close asChild><HButton variant="ghost" size="icon" aria-label="Fermer"><X size={17} /></HButton></Dialog.Close></div>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
