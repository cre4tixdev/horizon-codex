import { useEffect, useMemo, useRef, useState } from 'react'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { createPaginatedHtml } from '../preview/createPaginatedHtml'
export function PaginatedDocument({ html, zoom = 100, fit = false, onPaginated }: { html: string; zoom?: number; fit?: boolean; onPaginated?: (pages: number) => void }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const document = useMemo(() => {
    const token = crypto.randomUUID().replaceAll('-', '')
    try { return { token, html: createPaginatedHtml(html, token), error: false } }
    catch (error) { console.error('[documents] Invalid preview document', error); return { token, html: '', error: true } }
  }, [html])
  const [status, setStatus] = useState({ token: '', ready: false, error: false })
  const ready = status.token === document.token && status.ready
  const failed = document.error || status.token === document.token && status.error
  useEffect(() => {
    if (ready) frame.current?.contentWindow?.postMessage({ kind: 'horizon-document-zoom', token: document.token, zoom, fit }, '*')
  }, [ready, document.token, zoom, fit])
  useEffect(() => {
    let stage = 'démarrage', pages = 0
    const timeout = setTimeout(() => { console.error('[documents] HTML pagination timed out', { stage, pages }); setStatus({ token: document.token, ready: false, error: true }) }, 30000)
    function receive(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow || event.data?.kind !== 'horizon-document-pagination' || event.data.token !== document.token) return
      if (event.data.progress) { stage = event.data.stage; pages = event.data.pages; return }
      clearTimeout(timeout)
      if (!event.data.error && Number.isInteger(event.data.pages) && event.data.pages > 0) onPaginated?.(event.data.pages)
      setStatus({ token: document.token, ready: !event.data.error, error: Boolean(event.data.error) })
    }
    window.addEventListener('message', receive)
    return () => { clearTimeout(timeout); window.removeEventListener('message', receive) }
  }, [document.token, onPaginated])
  return <div className="document-paginated-preview">
    {!ready && !failed && <HLoadingIndicator label="Pagination du document" />}
    {failed && <p role="alert" className="field-error">L’aperçu HTML n’a pas pu être paginé. Vous pouvez réouvrir l’aperçu ou utiliser le PDF.</p>}
    <iframe ref={frame} title="Aperçu du devis enregistré" sandbox="allow-scripts" className="document-preview-frame" data-ready={ready} srcDoc={failed ? '' : document.html} />
  </div>
}
