import { createContext, useContext, useId, type ReactNode } from 'react'
import { DragDropProvider, DragOverlay, PointerSensor, KeyboardSensor } from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'
import { PointerActivationConstraints } from '@dnd-kit/dom'
import { GripVertical } from 'lucide-react'
import { HButton } from './HButton'

const SortableRowsContext = createContext({ group: '', disabled: false })
const sensors = [PointerSensor.configure({ activationConstraints: (event) => event.pointerType === 'touch' ? [new PointerActivationConstraints.Delay({ value: 200, tolerance: 5 })] : [new PointerActivationConstraints.Distance({ value: 5 })] }), KeyboardSensor]
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Shared drag-and-drop for editable rows. The owner persists the resulting order. */
export function HSortableRows({ ids, onMove, disabled = false, renderPreview, children }: { ids: readonly string[]; onMove: (from: number, to: number) => void; disabled?: boolean; renderPreview: (index: number) => ReactNode; children: ReactNode }) {
  const group = useId()
  return <SortableRowsContext.Provider value={{ group, disabled }}><DragDropProvider sensors={sensors} onDragEnd={(event) => {
    const source = event.operation.source
    if (event.canceled || disabled || !source || !isSortable(source)) return
    const from = ids.indexOf(String(source.id)), to = source.index
    if (from >= 0 && to >= 0 && to < ids.length && from !== to) onMove(from, to)
  }}>{children}<DragOverlay className="h-table-drag-preview" dropAnimation={reducedMotion() ? null : { duration: 180, easing: 'ease-out' }}>{(source) => {
    const index = ids.indexOf(String(source.id))
    return index >= 0 ? renderPreview(index) : null
  }}</DragOverlay></DragDropProvider></SortableRowsContext.Provider>
}

export function HSortableRow({ id, index, disabled = false, className, children }: { id: string; index: number; disabled?: boolean; className?: string | undefined; children: (handle: (element: Element | null) => void) => ReactNode }) {
  const context = useContext(SortableRowsContext)
  const { ref, handleRef, isDragSource } = useSortable({ id, index, group: context.group, disabled: disabled || context.disabled, transition: reducedMotion() ? null : { duration: 180, easing: 'ease-out' } })
  return <tr ref={ref} className={className} data-dragging={isDragSource}>{children(handleRef)}</tr>
}

export function HRowDragHandle({ handleRef, index, disabled = false }: { handleRef: (element: Element | null) => void; index: number; disabled?: boolean }) {
  return <HButton ref={handleRef} variant="ghost" size="icon" className="h-table-drag-handle" disabled={disabled} aria-label={`Déplacer ligne ${index + 1}`} title="Glisser pour déplacer la ligne"><GripVertical size={13} /></HButton>
}
