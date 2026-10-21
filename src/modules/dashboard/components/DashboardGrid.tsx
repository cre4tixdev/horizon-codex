import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type PointerEvent } from 'react'
import { Copy, GripVertical, MoveDiagonal2, Settings2, X } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { placeWidgets, positionWidget, resizeWidget, widgetCatalog, type DashboardWidget } from '../schemas/layouts'

type Props = { widgets: DashboardWidget[]; editing: boolean; onChange: (widgets: DashboardWidget[]) => void; onConfigure: (id: string) => void; renderWidget: (widget: DashboardWidget, editing: boolean) => ReactNode }
type Gesture = { mode: 'move' | 'resize'; original: DashboardWidget & { x: number; y: number }; offsetX: number; offsetY: number; pointerX: number; pointerY: number }
export function DashboardGrid({ widgets, editing, onChange, onConfigure, renderWidget }: Props) {
  const grid = useRef<HTMLDivElement>(null), gesture = useRef<Gesture | null>(null)
  const [preview, setPreview] = useState<DashboardWidget | null>(null)
  const previewRef = useRef<DashboardWidget | null>(null)
  const previousRects = useRef(new Map<string, { x: number; y: number }>())
  useLayoutEffect(() => {
    for (const element of grid.current?.querySelectorAll<HTMLElement>('.dashboard-widget') || []) {
      const id = element.dataset.widgetId!, before = previousRects.current.get(id), next = { x: element.offsetLeft, y: element.offsetTop }
      if (before && element.dataset.dragging !== 'true' && (before.x !== next.x || before.y !== next.y) && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        for (const animation of element.getAnimations()) animation.cancel()
        element.animate([{ transform: `translate(${before.x - next.x}px,${before.y - next.y}px)` }, { transform: 'translate(0,0)' }], { duration: 180, easing: 'ease-out' })
      }
      previousRects.current.set(id, next)
    }
  }, [preview, widgets])
  const placed = preview ? positionWidget(widgets, preview) : placeWidgets(widgets)
  function propose(value: DashboardWidget | null) { previewRef.current = value; setPreview(value) }
  function finish(commit: boolean) {
    if (commit && previewRef.current) onChange(positionWidget(widgets, previewRef.current))
    gesture.current = null; propose(null)
  }
  function start(event: PointerEvent<HTMLButtonElement>, widget: DashboardWidget & { x: number; y: number }, mode: Gesture['mode']) {
    if (event.button !== 0 || !grid.current || window.innerWidth <= 1000) return
    event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId)
    const bounds = event.currentTarget.closest('.dashboard-widget')!.getBoundingClientRect()
    gesture.current = { mode, original: widget, offsetX: event.clientX - bounds.left, offsetY: event.clientY - bounds.top, pointerX: event.clientX, pointerY: event.clientY }
    propose(widget)
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const start = gesture.current, bounds = grid.current?.getBoundingClientRect()
    if (!start || !bounds) return
    if (event.clientY > window.innerHeight - 55) window.scrollBy(0, 18)
    else if (event.clientY < 80) window.scrollBy(0, -18)
    const column = (bounds.width + 14) / 12
    if (start.mode === 'resize') propose(resizeWidget(start.original, start.original.width + (event.clientX - start.pointerX) / column, start.original.height + (event.clientY - start.pointerY) / 94))
    else propose({ ...start.original, x: Math.max(0, Math.min(12 - start.original.width, Math.round((event.clientX - bounds.left - start.offsetX) / column))), y: Math.max(0, Math.min(600, Math.round((event.clientY - bounds.top - start.offsetY) / 94))) })
  }
  const handleEvents = { onPointerMove: move, onPointerUp: () => finish(true), onPointerCancel: () => finish(false), onLostPointerCapture: () => { if (gesture.current) finish(false) } }
  return <div ref={grid} className="dashboard-widget-grid" data-editing={editing} aria-label="Widgets du dashboard" onKeyDown={(event) => { if (event.key === 'Escape' && preview) { event.preventDefault(); event.stopPropagation(); finish(false) } }}>
    {placed.map((widget) => {
      const label = widget.config.title || widgetCatalog[widget.type].label, active = preview?.id === widget.id
      return <div key={widget.id} role="group" aria-label={`Widget ${label}`} className="dashboard-widget" data-kind={widget.type} data-widget-id={widget.id} data-dragging={active} data-compact={widget.width <= 3 || widget.height === 1} style={{ gridColumn: `${widget.x + 1} / span ${widget.width}`, gridRow: `${widget.y + 1} / span ${widget.height}` }}>
        {editing && <div className="dashboard-widget-tools" role="group" aria-label={`Actions du widget ${label}`}><HButton size="icon" variant="ghost" aria-label={`Déplacer ${label}`} title="Glisser · Espace puis flèches · Échap pour annuler" aria-pressed={active} onBlur={() => { if (active && !gesture.current) finish(false) }} onPointerDown={(event) => start(event, widget, 'move')} {...handleEvents} onKeyDown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (active) finish(true); else propose(widget) }
          else if (active && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); propose({ ...widget, x: Math.max(0, Math.min(12 - widget.width, widget.x + (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0))), y: Math.max(0, Math.min(600, widget.y + (event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0))) }) }
        }}><GripVertical size={14} /></HButton><HButton size="icon" variant="ghost" aria-label={`Configurer ${label}`} title="Configurer le widget" onClick={() => onConfigure(widget.id)}><Settings2 size={13} /></HButton><HButton size="icon" variant="ghost" aria-label={`Dupliquer ${label}`} title="Dupliquer ce widget" disabled={widgets.length >= 32} onClick={() => onChange(placeWidgets([...widgets, { ...structuredClone(widget), id: crypto.randomUUID() }]))}><Copy size={13} /></HButton><HButton size="icon" variant="ghost" aria-label={`Retirer ${label}`} title="Retirer le widget" onClick={() => onChange(widgets.filter((item) => item.id !== widget.id))}><X size={13} /></HButton></div>}
        <div className="dashboard-widget-content">{<LazyWidget>{renderWidget(widget, editing)}</LazyWidget>}</div>
        {editing && <HButton className="dashboard-widget-resize" size="icon" variant="ghost" aria-label={`Redimensionner ${label}`} title="Glisser ou flèches · Échap pour annuler" onPointerDown={(event) => start(event, widget, 'resize')} {...handleEvents} onKeyDown={(event) => {
          if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
          event.preventDefault(); onChange(positionWidget(widgets, resizeWidget(widget, widget.width + (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0), widget.height + (event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0))))
        }}><MoveDiagonal2 size={14} /></HButton>}
      </div>
    })}
    {preview && <div className="dashboard-widget-destination" role="status" aria-label="Destination du widget" style={{ gridColumn: `${(preview.x ?? 0) + 1} / span ${preview.width}`, gridRow: `${(preview.y ?? 0) + 1} / span ${preview.height}` }}><span>{preview.width}H × {preview.height}V · Colonne {(preview.x ?? 0) + 1}, ligne {(preview.y ?? 0) + 1}</span></div>}
  </div>
}

function LazyWidget({ children }: { children: ReactNode }) {
  const node = useRef<HTMLDivElement>(null), [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) { setVisible(true); observer.disconnect() } }, { rootMargin: '180px' })
    if (node.current) observer.observe(node.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={node} className="dashboard-widget-lazy">{visible ? children : <div className="dashboard-widget-skeleton" aria-label="Widget en attente d’affichage" />}</div>
}
