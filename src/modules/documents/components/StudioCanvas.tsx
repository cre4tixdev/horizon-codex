import { useEffect, useRef, useState, type PointerEvent, type CSSProperties } from 'react'
import { useDroppable } from '@dnd-kit/react'
import { GripVertical, X, Copy, Minus, Plus, Scan } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { blockLabels, bindingLabels, bodyRows, placedBlock, resizeBlock, type Layout, type Block } from '../schemas/templates'
import { PaperBackground } from './PaperBackground'
import { RichTextPreview } from './RichTextPreview'
import { textStyle } from './textStyle'
type RowRect = { first: string; last: string; top: number; bottom: number; ids: string[] }
type Edge = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
const edges: Edge[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
type Drag = { block: Block; last: Block; px: number; py: number; resizing: Edge | null; moved: boolean; rows: RowRect[] }
export function StudioCanvas({ layout, zoom, selected, onSelect, onChange, onReorder, onRemove, onDuplicate, onMoving, onZoom, disabled }: { disabled: boolean; layout: Layout; zoom: number; selected: string; onSelect: (id: string) => void; onChange: (block: Block) => void; onReorder: (block: Block, target: string, after: boolean) => void; onRemove: (id: string) => void; onDuplicate: (id: string) => void; onMoving: (moving: boolean) => void; onZoom: (zoom: number) => void }) {
  const drag = useRef<Drag | null>(null), viewport = useRef<HTMLDivElement>(null)
  const [delta, setDelta] = useState<{ x: number; y: number } | null>(null), [insertion, setInsertion] = useState<{ id: string; after: boolean } | null>(null), [autoFit, setAutoFit] = useState(false)
  const { ref: dropRef, isDropTarget } = useDroppable({ id: 'studio-canvas', type: 'canvas', accept: 'library-block' })
  const margin = layout.margin * 96 / 25.4, pageWidth = layout.orientation === 'portrait' ? 794 : 1123, pageHeight = layout.orientation === 'portrait' ? 1123 : 794
  useEffect(() => {
    const element = viewport.current; if (!element || !autoFit) return
    const fit = () => onZoom(Math.max(0.25, Math.min(1.5, (element.clientWidth - 48) / pageWidth, (element.clientHeight - 48) / pageHeight)))
    const observer = new ResizeObserver(fit); observer.observe(element); fit()
    return () => observer.disconnect()
  }, [autoFit, pageWidth, pageHeight, onZoom])
  function start(event: PointerEvent<HTMLElement>, block: Block, resizing: Edge | null) {
    if (disabled) return
    event.preventDefault(); event.stopPropagation(); onSelect(block.id)
    const rows = [...(viewport.current?.querySelectorAll<HTMLElement>('.studio-flow-row') || [])].map((row) => ({ first: row.dataset.first!, last: row.dataset.last!, ids: [...row.querySelectorAll<HTMLElement>('.studio-block')].map((item) => item.dataset.blockId!), top: row.getBoundingClientRect().top, bottom: row.getBoundingClientRect().bottom }))
    const image = event.currentTarget.closest('.studio-block')?.querySelector('img')
    const source = block.kind === 'image' && !block.imageRatio && image?.naturalWidth && image.naturalHeight ? { ...block, imageRatio: image.naturalWidth / image.naturalHeight } : block
    drag.current = { block: source, last: source, px: event.clientX, py: event.clientY, resizing, moved: false, rows }
    event.currentTarget.setPointerCapture(event.pointerId); onMoving(true)
  }
  function targetRow(current: Drag, y: number) {
    const origin = current.rows.find((row) => row.ids.includes(current.block.id))
    if (!origin || y >= origin.top && y <= origin.bottom) return null
    const others = current.rows.filter((row) => !row.ids.includes(current.block.id))
    const row = others.toSorted((a, b) => Math.abs(y - (a.top + a.bottom) / 2) - Math.abs(y - (b.top + b.bottom) / 2))[0]
    return row ? { id: row.first, target: y > (row.top + row.bottom) / 2 ? row.last : row.first, after: y > (row.top + row.bottom) / 2 } : null
  }
  function move(event: PointerEvent<HTMLElement>) {
    const current = drag.current; if (!current) return
    const dx = Math.round((event.clientX - current.px) / zoom), dy = Math.round((event.clientY - current.py) / zoom), maxWidth = Math.floor(pageWidth - margin * 2)
    setDelta({ x: dx, y: dy })
    const fixedHeight = current.block.zone === 'header' ? layout.headerHeight : current.block.zone === 'footer' ? layout.footerHeight : 600
    if (!current.moved && Math.max(Math.abs(dx), Math.abs(dy)) < 2) return
    current.moved = true
    if (current.resizing) {
      const edge = current.resizing, west = edge.includes('w'), north = edge.includes('n'), horizontal = edge !== 'n' && edge !== 's', vertical = edge !== 'e' && edge !== 'w'
      const width = current.block.width + (horizontal ? west ? -dx : dx : 0), height = current.block.height + (vertical ? north ? -dy : dy : 0)
      const axis = !horizontal || vertical && Math.abs(dy) / Math.max(1, current.block.height) > Math.abs(dx) / current.block.width ? 'height' : 'width'
      const resized = resizeBlock(current.block, width, height, west ? current.block.x + current.block.width : maxWidth - current.block.x, Math.min(400, north ? current.block.y + current.block.height : fixedHeight - current.block.y), axis)
      current.last = { ...resized, ...(west ? { anchorX: undefined, x: Math.max(0, current.block.x + current.block.width - resized.width) } : {}), ...(north ? { anchorY: undefined, y: Math.max(0, current.block.y + current.block.height - resized.height) } : {}) }
    } else current.last = { ...current.block, anchorX: undefined, anchorY: undefined, x: Math.max(0, Math.min(maxWidth - current.block.width, current.block.x + dx)), y: Math.max(0, Math.min(200, current.block.zone === 'body' ? 200 : fixedHeight - current.block.height, current.block.y + dy)) }

    onChange(current.last)
    const target = current.block.zone === 'body' && !current.resizing && Math.abs(dy) > 16 ? targetRow(current, event.clientY) : null
    setInsertion(target)
  }
  function end(event: PointerEvent<HTMLElement>) {
    const current = drag.current
    if (current?.moved && !current.resizing) {
      const target = current.block.zone === 'body' && Math.abs(event.clientY - current.py) / zoom > 16 ? targetRow(current, event.clientY) : null
      if (target) onReorder({ ...current.last, y: current.block.y }, target.target, target.after)
      else {
        const right = Math.floor(pageWidth - margin * 2) - current.last.width
        onChange({ ...current.last, ...(current.last.x <= 8 ? { anchorX: 'left' } : right - current.last.x <= 8 ? { anchorX: 'right' } : {}) })
      }
    }
    drag.current = null; onMoving(false); setDelta(null); setInsertion(null)
  }
  const render = (stored: Block) => {
    const block = placedBlock(layout, stored)
    const scaleStyle: CSSProperties & Record<string, number> = { '--studio-tool-scale': 1 / zoom }
    return <div key={block.id} data-block-id={block.id} tabIndex={0} role="button" aria-label={`Sélectionner ${blockLabels[block.kind]}`} aria-pressed={selected === block.id} className="studio-block" data-selected={selected === block.id} style={{ ...scaleStyle, ...textStyle(block.style), width: block.width, minHeight: block.height, ...(block.zone === 'body' ? { gridArea: '1 / 1', marginLeft: block.x, marginTop: block.y } : { position: 'absolute', left: block.x, top: block.y, height: block.height }) }} onPointerDown={(event) => { if (!disabled && !(event.target as HTMLElement).closest('button')) start(event, block, null) }} onPointerMove={move} onPointerUp={end} onPointerCancel={() => { if (drag.current) onChange(drag.current.block); drag.current = null; onMoving(false); setDelta(null); setInsertion(null) }} onClick={() => onSelect(block.id)} onKeyDown={(event) => {
      if (event.target !== event.currentTarget) return
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(block.id) }
      if (event.key === 'Escape') onSelect('')
      if (!disabled && selected === block.id && event.key === 'Delete') { event.preventDefault(); onRemove(block.id) }
      if (!disabled && selected === block.id && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault(); const step = event.shiftKey ? 10 : 1, maxY = block.zone === 'body' ? 200 : (block.zone === 'header' ? layout.headerHeight : layout.footerHeight) - block.height
        onChange({ ...block, anchorX: undefined, anchorY: undefined, x: Math.max(0, Math.min(Math.floor(pageWidth - margin * 2) - block.width, block.x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0))), y: Math.max(0, Math.min(maxY, block.y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0))) })
      }
    }}>
      {block.kind === 'text' ? block.content ? <RichTextPreview content={block.content} headings={layout.headings} /> : block.text : block.kind === 'field' ? <span className="studio-binding">{block.text}{bindingLabels[block.field]}</span> : block.kind === 'image' ? block.image ? <img draggable={false} src={block.image} alt="Logo du modèle" style={{ width: '100%', height: block.height || 60, objectPosition: `${block.style.align} center` }} /> : <span className="studio-placeholder">Logo / image<br />Importez une image dans les propriétés</span> : block.kind === 'table' ? <table className="lines"><colgroup>{block.columns.map((column) => <col key={column.field} style={{ width: `${column.width}%` }} />)}</colgroup><thead><tr>{block.columns.map((column) => <th key={column.field}>{column.label}</th>)}</tr></thead><tbody><tr><td colSpan={block.columns.length} className="studio-placeholder">Lignes du devis · hauteur automatique</td></tr></tbody></table> : block.kind === 'totals' ? <div className="totals">{['Total HT', 'TVA', 'Total TTC'].map((label) => <div key={label}><span>{label}</span><strong>— €</strong></div>)}</div> : block.kind === 'terms' ? <><h3>Conditions de vente</h3><span className="studio-placeholder">Contenu choisi dans le devis</span></> : block.kind === 'pageNumber' ? 'Page 1 / …' : block.kind === 'separator' ? <hr /> : <span className="studio-placeholder">{blockLabels[block.kind]}</span>}
      {!disabled && selected === block.id && <>
        <div className="studio-block-handles"><HButton size="icon" variant="ghost" title="Déplacer · flèches : 1 px, Maj : 10 px" aria-label="Déplacer le bloc" onPointerDown={(event) => start(event, block, null)} onPointerMove={move} onPointerUp={end} onPointerCancel={() => { if (drag.current) onChange(drag.current.block); drag.current = null; onMoving(false); setDelta(null); setInsertion(null) }}><GripVertical size={14} /></HButton><HButton size="icon" variant="ghost" title="Dupliquer" aria-label="Dupliquer ce bloc" disabled={layout.blocks.length >= 80} onClick={(event) => { event.stopPropagation(); onDuplicate(block.id) }}><Copy size={13} /></HButton><HButton size="icon" variant="ghost" title="Supprimer le bloc" aria-label="Retirer ce bloc" onClick={(event) => { event.stopPropagation(); onRemove(block.id) }}><X size={13} /></HButton></div>
        {edges.map((edge) => <button type="button" key={edge} className="studio-resize-dot" data-edge={edge} title="Redimensionner" aria-label={edge === 'se' ? 'Redimensionner le bloc' : `Redimensionner ${edge}`} onPointerDown={(event) => start(event, block, edge)} onPointerMove={move} onPointerUp={end} onPointerCancel={() => { if (drag.current) onChange(drag.current.block); drag.current = null; onMoving(false); setDelta(null) }} />)}
      </>}
    </div>
  }
  return <div className="studio-canvas-shell">
    <div className="studio-canvas-toolbar"><span>A4 · {layout.orientation === 'portrait' ? 'Portrait' : 'Paysage'}</span><div className="studio-zoom" role="group" aria-label="Zoom du studio"><HButton size="icon" variant="ghost" title="Réduire le zoom" aria-label="Réduire le zoom" disabled={zoom <= 0.25} onClick={() => { setAutoFit(false); onZoom(Math.max(0.25, zoom - 0.1)) }}><Minus size={15} /></HButton><output>{Math.round(zoom * 100)} %</output><HButton size="icon" variant="ghost" title="Augmenter le zoom" aria-label="Augmenter le zoom" disabled={zoom >= 1.5} onClick={() => { setAutoFit(false); onZoom(Math.min(1.5, zoom + 0.1)) }}><Plus size={15} /></HButton></div><HButton size="small" variant="ghost" title="Adapter la page à l’écran" aria-label="Adapter la page à l’écran" aria-pressed={autoFit} onClick={() => setAutoFit(true)}><Scan size={14} />Adapter</HButton></div>
    <div ref={(node) => { dropRef(node); viewport.current = node }} className="studio-canvas-scroll" data-drop-target={isDropTarget}>{delta && <output className="studio-drag-delta" aria-live="polite">ΔX {delta.x > 0 ? '+' : ''}{delta.x} px · ΔY {delta.y > 0 ? '+' : ''}{delta.y} px</output>}<div className="studio-page-wrap" style={{ width: pageWidth * zoom }}><div className="studio-page" style={{ width: pageWidth, minHeight: pageHeight, padding: margin, zoom }}><PaperBackground value={layout.background} /><div className="studio-fixed-zone" style={{ height: layout.headerHeight }}><small className="studio-zone-label">En-tête · répété</small>{layout.blocks.filter((block) => block.zone === 'header').map(render)}</div><div className="studio-body-zone">{bodyRows(layout.blocks).map((row) => <div className="studio-flow-row" data-first={row[0]!.id} data-last={row.at(-1)!.id} data-insertion={insertion?.id === row[0]!.id ? insertion.after ? 'after' : 'before' : undefined} key={row[0]!.id} style={{ ...(row.some((block) => block.anchorY === 'bottom') ? { marginTop: 'auto' } : {}) }}>{row.map(render)}</div>)}</div><div className="studio-fixed-zone studio-footer-zone" style={{ height: layout.footerHeight }}><small className="studio-zone-label">Pied de page · répété</small>{layout.blocks.filter((block) => block.zone === 'footer').map(render)}</div></div></div></div>
  </div>
}
