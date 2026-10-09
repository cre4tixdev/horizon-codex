import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Eye, FileText, Minus, Plus, Scan } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HRecordPicker } from '../../../shared/records/HRecordPicker'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HDialog } from '../../../shared/ui/HDialog'
import { PaginatedDocument } from './PaginatedDocument'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { salesService } from '../../sales'
import { documentsService } from '../services/DocumentsService'
import type { Layout } from '../schemas/templates'
export function DocumentPreview({ layout, quoteId, templateId, onClose }: { layout?: Layout; quoteId?: string; templateId?: string; onClose: () => void }) {
  const client = useQueryClient()
  const [selectedQuote, setSelectedQuote] = useState(quoteId || ''), [chosenTemplate, setSelectedTemplate] = useState(templateId || ''), [search, setSearch] = useState('')
  const quotes = useQuery({ queryKey: ['sales', 'quotes', 'document-preview', search], queryFn: () => salesService.list({ q: search, opportunity: '', company: '', status: '', sort: '-created', page: 1 }), enabled: !quoteId, retry: false })
  const templates = useQuery({ queryKey: ['documents', 'choices'], queryFn: () => documentsService.list(), enabled: !layout, retry: false })
  const availableTemplates = (templates.data || []).filter((item) => item.current_version && item.status !== 'archived')
  const selectedTemplate = chosenTemplate || (availableTemplates.length === 1 ? availableTemplates[0]!.id : '')
  const input = { quote_id: selectedQuote, ...(layout ? { content_json: layout } : { template_id: selectedTemplate }) }
  const ready = Boolean(selectedQuote && (layout || selectedTemplate))
  const [zoom, setZoom] = useState(100), [fit, setFit] = useState(false)
  const [pdfView, setPdfView] = useState(false)
  const [htmlAttempt, setHtmlAttempt] = useState(0)
  const [pdfUrl, setPdfUrl] = useState('')
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }, [pdfUrl])
  const preview = useMutation({ mutationFn: () => documentsService.preview(input) })
  const pdfPreview = useMutation({ mutationFn: () => documentsService.pdf(input), onSuccess: (file) => { setPdfUrl(URL.createObjectURL(file.blob)); setPdfView(true) } })
  const generatedInput = useRef('')
  const { mutate: generateHtml } = preview
  useEffect(() => {
    if (!ready) return
    const key = JSON.stringify({ selectedQuote, selectedTemplate, layout })
    if (generatedInput.current === key) return
    generatedInput.current = key
    generateHtml()
  }, [ready, selectedQuote, selectedTemplate, layout, generateHtml])
  const download = useMutation({ mutationFn: () => documentsService.pdf(input), onSuccess: (file) => {
    const url = URL.createObjectURL(file.blob), link = document.createElement('a'); link.href = url; link.download = file.filename || preview.data?.filename || 'document.pdf'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  } })
  const busy = preview.isPending || download.isPending || pdfPreview.isPending
  const html = preview.data?.html || ''
  const [pagination, setPagination] = useState({ html: '', pages: 0 })
  const onPaginated = useCallback((pages: number) => setPagination({ html, pages }), [html])
  const pageCount = pagination.html === html ? pagination.pages : 0
  const pageFormat = preview.data?.page || (layout ? { format: 'A4', orientation: layout.orientation, width: layout.orientation === 'portrait' ? 210 : 297, height: layout.orientation === 'portrait' ? 297 : 210 } : undefined)
  return <HDialog open title="Aperçu du devis" description="L’aperçu HTML présente les pages A4 et les sauts de page. Le PDF permet de vérifier le résultat final." className="document-preview-dialog" onOpenChange={(open) => { if (!open) onClose() }}>
    <div className="document-preview-toolbar">
      {!quoteId && <HRecordPicker resource="quote" createLabel="Nouveau devis" canCreate={false} canInspect ready={Boolean(quotes.data)} recordHref={(id) => `/sales/quotes/${id}`} onSaved={async () => { await client.invalidateQueries({ queryKey: ["sales", "quotes", "document-preview"] }); preview.reset(); pdfPreview.reset(); setPdfView(false); setPdfUrl(""); generatedInput.current = ""; if (ready) generateHtml() }} label="Devis de l’aperçu" required showCodes={false} value={selectedQuote} onChange={(value) => { generatedInput.current = ""; setSelectedQuote(value); preview.reset(); pdfPreview.reset(); setPdfView(false); setPdfUrl("") }} onSearchChange={setSearch} options={(quotes.data?.items || []).map((quote) => ({ value: quote.id, label: `${quote.quote_number} · ${quote.company_name} · ${quote.title}` }))} />}
      {!layout && <HCombobox label="Modèle du devis" required showCodes={false} value={selectedTemplate} onChange={(value) => { if (value === selectedTemplate) return; generatedInput.current = ""; setSelectedTemplate(value); preview.reset(); pdfPreview.reset(); setPdfView(false); setPdfUrl("") }} options={availableTemplates.map((item) => ({ value: item.id, label: `${item.name} · v${item.version}` }))} />}
      <HButton size="small" aria-pressed={!pdfView} disabled={!ready || busy} onClick={() => { setPdfView(false); pdfPreview.reset(); setHtmlAttempt((attempt) => attempt + 1); if (!preview.data) generateHtml() }}><Eye size={14} />Aperçu HTML</HButton>
      <HButton size="small" aria-pressed={pdfView} disabled={!ready || busy} onClick={() => { setPdfView(true); if (!pdfUrl) pdfPreview.mutate() }}><Eye size={14} />Aperçu PDF</HButton>
      <div className="document-preview-download"><HButton size="small" variant="primary" disabled={!ready || busy} onClick={() => download.mutate()}><Download size={14} />Télécharger PDF</HButton></div>
    </div>
    {(quotes.error || templates.error || preview.error || pdfPreview.error || download.error) && <p role="alert" className="field-error">{quotes.error?.message || templates.error?.message || preview.error?.message || pdfPreview.error?.message || download.error?.message}</p>}
    {!layout && templates.data && !availableTemplates.length && <p className="contact-muted">Publiez un modèle dans Paramètres → Modèles de pièces.</p>}
    <div className="document-preview-body">
      <div className="document-preview-controls">
        <span className="document-preview-format">{pageFormat ? <>{pageFormat.format} · {pageFormat.orientation === 'portrait' ? 'Portrait' : 'Paysage'}<span>{pageFormat.width} × {pageFormat.height} mm</span></> : 'Aperçu'}{pageCount > 0 && <span className="document-preview-page-count">{pageCount} {pageCount === 1 ? 'page' : 'pages'}{pdfView ? ' HTML' : ''}</span>}</span>
      {!pdfView && <div className="document-preview-zoom" role="group" aria-label="Zoom HTML">
        <HButton size="icon" variant="ghost" aria-label="Réduire le zoom HTML" title="Réduire" disabled={zoom <= 10 && !fit} onClick={() => { setFit(false); setZoom((value) => Math.max(10, value - 10)) }}><Minus size={14} /></HButton>
        <span>{fit ? 'Ajusté' : `${zoom} %`}</span>
        <HButton size="icon" variant="ghost" aria-label="Augmenter le zoom HTML" title="Agrandir" disabled={zoom >= 200 && !fit} onClick={() => { setFit(false); setZoom((value) => Math.min(200, value + 10)) }}><Plus size={14} /></HButton>
        <HButton size="small" variant="ghost" aria-pressed={fit} title="Afficher la page entière" onClick={() => setFit(true)}><Scan size={14} />Ajuster à la fenêtre</HButton>
      </div>}
      </div>
    {pdfView && pdfUrl ? <iframe title="Aperçu PDF paginé" className="document-preview-frame" src={pdfUrl} /> : !pdfView && preview.data && <>{preview.data.warnings.length > 0 && <p className="contact-muted">{preview.data.warnings.join(' ')}</p>}<PaginatedDocument key={htmlAttempt} html={preview.data.html} zoom={zoom} fit={fit} onPaginated={onPaginated} /></>}
    {!(pdfView ? pdfUrl : preview.data) && <div className="document-preview-placeholder">{busy || !layout && templates.isPending ? <HLoadingIndicator label="Préparation du document" /> : <><FileText size={30} /><p>{ready ? 'Sélectionnez Aperçu HTML ou Aperçu PDF.' : quoteId ? templates.data && !availableTemplates.length ? 'Aucun modèle publié disponible pour ce devis.' : 'Choisissez un modèle pour afficher le devis.' : 'Choisissez un devis pour afficher l’aperçu.'}</p></>}</div>}
    </div>
  </HDialog>
}
