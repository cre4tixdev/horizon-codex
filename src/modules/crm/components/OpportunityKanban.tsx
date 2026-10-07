import type { CSSProperties } from 'react'
import type { Reference } from '../../settings/types/references'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { DragDropProvider, DragOverlay, useDroppable, useDragOperation, PointerSensor, KeyboardSensor, type DragOverEvent, type DragEndEvent } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { move } from '@dnd-kit/helpers'
import { Accessibility, PointerActivationConstraints } from '@dnd-kit/dom'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { OpportunityCard } from './OpportunityCard'
import { formatAmount, type Opportunity, type Stage, type StageChange } from '../schemas/opportunities'
import type { StageTotal } from '../stageTotals'

const sensors = [PointerSensor.configure({
  activationConstraints: (event) => event.pointerType === 'touch' ? [new PointerActivationConstraints.Delay({ value: 250, tolerance: 5 })] : [new PointerActivationConstraints.Distance({ value: 6 })],
  preventActivation: (event) => event.target instanceof Element && Boolean(event.target.closest('button, input, textarea, select, [role=menuitem]')),
}), KeyboardSensor]

const motionQuery = '(prefers-reduced-motion: reduce)'
function subscribeMotion(callback: () => void) {
  const media = matchMedia(motionQuery)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}
function reducedMotion() { return matchMedia(motionQuery).matches }

function InteractionState({ onChange }: { onChange: (busy: boolean) => void }) {
  const { source } = useDragOperation()
  useEffect(() => {
    onChange(Boolean(source))
    return () => onChange(false)
  }, [source, onChange])
  return null
}

