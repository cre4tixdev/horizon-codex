import { useRef, useState, useEffect, useCallback, type PointerEvent, type KeyboardEvent } from 'react'
import { fitQuoteColumns, resizeQuoteColumn } from '../services/quoteColumns'
import { sessionService } from '../../../core/auth/services/session'
import { quoteColumns, type SalesSettings } from '../schemas/quotes'

export function useQuoteColumns(settings: SalesSettings) {
  const session = sessionService.getSnapshot()
  const storageKey = `horizon:quote-columns:${session.status === 'authenticated' ? session.user.id : 'anonymous'}`
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || '{}')
      if (stored && typeof stored === 'object' && !Array.isArray(stored)) return Object.fromEntries(Object.entries(stored).filter(([key, value]) => quoteColumns.some(([name]) => name === key) && typeof value === 'number' && Number.isFinite(value) && value >= 36 && value <= 10000))
    } catch (error) { console.error('[sales] Column preferences unavailable', error) }
    return {}
  })
  const container = useRef<HTMLDivElement>(null)
  const containerRef = useCallback((node: HTMLDivElement | null) => { container.current = node }, [])
  const [available, setAvailable] = useState(0)
  useEffect(() => { const node = container.current; if (!node) return; const observer = new ResizeObserver(() => setAvailable(node.clientWidth)); observer.observe(node); return () => observer.disconnect() }, [])
  const fitted = fitQuoteColumns({ ...settings.column_widths, ...widths }, available || Object.values(settings.column_widths).reduce((sum, width) => sum + width, 0))
  const drag = useRef<{ x: number; key: string; widths: Record<string, number> } | null>(null)
  const width = (key: string, fallback: number) => fitted[key] || fallback
  const save = (next: Record<string, number>) => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch (error) { console.error('[sales] Column preferences could not be saved', error) }
  }
  const start = (event: PointerEvent<HTMLButtonElement>, key: string) => {
    if (event.button !== 0) return
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId)
    const headers = event.currentTarget.closest('tr')!.querySelectorAll('th')
    const current = Object.fromEntries(quoteColumns.map(([name], index) => [name, headers[index]!.getBoundingClientRect().width]))
    drag.current = { x: event.clientX, key, widths: current }
    setWidths(current)
  }
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return
    const { key, x, widths: current } = drag.current
    const next = resizeQuoteColumn(current, key, event.clientX - x)
    setWidths(next)
  }
  const end = () => { if (drag.current) { save(widths); drag.current = null } }
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>, key: string, actual: number) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    const next = resizeQuoteColumn({ ...fitted, [key]: actual }, key, event.key === 'ArrowRight' ? 10 : -10)
    setWidths(next); save(next)
  }
  return { containerRef, widths: fitted, width, start, move, end, keyboard }
}
