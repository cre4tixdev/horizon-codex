import { operationsService } from '../../inventory/services/OperationsService'
import { purchasingService } from '../../purchasing'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Eye, FileText, Minus, Plus, Scan, Printer } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HRecordPicker } from '../../../shared/records/HRecordPicker'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HDialog } from '../../../shared/ui/HDialog'
import { PaginatedDocument } from './PaginatedDocument'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { salesService } from '../../sales'
import { catalogService } from '../../inventory/services/CatalogService'
import { documentsService } from '../services/DocumentsService'
import { pageDimensions, type Layout, type DocumentType } from '../schemas/templates'
export function DocumentPreview({ layout, quoteId, productId, purchaseOrderId, stockOperationId, documentType = 'quote', templateId, onClose }: { layout?: Layout; quoteId?: string; productId?: string; purchaseOrderId?: string; stockOperationId?: string; documentType?: DocumentType; templateId?: string; onClose: () => void }) {
  const client = useQueryClient(), stockOperation = Boolean(stockOperationId) || documentType === 'stock_operation', purchase = Boolean(purchaseOrderId) || documentType === 'purchase_order', label = documentType === 'product_label', effectiveType = stockOperation ? 'stock_operation' : purchase ? 'purchase_order' : documentType
  const [printRequest, setPrintRequest] = useState(0)
  const [selectedQuote, setSelectedQuote] = useState(stockOperationId || purchaseOrderId || productId || quoteId || ''), [chosenTemplate, setSelectedTemplate] = useState(templateId || (label || purchase || stockOperation ? '__default' : '')), [search, setSearch] = useState('')
  const quotes = useQuery({ queryKey: ['sales', 'quotes', 'document-preview', search], queryFn: () => salesService.list({ q: search, opportunity: '', company: '', status: '', sort: '-created', page: 1 }), enabled: !stockOperation && !purchase && !label && !quoteId, retry: false })
  const products = useQuery({ queryKey: ['inventory', 'products', 'document-preview', search], queryFn: () => catalogService.list({ q: search, page: 1, state: 'active' }), enabled: label && !productId, retry: false })
  const orders = useQuery({ queryKey: ['purchasing', 'orders', 'document-preview', search], queryFn: () => purchasingService.list('orders', { q: search, status: '', supplier: '', opportunity: '', product: '', source_order: '', source_line: '', sort: '-created', group: '', page: 1 }), enabled: purchase && !purchaseOrderId, retry: false })
  const stockPieces = useQuery({ queryKey: ['inventory', 'operations', 'document-preview', search], queryFn: () => operationsService.list({ q: search }), enabled: stockOperation && !stockOperationId, retry: false })
  const templates = useQuery({ queryKey: ['documents', 'choices'], queryFn: () => documentsService.list(), enabled: !layout, retry: false })
  const availableTemplates = (templates.data || []).filter((item) => item.document_type === effectiveType && item.current_version && item.status !== 'archived')
  const selectedTemplate = chosenTemplate || (availableTemplates.length === 1 ? availableTemplates[0]!.id : '')
  const input = { ...(stockOperation ? { stock_operation_id: selectedQuote } : purchase ? { purchase_order_id: selectedQuote } : label ? { product_id: selectedQuote } : { quote_id: selectedQuote }), ...(layout ? { content_json: layout } : selectedTemplate === '__default' ? {} : { template_id: selectedTemplate }) }
  const ready = Boolean(selectedQuote && (layout || selectedTemplate))
  const [zoom, setZoom] = useState(100), [fit, setFit] = useState(label)
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
  const pageFormat = preview.data?.page || (layout ? pageDimensions(layout) : undefined)
  return <HDialog open title={stockOperation ? 'Aperçu de la pièce de stock' : purchase ? 'Aperçu de la commande fournisseur' : label ? 'Étiquette produit' : 'Aperçu du devis'} description={label ? 'Impression au format réel · échelle 100 %, sans en-tête ni pied ajouté par le navigateur.' : 'L’aperçu HTML présente la pagination. Le PDF permet de vérifier le résultat final.'} className={`document-preview-dialog${label ? ' document-label-preview-dialog' : ''}`} onOpenChange={(open) => { if (!open) onClose() }}>
    <div className="document-preview-toolbar">
      {!stockOperation && !purchase && !label && !quoteId && <HRecordPicker resource="quote" createLabel="Nouveau devis" canCreate={false} canInspect ready={Boolean(quotes.data)} recordHref={(id) => `/sales/quotes/${id}`} onSaved={async () => { await client.invalidateQueries({ queryKey: ["sales", "quotes", "document-preview"] }); preview.reset(); pdfPreview.reset(); setPdfView(false); setPdfUrl(""); generatedInput.current = ""; if (ready) generateHtml() }} label="Devis de l’aperçu" required showCodes={false} value={selectedQuote} onChange={(value) => { generatedInput.current = ""; setSelectedQuote(value); preview.reset(); pdfPreview.reset(); setPdfView(false); setPdfUrl("") }} onSearchChange={setSearch} options={(quotes.data?.items || []).map((quote) => ({ value: quote.id, label: `${quote.quote_number} · ${quote.company_name} · ${quote.title}` }))} />}
      {stockOperation && !stockOperationId && <HCombobox label="Opération de l’aperçu" value={selectedQuote} onSearchChange={setSearch} options={(stockPieces.data?.items || []).map((item) => ({ value: item.id, label: `${item.number} · ${item.title}` }))} onChange={(id) => { setSelectedQuote(id); generatedInput.current = ''; preview.reset(); setPdfUrl(''); setPdfView(false) }} />}
      {purchase && !purchaseOrderId && <HCombobox label="Commande de l’aperçu" value={selectedQuote} onSearchChange={setSearch} options={(orders.data?.items || []).map((item) => ({ value: item.id, label: `${item.number} · ${item.supplier_name}` }))} onChange={(id) => { setSelectedQuote(id); generatedInput.current = ''; preview.reset(); setPdfUrl(''); setPdfView(false) }} />}
      {label && !productId && <HRecordPicker resource="product" createLabel="Nouveau produit" canCreate={false} canInspect ready={Boolean(products.data)} recordHref={(id) => `/inventory/products/${id}`} onSaved={async () => { await client.invalidateQueries({ queryKey: ['inventory', 'products', 'document-preview'] }); generatedInput.current = ''; preview.reset(); pdfPreview.reset(); setPdfView(false); setPdfUrl(''); if (ready) generateHtml() }} label="Produit de l’aperçu" required showCodes={false} value={selectedQuote} onSearchChange={setSearch} onChange={(value) => { generatedInput.current = ''; setSelectedQuote(value); preview.reset(); pdfPreview.reset(); setPdfView(false); setPdfUrl('') }} options={(products.data?.items || []).map((product) => ({ value: product.id, label: `${product.manufacturer} · ${product.sku} · ${product.name}` }))} />}
      {!layout && <HCombobox label={stockOperation ? 'Modèle de la pièce' : purchase ? 'Modèle de la commande' : label ? 'Modèle de l’étiquette' : 'Modèle du devis'} required showCodes={false} value={selectedTemplate} onChange={(value) => { if (value === selectedTemplate) return; generatedInput.current = ""; setSelectedTemplate(value); preview.reset(); pdfPreview.reset(); setPdfView(false); setPdfUrl("") }} options={[...(stockOperation ? [{ value: '__default', label: 'Pièce de stock standard' }] : purchase ? [{ value: '__default', label: 'Commande fournisseur standard' }] : label ? [{ value: '__default', label: 'Étiquette standard · 95 × 28 mm' }] : []), ...availableTemplates.map((item) => ({ value: item.id, label: `${item.name} · v${item.version}` }))]} />}
      <HButton size="small" aria-pressed={!pdfView} disabled={!ready || busy} onClick={() => { setPdfView(false); pdfPreview.reset(); setHtmlAttempt((attempt) => attempt + 1); if (!preview.data) generateHtml() }}><Eye size={14} />Aperçu HTML</HButton>
      <HButton size="small" aria-pressed={pdfView} disabled={!ready || busy} onClick={() => { setPdfView(true); if (!pdfUrl) pdfPreview.mutate() }}><Eye size={14} />Aperçu PDF</HButton>
      {label && <HButton size="small" disabled={busy || !pageCount || pdfView} onClick={() => setPrintRequest((count) => count + 1)}><Printer size={14} />Imprimer</HButton>}
      <div className="document-preview-download"><HButton size="small" variant="primary" disabled={!ready || busy} onClick={() => download.mutate()}><Download size={14} />Télécharger PDF</HButton></div>
    </div>
    {(orders.error || quotes.error || products.error || templates.error || preview.error || pdfPreview.error || download.error) && <p role="alert" className="field-error">{orders.error?.message || quotes.error?.message || products.error?.message || templates.error?.message || preview.error?.message || pdfPreview.error?.message || download.error?.message}</p>}
    {!purchase && !label && !layout && templates.data && !availableTemplates.length && <p className="contact-muted">Publiez un modèle dans Paramètres → Modèles de pièces.</p>}
    <div className="document-preview-body">
      <div className="document-preview-controls">
        <span className="document-preview-format">{pageFormat ? <>{pageFormat.name || pageFormat.format}{pageFormat.format === 'A4' && <> · {pageFormat.orientation === 'portrait' ? 'Portrait' : 'Paysage'}</>}<span>{pageFormat.width} × {pageFormat.height} mm</span></> : 'Aperçu'}{pageCount > 0 && <span className="document-preview-page-count">{pageCount} {pageCount === 1 ? 'page' : 'pages'}{pdfView ? ' HTML' : ''}</span>}</span>
      {!pdfView && <div className="document-preview-zoom" role="group" aria-label="Zoom HTML">
        <HButton size="icon" variant="ghost" aria-label="Réduire le zoom HTML" title="Réduire" disabled={zoom <= 10 && !fit} onClick={() => { setFit(false); setZoom((value) => Math.max(10, value - 10)) }}><Minus size={14} /></HButton>
        <span>{fit ? 'Ajusté' : `${zoom} %`}</span>
        <HButton size="icon" variant="ghost" aria-label="Augmenter le zoom HTML" title="Agrandir" disabled={zoom >= 200 && !fit} onClick={() => { setFit(false); setZoom((value) => Math.min(200, value + 10)) }}><Plus size={14} /></HButton>
        <HButton size="small" variant="ghost" aria-pressed={fit} title="Afficher la page entière" onClick={() => setFit(true)}><Scan size={14} />Ajuster à la fenêtre</HButton>
      </div>}
      </div>
    {pdfView && pdfUrl ? <iframe title="Aperçu PDF paginé" className="document-preview-frame" src={pdfUrl} /> : !pdfView && preview.data && <>{preview.data.warnings.length > 0 && <p className="contact-muted">{preview.data.warnings.join(' ')}</p>}<PaginatedDocument key={htmlAttempt} html={preview.data.html} title={label ? 'Aperçu de l’étiquette produit' : 'Aperçu du devis enregistré'} zoom={zoom} fit={fit} printRequest={printRequest} onPaginated={onPaginated} /></>}
    {!(pdfView ? pdfUrl : preview.data) && <div className="document-preview-placeholder">{busy || !layout && templates.isPending ? <HLoadingIndicator label="Préparation du document" /> : <><FileText size={30} /><p>{ready ? 'Sélectionnez Aperçu HTML ou Aperçu PDF.' : quoteId ? templates.data && !availableTemplates.length ? 'Aucun modèle publié disponible pour ce devis.' : 'Choisissez un modèle pour afficher le devis.' : label ? 'Choisissez un produit pour afficher l’étiquette.' : 'Choisissez un devis pour afficher l’aperçu.'}</p></>}</div>}
    </div>
  </HDialog>
}
