import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react'
import { fitColumnWidths, resizeColumnWidths, type ColumnSize } from './columnSizing'

type Drag = { x: number; id: string; baseline: Record<string, number>; latest: Record<string, number>; columns: ColumnSize[] }
/** Shared geometry for consultation tables. Auto layout remains the default until a manual resize. */
export function useResizableTableColumns({ enabled, identity, ids, saved, version, onCommit }: { enabled: boolean; identity: string; ids: string[]; saved: Record<string, number> | undefined; version: unknown; onCommit: (widths: Record<string, number>) => void }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const ref = useCallback((element: HTMLDivElement | null) => setContainer(element), [])
  const [geometry, setGeometry] = useState<{ available: number; columns: ColumnSize[] }>({ available: 0, columns: [] })
  const [draft, setDraft] = useState<Record<string, number>>()
  const drag = useRef<Drag | null>(null), signature = JSON.stringify(ids)
  useEffect(() => {
    if (!container || !enabled) return
    const observer = new ResizeObserver(() => setGeometry((current) => current.available === container.clientWidth - 2 ? current : { ...current, available: container.clientWidth - 2 }))
    observer.observe(container)
    return () => observer.disconnect()
  }, [container, enabled])
  useLayoutEffect(() => {
    if (!container || !enabled) return
    let cancelled = false
    const measure = () => {
      if (cancelled) return
      const headers = [...container.querySelectorAll<HTMLTableCellElement>('thead th')], canvas = document.createElement('canvas').getContext('2d')
      if (!headers.length || !canvas) return
      const columns = headers.map((header): ColumnSize => {
        const id = header.dataset.columnId!, style = getComputedStyle(header)
        const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + 2
        canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
        const label = header.querySelector('.h-table-sort-label') || header
        const longest = Math.max(0, ...(label.textContent || '').split(/\s+/).map((word) => canvas.measureText(word).width))
        const controls = (header.querySelector('.h-table-sort-button svg') ? 18 : 0) + (header.querySelector('.h-table-columns-trigger') ? 30 : 0)
        let minimum = Math.max(64, id === identity ? 140 : 0, Math.ceil(longest + padding + controls))
        const index = header.cellIndex
        for (const row of container.querySelectorAll<HTMLTableRowElement>('tbody tr')) {
          const cell = row.cells[index]
          if (!cell || getComputedStyle(cell).whiteSpace !== 'nowrap') continue
          const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT)
          let width = 0
          while (walker.nextNode()) { const range = document.createRange(); range.selectNodeContents(walker.currentNode); width += range.getBoundingClientRect().width }
          minimum = Math.max(minimum, Math.ceil(width + padding + 3))
        }
        return { id, minimum, fallback: Math.max(minimum, header.getBoundingClientRect().width), monetary: header.dataset.align === 'right' }
      })
      const next = { available: container.clientWidth - 2, columns }
      // Fallbacks describe the initial automatic layout. A manual resize must not remeasure them on every pointer move.
      setGeometry((current) => JSON.stringify(current) === JSON.stringify(next) ? current : next)
    }
    measure(); void document.fonts.ready.then(measure)
    return () => { cancelled = true }
  }, [container, enabled, identity, signature, version])
  const valid = geometry.columns.length === ids.length && geometry.columns.every((column, index) => column.id === ids[index])
  const input = draft || saved
  const manual = Boolean(enabled && input && Object.keys(input).length && valid)
  const widths = manual ? fitColumnWidths(input!, geometry.available, geometry.columns) : {}
  const actual = (button: HTMLButtonElement) => Object.fromEntries([...button.closest('tr')!.querySelectorAll<HTMLTableCellElement>('th')].map((header) => [header.dataset.columnId!, header.getBoundingClientRect().width]))
  const start = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    if (!enabled || !valid || event.button !== 0) return
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId)
    const baseline = actual(event.currentTarget)
    drag.current = { x: event.clientX, id, baseline, latest: baseline, columns: geometry.columns }
    setDraft(baseline)
  }
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current
    if (!current) return
    current.latest = resizeColumnWidths(current.baseline, current.id, event.clientX - current.x, current.columns)
    setDraft(current.latest)
  }
  const end = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return
    move(event)
    const { latest, baseline } = drag.current
    drag.current = null
    if (Object.keys(latest).some((id) => Math.abs(latest[id]! - baseline[id]!) > 0.01)) onCommit(latest)
    setDraft(undefined)
  }
  const cancel = () => { drag.current = null; setDraft(undefined) }
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    if (!enabled || !valid || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    onCommit(resizeColumnWidths(actual(event.currentTarget), id, event.key === 'ArrowRight' ? 10 : -10, geometry.columns))
  }
  return { ref, widths, manual, total: Object.values(widths).reduce((sum, width) => sum + width, 0), start, move, end, cancel, keyboard }
}
