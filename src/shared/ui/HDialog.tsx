import type { ComponentProps, ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { HButton } from './HButton'

type HDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  trigger?: ReactNode
  children: ReactNode
  onOpenAutoFocus?: ComponentProps<typeof Dialog.Content>['onOpenAutoFocus']
}

export function HDialog({ open, onOpenChange, title, description, trigger, children, onOpenAutoFocus }: HDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" onOpenAutoFocus={onOpenAutoFocus}>
          <div className="dialog-heading">
            <div><Dialog.Title>{title}</Dialog.Title><Dialog.Description>{description}</Dialog.Description></div>
            <Dialog.Close asChild><HButton variant="ghost" size="icon" aria-label="Fermer"><X size={17} /></HButton></Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
