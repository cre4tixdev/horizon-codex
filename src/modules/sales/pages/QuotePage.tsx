import { DocumentPreview } from '../../documents'
import { ActivityPanel } from '../../../shared/activity/ActivityPanel'
import { HRecordPicker } from '../../../shared/records/HRecordPicker'
import { useRecordSession } from '../../../shared/records/recordContext'
import { QuoteLines } from '../components/QuoteLines'
import { quoteValidity } from '../services/quotePreview'
import { HRecordActions } from '../../../shared/ui/HRecordActions'
import { useEffect, useState, useId } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { FileText, Ban, StickyNote, ChevronDown, ChevronRight, Undo2 } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HRecordPageActions } from '../../../shared/ui/HRecordPageActions'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HTag } from '../../../shared/ui/HTag'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { salesService } from '../services/SalesService'
import { useSalesAccess } from '../hooks/useSalesAccess'
import { quoteInputSchema, quoteStatusLabels, type Quote, type QuoteInput, type SalesSettings } from '../schemas/quotes'
export function QuotePage() {
  const embedded = useRecordSession()
  const { id: routeId = 'new' } = useParams()
  const id = embedded ? embedded.id || 'new' : routeId
  const access = useSalesAccess()
  const record = useQuery({ queryKey: ['sales', 'quote', id], queryFn: () => salesService.record(id), enabled: access.canRead && id !== 'new', retry: false })
  const settings = useQuery({ queryKey: ['settings', 'sales'], queryFn: () => salesService.settings(), enabled: access.canRead, retry: false })
  if (!access.canRead) return <HEmptyState icon={FileText} title="Devis" description="Vous ne disposez pas de la permission de consulter les devis." />
  if (id !== 'new' && !record.data) return record.error ? <p role="alert" className="field-error">{record.error.message}<HButton onClick={() => void record.refetch()}>Réessayer</HButton></p> : <HLoadingIndicator label="Chargement du devis" />
  if (!settings.data) return settings.error ? <p role="alert" className="field-error">{settings.error.message}<HButton onClick={() => void settings.refetch()}>Réessayer</HButton></p> : <HLoadingIndicator label="Chargement des paramètres du devis" />
  return <QuoteEditor settings={settings.data} key={`${id}:${record.data?.updated || ''}`} record={record.data} />
}
function QuoteEditor({ record, settings }: { record: Quote | undefined; settings: SalesSettings }) {
  const embedded = useRecordSession()
  const formId = useId()
  const access = useSalesAccess()
  const [params] = useSearchParams(), location = useLocation(), navigate = useNavigate(), client = useQueryClient()
  const [discardVersion, setDiscardVersion] = useState(0)
  const [pdfPreview, setPdfPreview] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [key] = useState(() => crypto.randomUUID())
  const [search, setSearch] = useState(''), [error, setError] = useState(''), [cancelling, setCancelling] = useState(false), [reason, setReason] = useState('')
  const [initial] = useState<QuoteInput>(() => {
    const date = record?.quote_date.slice(0, 10) || new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
    return { discount: record?.discount || 0, discount_mode: record?.discount_mode || 'percent', terms_id: record?.terms_id || '', opportunity: record?.opportunity || params.get('opportunity') || '', title: record?.title || '', quote_date: date, valid_until: record ? record.valid_until.slice(0, 10) : quoteValidity(date, settings.validity_days), notes: record?.notes || '', lines: record?.lines.map(({ product, product_supplier, kind, description, quantity, unit, unit_price, unit_cost, discount, brand, reference, is_option, show_total, price_source, margin_percent }) => ({ product, product_supplier, kind, description, quantity, unit, unit_price, unit_cost, discount, brand, reference, is_option, show_total, price_source, margin_percent })) || [] }
  })
  const form = useForm<QuoteInput>({ defaultValues: initial })
  const values = useWatch({ control: form.control })
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)
  const editable = access.canWrite && (!record || record.status === 'draft') && access.canReadCrm
  const choices = useQuery({ queryKey: ['sales', 'opportunity-choices', search], queryFn: () => salesService.choices(search), enabled: access.canReadCrm, retry: false })
  const selected = useQuery({ queryKey: ['sales', 'chosen-opportunity', values.opportunity], queryFn: () => salesService.choice(values.opportunity || ''), enabled: !record && Boolean(values.opportunity) && access.canReadCrm, retry: false })
  const options = (choices.data || []).map((item) => ({ value: item.id, label: `${item.number} · ${item.title}` }))
  const selectedChoice = [...(choices.data || []), ...(selected.data ? [selected.data] : [])].find((item) => item.id === values.opportunity)
  if (values.opportunity && !options.some((item) => item.value === values.opportunity) && (record || selectedChoice)) options.push({ value: values.opportunity, label: record ? `${record.opportunity_number} · ${record.opportunity_name}` : `${selectedChoice!.number} · ${selectedChoice!.title}` })
  const currency = record?.currency || selectedChoice?.currency || 'EUR'
  const listQuery = typeof location.state?.quoteListQuery === 'string' ? location.state.quoteListQuery : params.get('opportunity') ? `opportunity=${params.get('opportunity')}` : ''
  const listHref = `/sales/quotes${listQuery ? `?${listQuery}` : ''}`
  async function updated(saved: Quote) { client.setQueryData(['sales', 'quote', saved.id], saved); await Promise.all([client.invalidateQueries({ queryKey: ['sales', 'quotes'] }), client.invalidateQueries({ queryKey: ['sales', 'related'] }), client.invalidateQueries({ queryKey: ['activity', 'sales_quotes'] })]); if (embedded) embedded.onSaved({ id: saved.id, label: `${saved.quote_number} · ${saved.title}` }); else if (!record) navigate(`/sales/quotes/${saved.id}`, { replace: true, state: { quoteListQuery: listQuery } }) }
  const save = useMutation({ mutationFn: (input: QuoteInput) => salesService.save(input, key, record?.id, record?.updated), onSuccess: updated })
  const cancel = useMutation({ mutationFn: () => salesService.cancel(record!.id, record!.updated, reason), onSuccess: async (saved) => { await updated(saved); setCancelling(false) } })
  const pending = save.isPending || cancel.isPending
  useEffect(() => { embedded?.report({ dirty, busy: pending }) }, [embedded, dirty, pending])
  const title = record ? record.quote_number : 'Nouveau devis'
  return <div className="contact-record sales-quote-record"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Devis', href: listHref }, { label: title }]} />
    <HRecordPageActions>{record && <HButton size="small" disabled={dirty || pending} title={dirty ? "Enregistrez le devis avant de générer un PDF" : "Aperçu et PDF du devis"} onClick={() => setPdfPreview(true)}><FileText size={14} />PDF</HButton>}<HButton variant="ghost" size="icon" title="Annuler les modifications non enregistrées" aria-label="Annuler les modifications" disabled={!editable || pending || !dirty} onClick={() => { form.reset(initial); setError(''); save.reset(); setDiscardVersion((version) => version + 1) }}><Undo2 size={14} /></HButton><HSaveButton form={formId} hasChanges={dirty} pending={save.isPending} disabled={!editable || pending}>Enregistrer</HSaveButton>{record?.status === 'draft' && editable && <HRecordActions itemName={title} active disabled={pending || dirty} actions={[{ label: 'Annuler le devis', icon: Ban, onSelect: () => setCancelling(true) }]} />}</HRecordPageActions>
    <div className="contact-record-toolbar"><div className="contact-page-heading"><h1>{title}</h1><HTag tone={record?.status === 'cancelled' ? 'navy' : 'blue'}>{quoteStatusLabels[record?.status || 'draft']}</HTag></div></div>
    {record && <p className="contact-muted">{record.company_name} · <Link to={`/crm/opportunities/${record.opportunity}`}>{record.opportunity_number} · {record.opportunity_name}</Link></p>}
    <form id={formId} onSubmit={form.handleSubmit((input) => { const parsed = quoteInputSchema.safeParse(input); if (!parsed.success) { setError(parsed.error.issues[0]?.message || 'Vérifiez les lignes du devis.'); return }; setError(''); if (dirty && editable) save.mutate(parsed.data) })}>
      <fieldset className="access-fieldset" disabled={!editable || pending}>
        <section className="contact-panel"><HSectionHeading title="Informations du devis" icon={FileText} /><div className="contact-fields">
          <label><HFieldLabel required>Opportunité</HFieldLabel><HRecordPicker resource="opportunity" createLabel="Nouvelle opportunité" canCreate={false} canInspect={access.canReadCrm} ready={Boolean(choices.data)} recordHref={(id) => `/crm/opportunities/${id}`} onSaved={async () => { await Promise.all([client.invalidateQueries({ queryKey: ['sales', 'opportunity-choices'] }), client.invalidateQueries({ queryKey: ['sales', 'chosen-opportunity'] }), client.invalidateQueries({ queryKey: ['sales', 'quote'] })]) }} label="Opportunité du devis" required value={values.opportunity || ''} options={options} onSearchChange={setSearch} showCodes={false} disabled={Boolean(record) || !editable} onChange={(id) => form.setValue('opportunity', id, { shouldDirty: true })} /></label>
          <label><HFieldLabel required>Titre du devis</HFieldLabel><HInput required maxLength={200} {...form.register('title')} /></label>
          <label><HFieldLabel required>Date du devis</HFieldLabel><HInput required type="date" {...form.register('quote_date', { onChange: (event) => { const date = String(event.target.value); if (/^\d{4}-\d{2}-\d{2}$/.test(date) && !record) form.setValue('valid_until', quoteValidity(date, settings.validity_days), { shouldDirty: true }) } })} /></label>
          <label>Valable jusqu’au<HInput type="date" {...form.register('valid_until')} /></label>
        </div></section>
        <QuoteLines recordTerms={record ? { id: record.terms_id, label: record.terms_label, content: record.terms_content } : undefined} key={discardVersion} taxRate={record && record.status !== 'draft' ? record.tax_rate : settings.default_tax_rate} form={form} editable={editable} currency={currency} settings={settings} />
      </fieldset>
      <section className="contact-panel quote-notes-panel"><HSectionHeading title="Notes" icon={StickyNote} actions={<HButton variant="ghost" size="icon" aria-label={notesOpen ? 'Masquer les notes' : 'Afficher les notes'} aria-expanded={notesOpen} aria-controls="sales-quote-notes" onClick={() => setNotesOpen((open) => !open)}>{notesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</HButton>} /><textarea id="sales-quote-notes" aria-label="Notes du devis" hidden={!notesOpen} disabled={!editable || pending} className="h-input" rows={3} {...form.register('notes')} /></section>
      {(error || save.error) && <p role="alert" className="field-error">{error || save.error?.message}</p>}
    </form>
    {record?.status === 'cancelled' && <p className="contact-muted">Motif d’annulation : {record.lost_reason}</p>}
    {(choices.error || selected.error) && <p role="alert" className="field-error">{choices.error?.message || selected.error?.message}</p>}
    {record && <ActivityPanel source={{ entity: 'sales_quotes', id: record.id }} editable={access.canWrite && record.status !== 'cancelled'} />}
    {pdfPreview && record && <DocumentPreview quoteId={record.id} onClose={() => setPdfPreview(false)} />}
    {cancelling && <HDialog open title="Annuler le devis" description="Le devis et son numéro resteront dans l’historique. Son montant sera retiré du revenu prévisionnel." onOpenChange={(open) => { if (!open && !cancel.isPending) setCancelling(false) }}><label className="h-form-field"><HFieldLabel required>Motif d’annulation</HFieldLabel><textarea className="h-input" rows={3} value={reason} onChange={(event) => setReason(event.target.value)} disabled={cancel.isPending} /></label>{cancel.error && <p role="alert" className="field-error">{cancel.error.message}</p>}<HDialogFooter><HButton disabled={cancel.isPending} onClick={() => setCancelling(false)}>Retour</HButton><HButton variant="primary" disabled={!reason.trim() || cancel.isPending} onClick={() => cancel.mutate()}>Confirmer l’annulation</HButton></HDialogFooter></HDialog>}
  </div>
}
