import type { ReactNode } from 'react'
import { Copy } from 'lucide-react'
import { HDialog } from './HDialog'
import { HDialogFooter } from './HDialogFooter'
import { HButton } from './HButton'

export function HRecordDuplication({ title, itemName, children, onClose, onDuplicate }: { title: string; itemName: string; children?: ReactNode; onClose: () => void; onDuplicate: () => void }) {
  return <HDialog open className="record-duplicate-dialog" title={title} description={`Une nouvelle fiche sera préparée à partir de « ${itemName} ». Vous pourrez la modifier avant de l’enregistrer.`} onOpenChange={(open) => { if (!open) onClose() }}>
    <div className="dialog-form">{children}<HDialogFooter><HButton variant="primary" onClick={onDuplicate}><Copy size={14} />Dupliquer</HButton></HDialogFooter></div>
  </HDialog>
}
