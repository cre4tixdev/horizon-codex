import { useRef, useState } from 'react'
import { DropdownMenu } from 'radix-ui'
import { Archive, Copy, RotateCcw, Trash2, type LucideIcon } from 'lucide-react'
import { HActionMenu } from './HActionMenu'
import { HRecordConfirmation } from './HRecordConfirmation'

export function HRecordActions({ itemName, active, disabled, onArchive, onRestore, onDuplicate, onDelete, archiveDescription, actions = [] }: { itemName: string; active: boolean; disabled: boolean; onArchive?: () => Promise<unknown>; onRestore?: () => void; onDuplicate?: () => void; onDelete?: () => Promise<unknown>; archiveDescription?: string; actions?: { label: string; icon: LucideIcon; onSelect: () => void }[] }) {
  const trigger = useRef<HTMLButtonElement>(null)
  const [confirmation, setConfirmation] = useState<'archive' | 'delete'>()
  const confirmAction = confirmation === 'delete' ? onDelete : onArchive
  return <>
    <HActionMenu triggerRef={trigger} disabled={disabled} onCloseAutoFocus={(event) => { if (confirmation) event.preventDefault() }}>
        {onDuplicate && <DropdownMenu.Item onSelect={onDuplicate}><Copy size={15} />Dupliquer</DropdownMenu.Item>}
        {!active && onRestore && <DropdownMenu.Item onSelect={onRestore}><RotateCcw size={15} />Réactiver</DropdownMenu.Item>}
        {actions.map(({ label, icon: Icon, onSelect }) => <DropdownMenu.Item key={label} onSelect={onSelect}><Icon size={15} />{label}</DropdownMenu.Item>)}
        {(onDelete || onArchive && active) && (onDuplicate || actions.length > 0 || !active && onRestore) && <DropdownMenu.Separator className="user-menu-separator" />}
        {onArchive && active && <DropdownMenu.Item className="record-action-archive" onSelect={() => setConfirmation('archive')}><Archive size={15} />Archiver</DropdownMenu.Item>}
        {onDelete && <DropdownMenu.Item className="record-action-delete" onSelect={() => setConfirmation('delete')}><Trash2 size={15} />Supprimer</DropdownMenu.Item>}
    </HActionMenu>
    {confirmation && confirmAction && <HRecordConfirmation action={confirmation} itemName={itemName} open onOpenChange={(open) => { if (!open) setConfirmation(undefined) }} onConfirm={confirmAction} onCloseFocus={() => trigger.current?.focus()} {...(confirmation === 'archive' && archiveDescription ? { description: archiveDescription } : {})} />}
  </>
}
