import { useRef, useState, useEffect, useLayoutEffect, useCallback, type PointerEvent, type KeyboardEvent } from 'react'
import { fitQuoteColumns, resizeQuoteColumn } from '../services/quoteColumns'
import { sessionService } from '../../../core/auth/services/session'
import { quoteColumns, type SalesSettings } from '../schemas/quotes'

export function useQuoteColumns(settings: SalesSettings, columns: ReadonlyArray<(typeof quoteColumns)[number]> = quoteColumns, contentVersion?: unknown) {
  const session = sessionService.getSnapshot()
  const storageKey = `horizon:quote-columns:${session.status === 'authenticated' ? session.user.id : 'anonymous'}`
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || '{}')
      if (stored && typeof stored === 'object' && !Array.isArray(stored)) return Object.fromEntries(Object.entries(stored).filter(([key, value]) => quoteColumns.some(([name]) => name === key) && typeof value === 'number' && Number.isFinite(value) && value >= 36 && value <= 10000))
    } catch (error) { console.error('[sales] Column preferences unavailable', error) }
    return {}
  })
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const containerRef = useCallback((node: HTMLDivElement | null) => { setContainer(node) }, [])
  const [available, setAvailable] = useState(0)
  useEffect(() => { if (!container) return; const observer = new ResizeObserver(() => setAvailable(container.clientWidth)); observer.observe(container); return () => observer.disconnect() }, [container])
  const [contentMinimums, setContentMinimums] = useState<Record<string, number>>({})
  useLayoutEffect(() => {
    if (!container) return
    let cancelled = false
    const measure = () => {
      if (cancelled) return
      const context = document.createElement('canvas').getContext('2d')
      if (!context) return
      const next: Record<string, number> = {}
      const table = container.querySelector('table')
      for (const element of container.querySelectorAll<HTMLInputElement | HTMLElement>('.h-amount-input input, .quote-total-value, .quote-section-amount strong')) {
        const cell = element.closest('td')
        if (!cell) continue
        const index = [...cell.parentElement!.children].slice(0, cell.cellIndex).reduce((sum, sibling) => sum + (sibling as HTMLTableCellElement).colSpan, 0)
        const key = table?.tHead?.rows[0]?.cells[index]?.dataset.columnKey
        if (!key) continue
        const style = getComputedStyle(element), cellStyle = getComputedStyle(cell)
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
        const texts = element instanceof HTMLInputElement ? [element.value, element.dataset.amountDisplay || ''] : [element.textContent || '']
        const digitWidth = Math.max(...[...'0123456789'].map((digit) => context.measureText(digit).width))
        const textWidth = Math.max(...texts.map((text) => context.measureText(text).width + [...text].reduce((sum, character) => sum + (/[0-9]/.test(character) ? digitWidth - context.measureText(character).width : 0), 0)))
        let required = textWidth + parseFloat(cellStyle.paddingLeft) + parseFloat(cellStyle.paddingRight) + 3
        if (element instanceof HTMLInputElement) required += parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth)
        const refresh = cell.querySelector('.quote-cost-refresh')
        if (refresh) required += refresh.getBoundingClientRect().width + 2
        const toggle = cell.querySelector('.quote-section-total-toggle')
        if (toggle) required += toggle.getBoundingClientRect().width + parseFloat(getComputedStyle(toggle.parentElement!).columnGap)
        next[key] = Math.max(next[key] || 0, Math.ceil(required))
      }
      setContentMinimums((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next)
    }
    measure()
    void document.fonts.ready.then(measure)
    return () => { cancelled = true }
  }, [container, contentVersion])
  const fitted = fitQuoteColumns({ ...settings.column_widths, ...widths }, available || Object.values(settings.column_widths).reduce((sum, width) => sum + width, 0), columns, contentMinimums)
  const drag = useRef<{ x: number; key: string; widths: Record<string, number>; latest: Record<string, number> } | null>(null)
  const width = (key: string, fallback: number) => fitted[key] || fallback
  const save = (next: Record<string, number>) => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch (error) { console.error('[sales] Column preferences could not be saved', error) }
  }
  const start = (event: PointerEvent<HTMLButtonElement>, key: string) => {
    if (event.button !== 0) return
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId)
    const headers = event.currentTarget.closest('tr')!.querySelectorAll('th')
    const current = Object.fromEntries(columns.map(([name], index) => [name, headers[index]!.getBoundingClientRect().width]))
    const next = { ...widths, ...current }
    drag.current = { x: event.clientX, key, widths: current, latest: next }
    setWidths(next)
  }
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return
    const { key, x, widths: current } = drag.current
    const next = resizeQuoteColumn(current, key, event.clientX - x, columns, contentMinimums)
    drag.current.latest = { ...drag.current.latest, ...next }
    setWidths(drag.current.latest)
  }
  const end = () => { if (drag.current) { save(drag.current.latest); drag.current = null } }
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>, key: string, actual: number) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    const next = resizeQuoteColumn({ ...fitted, [key]: actual }, key, event.key === 'ArrowRight' ? 10 : -10, columns, contentMinimums)
    const preferences = { ...widths, ...next }
    setWidths(preferences); save(preferences)
  }
  return { containerRef, widths: fitted, width, start, move, end, keyboard }
}
