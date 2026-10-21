import type { ComponentProps, ReactNode, Ref } from 'react'
import { DropdownMenu } from 'radix-ui'
import { Settings } from 'lucide-react'
import { HButton } from './HButton'

/** Shared gear menu for record and workspace actions. */
export function HActionMenu({ label = 'Actions de la fiche', menuLabel = label, disabled = false, triggerRef, open, onOpenChange, onCloseAutoFocus, children }: { label?: string; menuLabel?: string; disabled?: boolean; triggerRef?: Ref<HTMLButtonElement>; open?: boolean; onOpenChange?: (open: boolean) => void; onCloseAutoFocus?: ComponentProps<typeof DropdownMenu.Content>['onCloseAutoFocus']; children: ReactNode }) {
  return <DropdownMenu.Root {...(open === undefined ? {} : { open })} {...(onOpenChange ? { onOpenChange } : {})}>
    <DropdownMenu.Trigger asChild><HButton ref={triggerRef} size="icon" disabled={disabled} aria-label={label} title={label}><Settings size={17} /></HButton></DropdownMenu.Trigger>
    <DropdownMenu.Portal><DropdownMenu.Content className="user-menu-content record-actions-menu" aria-label={menuLabel} aria-labelledby={undefined} align="end" sideOffset={6} collisionPadding={12} onCloseAutoFocus={onCloseAutoFocus}>{children}</DropdownMenu.Content></DropdownMenu.Portal>
  </DropdownMenu.Root>
}
