import { useRef, useState } from 'react'
import { Archive } from 'lucide-react'
import { HButton } from './HButton'
import { HRecordConfirmation } from './HRecordConfirmation'

export function HArchiveButton({ itemName, disabled, onConfirm }: { itemName: string; disabled?: boolean; onConfirm: () => Promise<unknown> }) {
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  return <><HButton ref={trigger} variant="ghost" disabled={disabled} onClick={() => setOpen(true)}><Archive size={14} />Archiver</HButton>{open && <HRecordConfirmation action="archive" itemName={itemName} open={open} onOpenChange={setOpen} onConfirm={onConfirm} onCloseFocus={() => trigger.current?.focus()} />}</>
}
