import { useCallback, useEffect, useRef, type ComponentProps, type ReactNode } from 'react'

/** Keep headers in the page scroll, or in the table scroll when columns overflow. */
export function HTableViewport({ ref, children, heading, ...props }: ComponentProps<'div'> & { heading?: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null)
  const attach = useCallback((element: HTMLDivElement | null) => {
    viewport.current = element
    if (typeof ref === 'function') return ref(element)
    if (ref) ref.current = element
  }, [ref])
  useEffect(() => {
    const element = viewport.current, table = element?.querySelector('table')
    if (!element || !table) return
    const observedHeaders = new Set<HTMLElement>()
    let frame = 0
    const update = () => {
      if (!element.clientWidth) return
      // Portals can attach after the first effect: resolve the scroll context again.
      let scrollRoot: HTMLElement | null = element.parentElement
      while (scrollRoot && !/auto|scroll|overlay/.test(getComputedStyle(scrollRoot).overflowY)) scrollRoot = scrollRoot.parentElement
      const headers = scrollRoot
        ? [...scrollRoot.querySelectorAll<HTMLElement>('.contact-record-toolbar, .dialog-heading')].filter((header) => getComputedStyle(header).position === 'sticky')
        : [...document.querySelectorAll<HTMLElement>('.topbar, .page-breadcrumb-row')]
      for (const header of headers) {
        if (!observedHeaders.has(header)) { observedHeaders.add(header); observer.observe(header) }
      }
      const contained = table.scrollWidth > element.clientWidth + 1
      element.dataset.scrollMode = contained ? 'contained' : 'page'
      const top = contained ? 0 : headers.reduce((height, header) => height + header.getBoundingClientRect().height, 0)
      element.style.setProperty('--table-sticky-top', `${top}px`)
      let rowOffset = element.querySelector<HTMLElement>('.h-table-sticky-heading')?.getBoundingClientRect().height || 0
      for (const row of table.tHead?.rows || []) { row.style.setProperty('--table-header-row-offset', `${rowOffset}px`); rowOffset += row.getBoundingClientRect().height }
    }
    const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update) })
    for (const observed of [element, table]) observer.observe(observed)
    window.addEventListener('resize', update)
    update()
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize', update) }
  }, [])
  return <div {...props} ref={attach} data-table-viewport>{heading && <div className="h-table-sticky-heading">{heading}</div>}{children}</div>
}