type CardProps = Parameters<typeof OpportunityCard>[0]
function SortableCard({ index, reduced, ...props }: CardProps & { index: number; reduced: boolean; stages: Stage[]; editable: boolean }) {
  const { ref, isDragSource } = useSortable({ id: props.record.id, group: props.record.stage, index, type: 'opportunity', accept: 'opportunity', disabled: { draggable: !props.editable, droppable: !props.editable || !props.stages.some((stage) => stage.id === props.record.stage && stage.active) }, transition: reduced ? null : { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' } })
  return <div ref={ref} aria-label={`Glisser l’opportunité ${props.record.opportunity_number}`} className="crm-sortable-card" data-dragging={isDragSource}><OpportunityCard {...props} /></div>
}
function Column({ stage, folded, amount, count, ready, editable, busy, onToggle, onExpand, empty, onConfigure, children }: { stage: Stage; folded: boolean; amount: string; count: number; ready: boolean; editable: boolean; busy: boolean; onToggle: () => void; onExpand: () => void; empty: boolean; onConfigure?: (() => void) | undefined; children: React.ReactNode }) {
  // Target only the column under the pointer; the floating card must not shadow empty rails.
  // dnd-kit priorities: Highest = 4, Low = 1; PointerIntersection = 2.
  const { ref, isDropTarget } = useDroppable({ id: stage.id, type: 'stage', accept: 'opportunity', collisionDetector: ({ droppable, dragOperation }) => droppable.shape?.containsPoint(dragOperation.position.current) ? { id: droppable.id, value: 1, type: 2, priority: 3 } : null, collisionPriority: empty || folded ? 4 : 1, disabled: !editable || !stage.active })
  useEffect(() => {
    if (!isDropTarget || !folded || !editable) return
    const timer = setTimeout(onExpand, 300)
    return () => clearTimeout(timer)
  }, [isDropTarget, folded, editable, onExpand])
  return <section ref={ref} className="crm-kanban-column h-tone" data-tone={stage.tone} style={stage.color ? { '--tag-color': stage.color } as CSSProperties : undefined} data-stage-code={stage.code} data-collapsed={folded} data-drop-target={isDropTarget} aria-label={`Étape ${stage.label}`}>
    <header><div className="crm-column-heading"><h2>{onConfigure ? <button type="button" className="crm-column-configure" disabled={busy} title="Configurer cette étape" aria-label={`Configurer ${stage.label}`} onClick={onConfigure}>{stage.label}</button> : stage.label}</h2><span className="crm-stage-count">{ready ? count : '—'}</span></div><HButton variant="ghost" size="icon" disabled={busy} aria-label={`${folded ? 'Déplier' : 'Replier'} ${stage.label}`} title={folded ? 'Déplier la colonne' : 'Replier la colonne'} aria-expanded={!folded} onClick={onToggle}>{folded ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}</HButton><strong className="crm-column-total" title={`${amount} — toutes les opportunités filtrées`}>{amount}</strong></header>
    {!folded && <div className="crm-kanban-cards">{children}</div>}
  </section>
}

export function OpportunityKanban({ rows, stages, totals, summaryReady, editable, drafts, listQuery, collapsed, onToggleCollapsed, onMove, onBusyChange, busy, onExpandCollapsed, onConfigure, markets }: { rows: Opportunity[]; markets: Reference[]; stages: Stage[]; totals: StageTotal[]; summaryReady: boolean; editable: boolean; drafts: Record<string, StageChange>; listQuery: string; collapsed: Set<string>; onToggleCollapsed: (id: string) => void; onMove: (id: string, stage: string) => void; onBusyChange: (busy: boolean) => void; busy: boolean; onExpandCollapsed: (id: string) => void; onConfigure?: ((id: string) => void) | undefined }) {
  const reduced = useSyncExternalStore(subscribeMotion, reducedMotion, () => false)
  // Ordering is a local visual preference; the configured business sort applies on refresh.
  const [order, setOrder] = useState<string[]>([])
  const [preview, setPreview] = useState<Record<string, string[]> | null>(null)
  const groups = Object.fromEntries(stages.map((stage) => [stage.id, rows.filter((row) => row.stage === stage.id).sort((a, b) => {
    const ai = order.indexOf(a.id), bi = order.indexOf(b.id)
    return (ai < 0 ? order.length : ai) - (bi < 0 ? order.length : bi)
  }).map((row) => row.id)]))
  const displayed = preview || groups
  return <DragDropProvider sensors={sensors} plugins={(defaults) => defaults.map((plugin) => plugin === Accessibility ? Accessibility.configure({
    screenReaderInstructions: { draggable: 'Appuyez sur Espace pour saisir la carte, utilisez les flèches pour la déplacer, Espace pour déposer et Échap pour annuler.' },
    announcements: {
      dragstart: () => 'Carte saisie.',
      dragover: ({ operation }: DragOverEvent) => {
        const id = String(operation.target?.id || '')
        const stage = stages.find((item) => item.id === id) || stages.find((item) => item.id === rows.find((row) => row.id === id)?.stage)
        return stage ? `Destination : ${stage.label}.` : 'Aucune destination.'
      },
      dragend: ({ canceled }: DragEndEvent) => canceled ? 'Déplacement annulé.' : 'Carte déposée. Le changement d’étape est enregistré automatiquement.',
    },
  }) : plugin)} onDragStart={() => setPreview(groups)} onDragOver={(event) => {
    if (!editable || collapsed.has(String(event.operation.target?.id || ''))) return
    setPreview((current) => move(current || groups, event))
  }} onDragEnd={(event) => {
    if (!event.canceled && editable && event.operation.source && event.operation.target) {
      const next = collapsed.has(String(event.operation.target.id)) ? move(preview || groups, event) : preview || groups
      const id = String(event.operation.source.id)
      const destination = Object.entries(next).find(([, ids]) => ids.includes(id))?.[0]
      if (destination && stages.some((stage) => stage.id === destination && stage.active)) {
        setOrder(Object.values(next).flat())
        onMove(id, destination)
      }
    }
    setPreview(null)
  }}>
    <InteractionState onChange={onBusyChange} />
    <div className="crm-kanban-scroll"><div className="crm-kanban" style={{ gridTemplateColumns: stages.map((stage) => collapsed.has(stage.id) ? '52px' : 'minmax(280px, 1fr)').join(' ') }}>{stages.map((stage) => {
      const columnTotals = totals.filter((total) => total.stage === stage.id)
      const count = columnTotals.reduce((sum, total) => sum + total.count, 0)
      const amount = summaryReady ? columnTotals.map((total) => formatAmount(total.amount, total.currency)).join(' · ') || formatAmount(0, 'EUR') : '—'
      const ids = displayed[stage.id] || []
      return <Column key={stage.id} stage={stage} folded={collapsed.has(stage.id)} amount={amount} count={count} ready={summaryReady} editable={editable} busy={busy} empty={!ids.length} onConfigure={onConfigure ? () => onConfigure(stage.id) : undefined} onToggle={() => onToggleCollapsed(stage.id)} onExpand={() => onExpandCollapsed(stage.id)}>{ids.map((id, index) => {
        const record = rows.find((row) => row.id === id)
        return record && <SortableCard key={id} record={{ ...record, stage: stage.id }} markets={markets} index={index} reduced={reduced} stages={stages} editable={editable && record.active} pending={Boolean(drafts[id])} listQuery={listQuery} />
      })}{!ids.length && <p className="crm-column-empty">Aucune opportunité</p>}</Column>
    })}</div></div>
    <DragOverlay className="crm-drag-overlay" dropAnimation={reduced ? null : { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' }}>{(source) => {
      const record = rows.find((row) => row.id === source.id)
      return record ? <OpportunityCard record={record} markets={markets} pending={Boolean(drafts[record.id])} listQuery={listQuery} /> : null
    }}</DragOverlay>
  </DragDropProvider>
}
