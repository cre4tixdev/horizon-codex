import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent } from 'react'
type Widths = { left: number; right: number }
const defaults: Widths = { left: 210, right: 340 }
const key = 'horizon.documents.studio-panels'
function read(): Widths {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) || 'null')
    if (saved && typeof saved === 'object' && 'left' in saved && 'right' in saved && typeof saved.left === 'number' && typeof saved.right === 'number' && Number.isFinite(saved.left) && Number.isFinite(saved.right)) return { left: Math.max(160, Math.min(360, saved.left)), right: Math.max(280, Math.min(520, saved.right)) }
  } catch { /* A presentation preference must never prevent opening the editor. */ }
  return defaults
}
export function StudioWorkspace({ library, properties, children }: { library: ReactNode; properties: ReactNode; children: ReactNode }) {
  const [widths, setWidths] = useState(read), current = useRef(widths), workspace = useRef<HTMLDivElement>(null)
  const drag = useRef<{ side: keyof Widths; x: number; width: number; initial: Widths } | null>(null)
  useEffect(() => {
    const element = workspace.current; if (!element) return
    const fit = () => {
      if (window.innerWidth <= 1000) return
      const right = Math.min(current.current.right, Math.max(280, element.clientWidth - 456))
      const left = Math.min(current.current.left, Math.max(160, element.clientWidth - right - 296))
      if (left !== current.current.left || right !== current.current.right) { current.current = { left, right }; setWidths(current.current) }
    }
    const observer = new ResizeObserver(fit); observer.observe(element); return () => observer.disconnect()
  }, [])
  function change(side: keyof Widths, width: number) {
    const other = side === 'left' ? 'right' : 'left', minimum = side === 'left' ? 160 : 280
    const maximum = Math.max(minimum, Math.min(side === 'left' ? 360 : 520, (workspace.current?.clientWidth || 1200) - current.current[other] - 296))
    current.current = { ...current.current, [side]: Math.round(Math.max(minimum, Math.min(maximum, width))) }; setWidths(current.current)
  }
  function persist() { try { localStorage.setItem(key, JSON.stringify(current.current)) } catch { console.warn('[documents] Panel widths retained for this session only.') } }
  function move(event: PointerEvent) { const source = drag.current; if (source) change(source.side, source.width + (event.clientX - source.x) * (source.side === 'left' ? 1 : -1)) }
  const separator = (side: keyof Widths) => <div role="separator" tabIndex={0} aria-orientation="vertical" aria-label={side === 'left' ? 'Largeur de la bibliothèque' : 'Largeur des propriétés'} aria-valuemin={side === 'left' ? 160 : 280} aria-valuemax={side === 'left' ? 360 : 520} aria-valuenow={widths[side]} title="Glisser pour ajuster · double-clic pour réinitialiser" className="studio-panel-resizer" onPointerDown={(event) => { if (event.button !== 0) return; event.preventDefault(); drag.current = { side, x: event.clientX, width: current.current[side], initial: current.current }; event.currentTarget.setPointerCapture(event.pointerId) }} onPointerMove={move} onPointerUp={() => { drag.current = null; persist() }} onPointerCancel={() => { if (drag.current) { current.current = drag.current.initial; setWidths(current.current) }; drag.current = null }} onKeyDown={(event) => { if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return; event.preventDefault(); change(side, event.key === 'Home' ? defaults[side] : current.current[side] + (event.key === 'ArrowRight' ? 1 : -1) * (side === 'left' ? 1 : -1) * (event.shiftKey ? 30 : 10)); persist() }} onDoubleClick={() => { change(side, defaults[side]); persist() }}><span /></div>
  return <div ref={workspace} className="studio-workspace studio-workspace--resizable" style={{ '--studio-library-width': `${widths.left}px`, '--studio-properties-width': `${widths.right}px` } as CSSProperties}>{library}{separator('left')}{children}{separator('right')}{properties}</div>
}
