type PreviewEngine = {
  Handler: new (...args: unknown[]) => object
  registerHandlers: (handler: new (...args: unknown[]) => object) => void
  Previewer: new () => { preview: (content: DocumentFragment, styles: Record<string, string>[], target: HTMLElement) => Promise<unknown> }
}
declare global { interface Window { PagedModule?: PreviewEngine } }
/** Runs only inside the opaque, script-restricted preview frame. Keep it self-contained. */
export async function paginateDocument(token: string) {
  const progress = (stage: string, pages = 0) => window.parent.postMessage({ kind: 'horizon-document-pagination', token, progress: true, stage, pages }, '*')
  try {
    progress('préparation')
    const engine = window.PagedModule
    if (!engine) throw new Error('Pagination runtime unavailable.')
    const source = document.querySelector<HTMLTemplateElement>('#document-source')!
    const main = source.content.querySelector<HTMLElement>('main')!
    const header = main.querySelector<HTMLElement>(':scope>header')!, footer = main.querySelector<HTMLElement>(':scope>footer')!
    const content = main.querySelector<HTMLElement>(':scope>section')!
    const width = parseFloat(main.style.width), landscape = width > 1000
    const height = landscape ? 794 : 1123, margin = parseFloat(main.style.padding)
    const headerHeight = parseFloat(header.style.height), footerHeight = parseFloat(footer.style.height)
    const background = main.querySelector<HTMLElement>(':scope>.document-paper-background')
    const sourceCss = document.querySelector('#document-styles')!.textContent!
    const printCss = `${sourceCss}\n@page { size:A4 ${landscape ? 'landscape' : 'portrait'}; margin:${margin + headerHeight}px ${margin}px ${margin + footerHeight}px; }\n.document-flow-row:has([style*="break-before:page"]) { break-before:page; }`
    // Explicitly load the fonts used by detached blocks before measuring their content.
    progress('polices')
    await Promise.all([...main.querySelectorAll<HTMLElement>('[style]')].map((node) => {
      const style = node.style
      return style.fontFamily ? document.fonts.load(`${style.fontStyle || 'normal'} ${style.fontWeight || '400'} ${style.fontSize || '12px'} ${style.fontFamily}`) : Promise.resolve()
    }))
    class RepeatTableHeaders extends engine.Handler {
      tables = new Map<string, HTMLTableElement>()
      afterPageLayout() { progress('pages', document.querySelectorAll('.pagedjs_page').length) }
      afterParsed(fragment: DocumentFragment) {
        for (const table of fragment.querySelectorAll<HTMLTableElement>('table.lines')) this.tables.set(table.dataset.ref!, table)
      }
      // Restore headers before the engine measures overflow, rather than appending them after pagination.
      layout(fragment: HTMLElement) {
        for (const table of fragment.querySelectorAll<HTMLTableElement>('table.lines')) {
          const original = this.tables.get(table.dataset.ref!)
          if (!original || table.querySelector('thead')) continue
          if (!table.querySelector('colgroup') && original.querySelector('colgroup')) table.prepend(original.querySelector('colgroup')!.cloneNode(true))
          const head = original.querySelector('thead')
          if (head) table.insertBefore(head.cloneNode(true), table.querySelector('tbody'))
        }
      }
    }
    engine.registerHandlers(RepeatTableHeaders)
    const fragment = document.createDocumentFragment()
    fragment.append(...content.childNodes)
    const target = document.querySelector<HTMLElement>('#document-pages')!
    progress('pagination')
    await new engine.Previewer().preview(fragment, [{ 'horizon-document.css': printCss }], target)
    const pages = [...target.querySelectorAll<HTMLElement>('.pagedjs_page')]
    for (const [index, page] of pages.entries()) {
      const box = page.querySelector<HTMLElement>('.pagedjs_pagebox')!
      for (const [element, top, label] of [[header, margin, 'header'], [footer, height - margin - footerHeight, 'footer']] as const) {
        const clone = element.cloneNode(true) as HTMLElement
        clone.className = `document-repeated-${label}`
        Object.assign(clone.style, { position: 'absolute', top: `${top}px`, left: `${margin}px`, width: `${width - margin * 2}px`, zIndex: '2' })
        box.append(clone)
      }
      if (background) {
        const clone = background.cloneNode(true) as HTMLElement
        Object.assign(clone.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', zIndex: '0' })
        box.prepend(clone)
      }
      for (const number of box.querySelectorAll('.pageNumber')) number.textContent = String(index + 1)
      for (const total of box.querySelectorAll('.totalPages')) total.textContent = String(pages.length)
    }
    // Screen decoration is deliberately applied after pagination: it never changes measurements.
    const screenStyle = document.createElement('style')
    screenStyle.textContent = `html,body{background:#e8edf4}body{padding:20px 24px}.pagedjs_page{margin:0 auto 20px;background:white;box-shadow:0 2px 10px #091c3a15}.pagedjs_area{position:relative;z-index:1}.pagedjs_pagebox{isolation:isolate}.pagedjs_pages{width:max-content;margin:0 auto}`
    document.head.append(screenStyle)
    let zoom = 100, fit = false
    const applyZoom = () => {
      const paper = pages[0]
      if (!paper) return
      const scale = fit ? Math.min((window.innerWidth - 48) / paper.offsetWidth, (window.innerHeight - 40) / paper.offsetHeight) : zoom / 100
      target.style.zoom = String(Math.max(0.1, Math.min(2, scale)))
    }
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.source !== window.parent || event.data?.kind !== 'horizon-document-zoom' || event.data.token !== token || !Number.isFinite(event.data.zoom) || typeof event.data.fit !== 'boolean') return
      zoom = Math.max(10, Math.min(200, event.data.zoom)); fit = event.data.fit
      applyZoom()
    })
    window.addEventListener('resize', applyZoom)
    document.documentElement.dataset.paginated = 'true'
    window.parent.postMessage({ kind: 'horizon-document-pagination', token, pages: pages.length }, '*')
  } catch (error) {
    console.error('[documents] HTML pagination failed', error)
    window.parent.postMessage({ kind: 'horizon-document-pagination', token, error: true }, '*')
  }
}
