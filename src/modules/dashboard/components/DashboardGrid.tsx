import { useRef, type ReactNode } from 'react'
import { DragDropProvider, DragOverlay, PointerSensor, KeyboardSensor } from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'
import { PointerActivationConstraints } from '@dnd-kit/dom'
import { GripVertical, MoveDiagonal2, Settings2, X } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { moveWidget, placeWidgets, resizeWidget, widgetCatalog, type DashboardWidget, type WidgetType } from '../schemas/layouts'

const sensors = [PointerSensor.configure({ activationConstraints: [new PointerActivationConstraints.Distance({ value: 5 })] }), KeyboardSensor]
type Props = { widgets: DashboardWidget[]; editing: boolean; onChange: (widgets: DashboardWidget[]) => void; onConfigure: (type: WidgetType) => void; renderWidget: (widget: DashboardWidget) => ReactNode }
export function DashboardGrid({ widgets, editing, onChange, onConfigure, renderWidget }: Props) {
  // Register sortable elements only during editing: the DnD accessibility plugin
  // otherwise leaves disabled activator attributes on the cards themselves.
  if (!editing) return <div className="dashboard-widget-grid" data-editing={false} aria-label="Widgets du dashboard">{placeWidgets(widgets).map((widget) => <div key={widget.type} className="dashboard-widget" data-kind={widget.type} style={{ gridColumn: `${widget.x + 1} / span ${widget.width}`, gridRow: `${widget.y + 1} / span ${widget.height}` }}><div className="dashboard-widget-content">{renderWidget(widget)}</div></div>)}</div>
  return <DragDropProvider sensors={sensors} onDragEnd={(event) => {
    const source = event.operation.source
    if (editing && !event.canceled && source && isSortable(source)) onChange(moveWidget(widgets, widgets.findIndex((widget) => widget.type === source.id), source.index))
  }}><div className="dashboard-widget-grid" data-editing={editing} aria-label="Widgets du dashboard">{placeWidgets(widgets).map((widget, index) => <WidgetTile key={widget.type} widget={widget} index={index} editing={editing} onResize={(next) => onChange(widgets.map((item) => item.type === next.type ? next : item))} onRemove={() => onChange(widgets.filter((item) => item.type !== widget.type))} onConfigure={() => onConfigure(widget.type)}>{renderWidget(widget)}</WidgetTile>)}</div><DragOverlay dropAnimation={null}>{(source) => <div className="dashboard-widget-preview">{widgetCatalog[source.id as WidgetType]?.label}</div>}</DragOverlay></DragDropProvider>
}
function WidgetTile({ widget, index, editing, children, onResize, onRemove, onConfigure }: { widget: DashboardWidget & { x: number; y: number }; index: number; editing: boolean; children: ReactNode; onResize: (widget: DashboardWidget) => void; onRemove: () => void; onConfigure: () => void }) {
  const { ref, handleRef, isDragSource } = useSortable({ id: widget.type, index, group: 'dashboard-widgets', disabled: !editing, transition: null })
  const resize = useRef<{ x: number; y: number; column: number; widget: DashboardWidget } | null>(null)
  const label = widgetCatalog[widget.type].label
  return <div ref={ref} role="group" aria-label={`Widget ${label}`} className="dashboard-widget" data-kind={widget.type} data-dragging={isDragSource} style={{ gridColumn: `${widget.x + 1} / span ${widget.width}`, gridRow: `${widget.y + 1} / span ${widget.height}` }}>
    {editing && <div className="dashboard-widget-tools"><HButton ref={handleRef} size="icon" variant="ghost" aria-label={`Déplacer ${label}`} title="Glisser pour déplacer · Espace puis flèches au clavier"><GripVertical size={14} /></HButton><span>{label}</span><HButton size="icon" variant="ghost" aria-label={`Configurer ${label}`} title="Dimensions du widget" onClick={onConfigure}><Settings2 size={13} /></HButton><HButton size="icon" variant="ghost" aria-label={`Retirer ${label}`} title="Retirer le widget" onClick={onRemove}><X size={13} /></HButton></div>}
    <div className="dashboard-widget-content">{children}</div>
    {editing && <HButton className="dashboard-widget-resize" size="icon" variant="ghost" aria-label={`Redimensionner ${label}`} title="Glisser pour redimensionner · Flèches au clavier" onPointerDown={(event) => {
      if (event.button !== 0) return
      const grid = event.currentTarget.closest('.dashboard-widget-grid')
      if (!grid) return
      event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId)
      resize.current = { x: event.clientX, y: event.clientY, column: (grid.getBoundingClientRect().width + 14) / 12, widget }
    }} onPointerMove={(event) => { const start = resize.current; if (start) onResize(resizeWidget(start.widget, start.widget.width + (event.clientX - start.x) / start.column, start.widget.height + (event.clientY - start.y) / 94)) }} onPointerUp={(event) => { resize.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }} onPointerCancel={() => { resize.current = null }} onLostPointerCapture={() => { resize.current = null }} onKeyDown={(event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
      event.preventDefault()
      const widths = [3, 4, 6, 8, 12], position = widths.indexOf(widget.width)
      onResize(resizeWidget(widget, widths[Math.max(0, Math.min(widths.length - 1, position + (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0)))]!, widget.height + (event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0)))
    }}><MoveDiagonal2 size={14} /></HButton>}
  </div>
}
