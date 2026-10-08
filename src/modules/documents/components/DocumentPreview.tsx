import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Eye } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import { HRecordPicker } from '../../../shared/records/HRecordPicker'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HDialog } from '../../../shared/ui/HDialog'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { salesService } from '../../sales'
import { documentsService } from '../services/DocumentsService'
import type { Layout } from '../schemas/templates'
export function DocumentPreview({ layout, quoteId, templateId, onClose }: { layout?: Layout; quoteId?: string; templateId?: string; onClose: () => void }) {
  const client = useQueryClient()
  const [selectedQuote, setSelectedQuote] = useState(quoteId || ''), [selectedTemplate, setSelectedTemplate] = useState(templateId || ''), [search, setSearch] = useState('')
  const quotes = useQuery({ queryKey: ['sales', 'quotes', 'document-preview', search], queryFn: () => salesService.list({ q: search, opportunity: '', company: '', status: '', sort: '-created', page: 1 }), enabled: !quoteId, retry: false })
  const templates = useQuery({ queryKey: ['documents', 'choices'], queryFn: () => documentsService.list(), enabled: !layout, retry: false })
  const input = { quote_id: selectedQuote, ...(layout ? { content_json: layout } : { template_id: selectedTemplate }) }
  const ready = Boolean(selectedQuote && (layout || selectedTemplate))
  const [pdfView, setPdfView] = useState(false)
  const [pdfUrl, setPdfUrl] = useState('')
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }, [pdfUrl])
  const preview = useMutation({ mutationFn: () => documentsService.preview(input) })
  const pdfPreview = useMutation({ mutationFn: () => documentsService.pdf(input), onSuccess: (blob) => { setPdfUrl(URL.createObjectURL(blob)); setPdfView(true) } })
  const download = useMutation({ mutationFn: () => documentsService.pdf(input), onSuccess: (blob) => {
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'devis.pdf'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  } })
  const busy = preview.isPending || download.isPending || pdfPreview.isPending
  return <HDialog open title="Aperçu du devis" description="Le contenu provient du devis enregistré. Le PDF applique la pagination et répète les en-têtes et pieds de page." className="document-preview-dialog" onOpenChange={(open) => { if (!open) onClose() }}>
    <div className="document-preview-toolbar">
      {!quoteId && <HRecordPicker resource="quote" createLabel="Nouveau devis" canCreate={false} canInspect ready={Boolean(quotes.data)} recordHref={(id) => `/sales/quotes/${id}`} onSaved={async () => { await client.invalidateQueries({ queryKey: ["sales", "quotes", "document-preview"] }); preview.reset(); setPdfView(false) }} label="Devis de l’aperçu" required showCodes={false} value={selectedQuote} onChange={(value) => { setSelectedQuote(value); preview.reset(); setPdfView(false); setPdfUrl("") }} onSearchChange={setSearch} options={(quotes.data?.items || []).map((quote) => ({ value: quote.id, label: `${quote.quote_number} · ${quote.company_name} · ${quote.title}` }))} />}
      {!layout && <HCombobox label="Modèle du devis" required showCodes={false} value={selectedTemplate} onChange={(value) => { setSelectedTemplate(value); preview.reset(); setPdfView(false); setPdfUrl("") }} options={(templates.data || []).filter((item) => item.current_version && item.status !== 'archived').map((item) => ({ value: item.id, label: `${item.name} · v${item.version}` }))} />}
      <HButton size="small" disabled={!ready || busy} onClick={() => { setPdfView(false); preview.mutate() }}><Eye size={14} />Aperçu HTML</HButton>
      <HButton size="small" disabled={!ready || busy} onClick={() => pdfPreview.mutate()}><Eye size={14} />Aperçu PDF</HButton>
      <HButton size="small" disabled={!ready || busy} onClick={() => download.mutate()}><Download size={14} />PDF</HButton>
    </div>
    {(quotes.error || templates.error || preview.error || pdfPreview.error || download.error) && <p role="alert" className="field-error">{quotes.error?.message || templates.error?.message || preview.error?.message || pdfPreview.error?.message || download.error?.message}</p>}
    {!layout && templates.data && !templates.data.some((item) => item.current_version) && <p className="contact-muted">Publiez un modèle dans Paramètres → Modèles de pièces.</p>}
    {busy && <HLoadingIndicator label="Préparation du document" />}
    {pdfView && pdfUrl ? <iframe title="Aperçu PDF paginé" className="document-preview-frame" src={pdfUrl} /> : preview.data && <><p className="contact-muted">{preview.data.warnings.join(' ')}</p><iframe title="Aperçu du devis enregistré" sandbox="" className="document-preview-frame" srcDoc={preview.data.html} /></>}
  </HDialog>
}
