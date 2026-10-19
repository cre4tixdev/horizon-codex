import { useLayoutEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { automaticPageSize, selectedPageSize, type ListSizeMode } from '../ui/listPageSize'

export type ListPageSizeControl = { value: string; automatic: number; onChange: (value: string) => void }
export function useListPageSize(mode: ListSizeMode = 'list', enabled = true, initialSize = 25) {
  const [params, setParams] = useSearchParams()
  const [root, onMount] = useState<HTMLDivElement | null>(null)
  const manual = selectedPageSize(params.get('perPage'))
  const [size, setSize] = useState(initialSize)
  const automatic = useRef(initialSize)
  const previousMode = useRef(mode)
  const setParamsRef = useRef(setParams)
  useLayoutEffect(() => { setParamsRef.current = setParams }, [setParams])
  useLayoutEffect(() => {
    if (!root || !enabled || manual) return
    if (previousMode.current !== mode) {
      previousMode.current = mode
      setParamsRef.current((current) => { const next = new URLSearchParams(current); next.delete('page'); return next }, { replace: true })
    }
    let measured = false, maximumRow = 0, width = root.clientWidth
    let timer: ReturnType<typeof setTimeout>
    const measure = () => {
      const cards = mode === 'cards' ? [...root.querySelectorAll<HTMLElement>('.contact-card-grid, .catalog-card-grid')].find((node) => node.getBoundingClientRect().height > 0) : null
      const table = mode === 'list' ? [...root.querySelectorAll<HTMLTableElement>('.h-data-table')].find((node) => node.getBoundingClientRect().height > 0) : null
      if (!cards && !table) return
      let top: number, rowHeight: number, columns = 1, gap = 0
      if (cards) {
        const card = cards.firstElementChild
        if (!card) return
        top = cards.getBoundingClientRect().top + window.scrollY
        rowHeight = card.getBoundingClientRect().height
        const style = getComputedStyle(cards)
        columns = style.gridTemplateColumns.split(/\s+/).length
        gap = parseFloat(style.rowGap) || 0
      } else if (table) {
        const rows = [...table.querySelectorAll('tbody > tr')].slice(0, 10)
        if (!rows.length) return
        top = table.getBoundingClientRect().top + window.scrollY + (table.tHead?.getBoundingClientRect().height || 0)
        if (width !== root.clientWidth) { maximumRow = 0; width = root.clientWidth }
        maximumRow = Math.max(maximumRow, ...rows.map((row) => row.getBoundingClientRect().height))
        rowHeight = maximumRow
      } else return
      if (rowHeight <= 0) return
      const next = automaticPageSize({ height: window.innerHeight, top, rowHeight, columns, gap, mode })
      if (automatic.current !== next) {
        automatic.current = next
        setSize(next)
        if (measured) setParamsRef.current((current) => { if (!current.has('page')) return current; const updated = new URLSearchParams(current); updated.delete('page'); return updated }, { replace: true })
      }
      measured = true
    }
    const schedule = () => { clearTimeout(timer); timer = setTimeout(measure, 180) }
    const observer = new ResizeObserver(schedule)
    observer.observe(root)
    window.addEventListener('resize', schedule)
    schedule()
    return () => { clearTimeout(timer); observer.disconnect(); window.removeEventListener('resize', schedule) }
  }, [mode, enabled, manual, root])
  const perPage = manual || size
  const control: ListPageSizeControl = { value: manual ? String(manual) : 'auto', automatic: size, onChange: (value) => setParams((current) => { const next = new URLSearchParams(current); if (selectedPageSize(value)) next.set('perPage', value); else next.delete('perPage'); next.delete('page'); return next }, { replace: true }) }
  return { onMount, perPage, control }
}
