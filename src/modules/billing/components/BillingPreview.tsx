import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { HDialog } from '../../../shared/ui/HDialog'
import { HButton } from '../../../shared/ui/HButton'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { PaginatedDocument } from '../../documents/components/PaginatedDocument'
import type { Layout } from '../../documents/schemas/templates'
import '../../documents/studio.css'
import { billingService } from '../services/BillingService'
import { billLabels, type Bill, type BillKind } from '../schemas/billing'

export function BillingPreview({ record, layout, onClose }: { record?: Bill; layout?: Layout; onClose: () => void }) {
  const [kind, setKind] = useState<BillKind>(record?.kind || 'customer')
  const [selected, setSelected] = useState(record?.id || '')
  const [url, setUrl] = useState(''), [pdf, setPdf] = useState(false)
  const sources = useQuery({ queryKey: ['billing', 'preview-sources', kind], queryFn: () => billingService.list({ kind }), enabled: !record, retry: false })
  const id = record?.id || selected
  const query = useQuery({ queryKey: ['billing', 'preview', kind, id, record?.updated, layout], queryFn: () => billingService.preview(kind, id, layout), enabled: Boolean(id), retry: false })
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  const generate = useMutation({ mutationFn: () => billingService.pdf(kind, id, layout), onSuccess: (file) => { setUrl(URL.createObjectURL(file.blob)); setPdf(true) } })
  const download = useMutation({ mutationFn: () => billingService.pdf(kind, id, layout), onSuccess: (file) => { const href = URL.createObjectURL(file.blob), link = document.createElement('a'); link.href = href; link.download = file.filename || 'facture.pdf'; link.click(); setTimeout(() => URL.revokeObjectURL(href), 1000) } })
  return <HDialog open description={layout ? 'Test du modèle sur une pièce existante. La pièce et son document figé sont conservés.' : ''} title="Aperçu de facturation" className="document-preview-dialog document-preview-dialog--loaded" onOpenChange={(open) => { if (!open) onClose() }}>
    <div className="document-preview-toolbar">
      {!record && <><HCombobox label="Type de pièce pour l’aperçu" value={kind} clearable={false} showCodes={false} options={Object.entries(billLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => { setKind(value as BillKind); setSelected(''); setPdf(false) }} /><HCombobox label="Pièce pour l’aperçu" value={id} showCodes={false} options={(sources.data?.items || []).map((bill) => ({ value: bill.id, label: `${bill.number || 'Brouillon'} · ${bill.company_name} · ${bill.title}` }))} onChange={(value) => { setSelected(value); setPdf(false) }} /></>}
      <HButton aria-pressed={!pdf} onClick={() => setPdf(false)}>Aperçu HTML</HButton><HButton aria-pressed={pdf} disabled={!id || generate.isPending} onClick={() => generate.mutate()}>Aperçu PDF</HButton><HButton variant="primary" disabled={!id || download.isPending} onClick={() => download.mutate()}>Télécharger PDF</HButton>
    </div>
    {(query.error || sources.error || generate.error || download.error) && <p role="alert" className="field-error">{query.error?.message || sources.error?.message || generate.error?.message || download.error?.message}</p>}
    {!id && <p className="contact-muted">Choisissez une pièce pour tester le modèle.</p>}{id && query.isPending && <HLoadingIndicator label="Préparation de l’aperçu" />}
    <div className="document-preview-body">{query.data && !pdf && <PaginatedDocument html={query.data.html} title="Aperçu de la facture" />}{pdf && url && <iframe title="Aperçu PDF de la facture" src={url} className="document-preview-frame" />}</div>
  </HDialog>
}
