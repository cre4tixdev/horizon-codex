import { useId, type ReactNode } from 'react'
import { Popover } from 'radix-ui'
import { GripVertical, SlidersHorizontal, RotateCcw, X } from 'lucide-react'
import { HButton } from './HButton'
import { HSortableRows, HSortableRow } from './HSortableRows'

export type TableColumnChoice = { id: string; label: string; visible: boolean; required: boolean }
export function HTableColumns({ columns, onToggle, onMove, onReset, error, busy, canEdit, onRetry, children }: {
  columns: TableColumnChoice[]; onToggle: (id: string) => void; onMove: (from: number, to: number) => void; onReset: () => void; error: string; busy: boolean; canEdit: boolean; onRetry: () => void; children: (trigger: ReactNode) => ReactNode
}) {
  const title = useId()
  return <Popover.Root>{children(<Popover.Trigger asChild><HButton size="icon" variant="ghost" className="h-table-columns-trigger" aria-label="Configurer les colonnes" title="Afficher et organiser les colonnes"><SlidersHorizontal size={14} aria-hidden="true" /></HButton></Popover.Trigger>)}
    <Popover.Portal><Popover.Content className="search-filters-panel h-table-columns-panel" align="end" sticky="always" sideOffset={8} collisionPadding={12} aria-labelledby={title}>
      <header><h2 id={title}>Colonnes du tableau</h2><Popover.Close asChild><HButton size="icon" variant="ghost" aria-label="Fermer les colonnes"><X size={14} /></HButton></Popover.Close></header>
      <p className="contact-muted">Cochez pour afficher. Glissez pour réordonner.</p>
      <HSortableRows ids={columns.map((column) => column.id)} onMove={(from, to) => { if (canEdit) onMove(from, to) }} renderPreview={(index) => <span>{columns[index]?.label}</span>}>
        <table className="h-table-column-choices" aria-label="Affichage et ordre des colonnes"><tbody>{columns.map((column, index) => <HSortableRow key={column.id} id={column.id} index={index} disabled={!canEdit}>{(handle) => <>
          <td><HButton ref={handle} size="icon" variant="ghost" className="h-table-drag-handle" disabled={!canEdit} aria-label={`Déplacer la colonne ${column.label}`} title="Glisser ou utiliser Espace et les flèches"><GripVertical size={13} /></HButton></td>
          <td><label><input type="checkbox" checked={column.visible} disabled={column.required || !canEdit} onChange={() => onToggle(column.id)} /><span>{column.label}</span>{column.required && <small>Obligatoire</small>}</label></td>
        </>}</HSortableRow>)}</tbody></table>
      </HSortableRows>
      {busy && <p role="status" className="contact-muted">Synchronisation des colonnes…</p>}{error && <p role="status" className="field-error">{error}<HButton size="small" variant="ghost" onClick={onRetry} disabled={busy}>Recharger les colonnes</HButton></p>}
      <footer><HButton size="small" variant="ghost" disabled={!canEdit} onClick={onReset}><RotateCcw size={13} />Restaurer par défaut</HButton></footer>
    </Popover.Content></Popover.Portal>
  </Popover.Root>
}
