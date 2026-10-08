import { useRecordSession } from '../../../shared/records/recordContext'
import { OpportunityBusinessLinks } from '../components/OpportunityBusinessLinks'
import { HRecordPageActions } from '../../../shared/ui/HRecordPageActions'
import { HAmountInput } from '../../../shared/ui/HAmountInput'
import { useRecordSection } from '../../../shared/records/useRecordSection'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { tenderService } from '../services/TenderService'
import { ContactRecordPicker } from '../../contacts/components/ContactRecordPicker'
import { hasPermission } from '../../../core/auth/types/session'
import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { HTag } from '../../../shared/ui/HTag'
import { TenderFields } from '../components/TenderFields'
import { TenderAppointments } from '../components/TenderAppointments'
import { TenderSubmissions } from '../components/TenderSubmissions'
import { tenderDraft, tenderInputSchema } from '../schemas/tenders'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HTagPicker } from '../../../shared/ui/HTagPicker'
import { HRichTextEditor } from '../../../shared/ui/HRichTextEditor'
import { useReferences } from '../../settings/hooks/useReferences'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { useEffect, useId, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Target, Building2, UserRound, CircleDollarSign, CalendarDays, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HRecordActions } from '../../../shared/ui/HRecordActions'
import { HBadge } from '../../../shared/ui/HBadge'
import { HInput } from '../../../shared/ui/HInput'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { ActivityPanel } from '../../../shared/activity/ActivityPanel'
import { contactsService } from '../../contacts/services/ContactsService'
import { ReferencePicker } from '../../contacts/components/ReferencePicker'
import { crmService } from '../services/CrmService'
import { useCrmAccess, useCrmReferences } from '../hooks/useCrm'
import { formatAmount, crmRecordHref, opportunityDraft, opportunityInputSchema, type Opportunity, type OpportunityInput } from '../schemas/opportunities'
export function OpportunityPage() {
  const embedded = useRecordSession()
  const { id: routeId = 'new' } = useParams()
  const id = embedded?.id || routeId
  const access = useCrmAccess()
  const location = useLocation()
  const initialTab = ['information', 'notes', 'ao'].includes(location.state?.crmSection) ? location.state.crmSection as string : 'information'
  const [tab, setTab] = useRecordSection(embedded ? `/crm/opportunities/${id}` : location.pathname, initialTab)
  const ao = !embedded && (location.pathname.startsWith('/crm/tenders/') || id === 'new' && new URLSearchParams(location.search).get('type') === 'tender')
  const record = useQuery({ queryKey: ['crm', ao ? 'tender-record' : 'record', id], queryFn: () => ao ? tenderService.record(id) : crmService.record(id), enabled: access.canRead && id !== 'new', retry: false, refetchOnWindowFocus: false })
  if (!access.canRead) return <HEmptyState icon={Target} title="CRM" description="Vous ne disposez pas de la permission de consulter cette opportunité." />
  if (id !== 'new' && !record.data) return <>{record.error ? <p role="alert" className="field-error">{record.error.message}<HButton onClick={() => void record.refetch()}>Réessayer</HButton></p> : <HLoadingIndicator label="Chargement de la fiche" />}</>
  return <OpportunityEditor tab={tab} setTab={setTab} key={`${id}:${record.data?.updated || ''}`} record={record.data} ao={ao} />
}
function OpportunityEditor({ record, ao, tab, setTab }: { tab: string; setTab: (tab: string) => void; record: Opportunity | undefined; ao: boolean }) {
  const embedded = useRecordSession()
  const uniqueId = useId()
  const formId = embedded ? `${uniqueId}-crm-record-form` : 'crm-record-form'
  const prefix = embedded ? `${uniqueId}-crm` : 'crm'
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const { canRead, canWrite, canReadContacts, userId } = useCrmAccess()
  const { stages, owners } = useCrmReferences(canRead)
  const markets = useReferences('crm_market_types')
  const [params] = useSearchParams()
  const location = useLocation()
  const listQuery = typeof location.state?.crmListQuery === 'string' ? location.state.crmListQuery as string : ''
  const listHref = `/crm${listQuery ? `?${listQuery}` : ao ? '?area=ao' : ''}`
  const navigate = useNavigate()
  const client = useQueryClient()
  const [creationKey] = useState(() => crypto.randomUUID())
  const duplicate = params.get('duplicate')
  const copy = useQuery({ queryKey: ['crm', 'record', duplicate], queryFn: () => crmService.record(duplicate!), enabled: !record && Boolean(duplicate), retry: false })
  const form = useForm<OpportunityInput>({ defaultValues: { ...opportunityDraft(record), ...(!record ? { type: ao || params.get('type') === 'tender' ? 'tender' : 'direct', owner: userId, company: params.get('company') || '', stage: stages.data?.find((stage) => stage.active)?.id || '' } : {}) } })
  const [tender, setTender] = useState(() => tenderDraft(record?.tender))
  const [tenderError, setTenderError] = useState('')
  const [companySearch, setCompanySearch] = useState('')
  const [personSearch, setPersonSearch] = useState('')
  const values = useWatch({ control: form.control })
  const editable = canWrite && (!record || record.active)
  useEffect(() => { if (!record && !form.getValues('stage') && stages.data?.some((stage) => stage.active)) form.setValue('stage', (stages.data.find((stage) => stage.code === 'new' && stage.active) || stages.data.find((stage) => stage.active))!.id, { shouldDirty: false }) }, [stages.data, record, form])
  useEffect(() => { if (!record && copy.data) form.reset({ ...opportunityDraft(copy.data), title: `${copy.data.title} (copie)`, stage: stages.data?.find((stage) => stage.active && stage.status === 'open')?.id || '', status: 'open', owner: userId }, { keepDefaultValues: true }) }, [copy.data, record, userId, form, stages.data])
  const companies = useQuery({ queryKey: ['crm', 'company-choices', companySearch], queryFn: () => contactsService.companies({ search: companySearch, archived: false, page: 1 }), enabled: canReadContacts, retry: false })
  const selectedCompany = useQuery({ queryKey: ['contacts', 'company', values.company], queryFn: () => contactsService.company(values.company || ''), enabled: canReadContacts && Boolean(values.company), retry: false })
  const people = useQuery({ queryKey: ['crm', 'person-choices', values.company, personSearch], queryFn: () => contactsService.people({ company: values.company, search: personSearch, archived: false, page: 1 }), enabled: canReadContacts && Boolean(values.company), retry: false })
  const selectedPerson = useQuery({ queryKey: ['contacts', 'person', values.contact], queryFn: () => contactsService.person(values.contact || ''), enabled: canReadContacts && Boolean(values.contact), retry: false })
  const personOptions = people.data?.items.map((person) => ({ value: person.id, label: `${person.first_name} ${person.last_name}`.trim() })) || []
  if (selectedPerson.data && !personOptions.some((person) => person.value === selectedPerson.data.id)) personOptions.push({ value: selectedPerson.data.id, label: `${selectedPerson.data.first_name} ${selectedPerson.data.last_name}`.trim() })
  if (record?.expand?.contact && !personOptions.some((person) => person.value === record.contact)) personOptions.push({ value: record.contact, label: `${record.expand.contact.first_name} ${record.expand.contact.last_name}`.trim() })
  const companyOptions = companies.data?.items.map((company) => ({ value: company.id, label: company.name })) || []
  const companyName = selectedCompany.data?.name || (record?.company === values.company ? record?.expand?.company?.name : '')
  if (values.company && companyName && !companyOptions.some((company) => company.value === values.company)) companyOptions.push({ value: values.company, label: companyName })
  const listParams = new URLSearchParams(listQuery)
  const navigation = useQuery({ queryKey: ['crm', 'record-navigation', listQuery], queryFn: () => (ao ? tenderService : crmService).list({ search: listParams.get('q') || '', archived: listParams.get('state') === 'archived', page: Number(listParams.get('page')) || 1, status: listParams.get('status') || '', company: listParams.get('company') || '', owner: listParams.get('owner') || '', sort: listParams.get('sort') || '-created', type: listParams.get('area') === 'ao' ? 'tender' : listParams.get('type') || '', preparationStatus: listParams.get('preparation') || '', tag: listParams.get('tag') || '' }), enabled: Boolean(record), retry: false })
  const position = navigation.data?.items.findIndex((item) => item.id === record?.id) ?? -1
  async function refresh() { await client.invalidateQueries({ queryKey: ['crm'] }); await client.invalidateQueries({ queryKey: ['activity'] }); await client.invalidateQueries({ queryKey: ['calendar'] }) }
  const save = useMutation({ mutationFn: (input: OpportunityInput) => ao ? tenderService.save(input, tender, creationKey, record ? { id: record.id, updated: record.updated, linked_updated: record.linked_updated } : undefined) : crmService.save(input, creationKey, record ? { id: record.id, updated: record.updated } : undefined, input.type === 'tender' ? tender : undefined, record?.tender?.updated), onSuccess: async (saved) => { form.reset(opportunityDraft(saved)); client.setQueryData(['crm', saved.record_kind === 'tender' ? 'tender-record' : 'record', saved.id], saved); if (embedded) embedded.onSaved({ id: saved.id, label: `${saved.opportunity_number} · ${saved.title}` }); else if (!record) navigate(crmRecordHref(saved), { replace: true, state: { crmListQuery: listQuery, crmSection: tab } }); await refresh() } })
  const archive = useMutation({ mutationFn: (active: boolean) => ao ? tenderService.archive(record!.id, active, record!.updated) : crmService.archive(record!.id, active), onSuccess: refresh })
  const busy = save.isPending || archive.isPending
  const hasChanges = form.formState.isDirty || values.type === 'tender' && JSON.stringify(tender) !== JSON.stringify(tenderDraft(record?.tender))
  useEffect(() => { embedded?.report({ dirty: hasChanges, busy }) }, [embedded, hasChanges, busy])
  const title = record ? record.title : ao ? 'Nouvel appel d’offres' : 'Nouvelle opportunité'
  const aoStages = useReferences('crm_tender_statuses', ao)
  const savedPreparation = aoStages.data?.find((stage) => stage.id === record?.tender?.status)
  const savedStage = stages.data?.find((stage) => stage.id === record?.stage) ?? record?.expand?.stage
  function submit(input: OpportunityInput) {
    form.clearErrors()
    const parsed = opportunityInputSchema.safeParse(input)
    if (!parsed.success) { for (const issue of parsed.error.issues) { const field = issue.path[0]; if (typeof field === 'string' && field in input) form.setError(field as keyof OpportunityInput, { message: issue.message }) }; return }
    if (input.type === 'tender') { const ao = tenderInputSchema.safeParse(tender); if (!ao.success) { setTenderError('Vérifiez le dossier AO et son étape de préparation.'); setTab('ao'); return } }
    setTenderError(''); save.mutate(parsed.data)
  }
  const field = (name: 'title' | 'expected_date' | 'estimated_value' | 'estimated_cost' | 'probability', label: string, type = 'text') => <label htmlFor={`${prefix}-${name}`}><HFieldLabel required={name !== 'expected_date'}>{label}</HFieldLabel>{name === 'estimated_value' || name === 'estimated_cost' ? <Controller name={name} control={form.control} render={({ field: input }) => <HAmountInput {...input} id={`${prefix}-${name}`} aria-label={label} currency={values.currency || 'EUR'} min={0} aria-required aria-invalid={Boolean(form.formState.errors[name])} />} /> : <HInput id={`${prefix}-${name}`} aria-required={name !== 'expected_date'} type={type} min={type === 'number' ? 0 : undefined} max={name === 'probability' ? 100 : undefined} step={name === 'probability' ? 1 : type === 'number' ? 0.01 : undefined} {...form.register(name, { valueAsNumber: type === 'number' })} aria-invalid={Boolean(form.formState.errors[name])} />}{form.formState.errors[name] && <span className="field-error">{form.formState.errors[name]?.message}</span>}</label>
  return <div className="contact-record contact-record--form-layout crm-record">{!embedded && <HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'CRM', href: listHref }, { label: record ? record.opportunity_number ? `#${record.opportunity_number}` : record.tender?.reference || record.title : title }]} />}
    {!embedded && record && navigation.data && position >= 0 && <HBreadcrumbActions><nav className="record-navigator" aria-label="Navigation des opportunités"><span className="record-navigator-count">{((navigation.data.page - 1) * 100) + position + 1} / {navigation.data.totalItems}</span>{(['previous', 'next'] as const).map((direction) => { const target = navigation.data.items[position + (direction === 'previous' ? -1 : 1)]; return <HButton key={direction} size="icon" variant="ghost" aria-label={direction === 'previous' ? 'Opportunité précédente' : 'Opportunité suivante'} disabled={!target || hasChanges || busy} onClick={() => target && navigate(crmRecordHref(target), { replace: true, state: { crmListQuery: listQuery } })}>{direction === 'previous' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}</HButton> })}</nav></HBreadcrumbActions>}
    <div className="contact-record-toolbar"><div className="contact-page-heading"><h1>{title}</h1>{values.type === 'tender' && <HTag tone="violet">AO</HTag>}{record && (!record.active ? <HBadge tone="neutral">Archivée</HBadge> : ao && savedPreparation ? <HTag tone={savedPreparation.tone || 'blue'} color={savedPreparation.color}>{savedPreparation.label}</HTag> : savedStage ? <HTag tone={savedStage.tone} color={savedStage.color}>{savedStage.label}</HTag> : <HBadge tone="neutral">Étape indisponible</HBadge>)}</div><HRecordPageActions inline={Boolean(embedded)}>{!embedded && !record && <HButton asChild><Link to={listHref}>Annuler</Link></HButton>}{editable && <HSaveButton form={formId} hasChanges={hasChanges} pending={save.isPending} disabled={busy}>Enregistrer</HSaveButton>}{!embedded && record && canWrite && !(ao && record.tender?.archived_at) && <HRecordActions itemName={record.title} active={record.active} disabled={busy || hasChanges} onArchive={() => archive.mutateAsync(false)} onRestore={() => archive.mutate(true)} {...(!ao ? { onDuplicate: () => navigate(`/crm/opportunities/new?duplicate=${record.id}`, { state: { crmListQuery: listQuery } }), onDelete: () => crmService.remove(record.id) } : {})} />}</HRecordPageActions></div>
    {record && <div className="crm-record-summary"><span><Building2 size={14} />{record.expand?.company?.name || 'Société'}</span><span><CircleDollarSign size={14} />{formatAmount(record.estimated_value, record.currency)}</span><span><CalendarDays size={14} />{record.expected_date ? new Date(record.expected_date.replace(' ', 'T')).toLocaleDateString('fr-FR') : 'Sans échéance'}</span><span><UserRound size={14} />{record.expand?.owner?.name || 'Responsable'}</span>{record.opportunity_number && <span title="Compte analytique de l’affaire">Compte analytique · {record.opportunity_number}</span>}</div>}
    {[save.error, archive.error, stages.error, owners.error, companies.error, selectedCompany.error, people.error, selectedPerson.error, markets.error, copy.error].filter(Boolean).map((error, index) => <p className="field-error" role="alert" key={index}>{error?.message}</p>)}
    {Object.keys(form.formState.errors).length > 0 && <p role="alert" className="field-error">Vérifiez les champs du formulaire.</p>}
    {tenderError && <p role="alert" className="field-error">{tenderError}</p>}
    {!canReadContacts && <p className="contact-muted">La permission Contacts en lecture est nécessaire pour sélectionner une société et un contact.</p>}
    {ao && !record?.tender?.opportunity && <p className="contact-muted">À analyser et No go : dossier seul. En préparation : création de l’opportunité liée et de son compte analytique.</p>}
    {ao && record?.tender?.opportunity && <p className="contact-muted">Opportunité liée <Link to={`/crm/opportunities/${record.tender.opportunity}`}>#{record.opportunity_number}</Link> · Son historique reste conservé si le dossier passe en No go.</p>}
    {record && values.type !== record.type && <p className="contact-muted" role="status">{values.type === 'direct' ? 'À l’enregistrement, le dossier AO sera archivé. Ses dates, documents et réponses seront conservés.' : record.tender ? 'À l’enregistrement, le dossier AO existant sera réactivé avec son historique.' : 'À l’enregistrement, un dossier AO sera créé pour cette même opportunité.'}</p>}
    {!embedded && record && (!ao || record.tender?.opportunity) && <OpportunityBusinessLinks id={ao ? record.tender!.opportunity : record.id} active={record.active} dirty={hasChanges} busy={busy} />}
    <div className="contact-record-sheet"><HRecordTabs label="Sections de l’opportunité" idPrefix={`${prefix}-tab`} value={tab} onChange={setTab} items={[{ value: 'information', label: 'Informations', panel: `${prefix}-information` }, { value: 'notes', label: 'Description', panel: `${prefix}-notes` }, ...(values.type === 'tender' ? [{ value: 'ao', label: 'Dossier AO', panel: `${prefix}-ao` }] : [])]} />
    <form id={formId} onSubmit={form.handleSubmit(submit)}><fieldset className="contact-record-layout crm-form-layout" disabled={!editable || busy}>
      <div id={`${prefix}-information`} role="tabpanel" aria-labelledby={`${prefix}-tab-information`} hidden={tab !== 'information'} className="crm-form-panels">
        <section className="contact-panel"><HSectionHeading title={ao ? "Appel d’offres" : "Opportunité"} icon={Target} /><div className="contact-fields">{!ao && <label><HFieldLabel required>Type d’opportunité</HFieldLabel><Controller name="type" control={form.control} render={({ field }) => <HCombobox label="Type d’opportunité" value={field.value} required showCodes={false} disabled={!editable || busy} options={[{ value: 'direct', label: 'Directe' }, { value: 'tender', label: 'Appel d’offres' }]} onChange={field.onChange} />} /></label>}<label htmlFor={`${prefix}-number`}>Numéro<HInput id={`${prefix}-number`} value={record?.opportunity_number || ''} placeholder={ao ? "Attribué à la décision de répondre" : "Attribué à l’enregistrement"} readOnly /></label>{field('title', 'Titre')}<div className="h-form-field"><span>Types de marché</span><Controller name="market_types" control={form.control} render={({ field: input }) => <HTagPicker label="Types de marché" value={input.value} onChange={input.onChange} options={(markets.data || []).filter((market) => market.active || input.value.includes(market.id)).map((market) => ({ value: market.id, label: market.label, tone: market.tone || 'blue', color: market.color, disabled: !market.active }))} disabled={!editable || busy || markets.isPending || Boolean(markets.error)} />} /></div>{(!ao || record?.tender?.opportunity) && <label htmlFor={`${prefix}-stage`}><HFieldLabel required>Étape commerciale</HFieldLabel><Controller name="stage" control={form.control} render={({ field: input }) => <HCombobox id={`${prefix}-stage`} label="Étape commerciale" value={input.value} onChange={(value) => { input.onChange(value); form.setValue('status', stages.data?.find((stage) => stage.id === value)?.status || 'open', { shouldDirty: true }) }} options={(stages.data || []).filter((stage) => stage.active || stage.id === input.value).map((stage) => ({ value: stage.id, label: stage.label, disabled: !stage.active }))} showCodes={false} disabled={!editable || busy} required />} />{form.formState.errors.stage && <span className="field-error">{form.formState.errors.stage.message}</span>}</label>}</div></section>
        <section className="contact-panel"><HSectionHeading title="Société et interlocuteurs" icon={Building2} /><div className="contact-fields"><label htmlFor="crm-company"><HFieldLabel required>Société</HFieldLabel><Controller name="company" control={form.control} render={({ field: input }) => <ContactRecordPicker resource="company" inspectDisabled={busy} ready={!companies.isPending && !companies.error} id="crm-company" label="Société" value={input.value} onSearchChange={setCompanySearch} onChange={(value) => { input.onChange(value); form.setValue('contact', '', { shouldDirty: true }) }} options={companyOptions} showCodes={false} disabled={!editable || busy || !canReadContacts} required />} />{form.formState.errors.company && <span className="field-error">{form.formState.errors.company.message}</span>}</label><label htmlFor="crm-contact">Contact<Controller name="contact" control={form.control} render={({ field: input }) => <ContactRecordPicker resource="person" onRecordSaved={async (id) => { const person = await contactsService.person(id); if (person.company !== form.getValues('company')) form.setValue('company', person.company, { shouldDirty: true }) }} inspectDisabled={busy} ready={!people.isPending && !people.error} initial={{ company: values.company || '' }} id="crm-contact" label="Contact" value={input.value} onSearchChange={setPersonSearch} onChange={input.onChange} options={personOptions} showCodes={false} emptyLabel="Sans contact" disabled={!editable || busy || !values.company} />} /></label><label htmlFor="crm-owner"><HFieldLabel required>Responsable</HFieldLabel><Controller name="owner" control={form.control} render={({ field: input }) => <HCombobox id="crm-owner" label="Responsable" value={input.value} onChange={input.onChange} options={(owners.data || []).map((owner) => ({ value: owner.id, label: owner.name }))} showCodes={false} required disabled={!editable || busy} />} />{form.formState.errors.owner && <span className="field-error">{form.formState.errors.owner.message}</span>}</label></div></section>
        <section className="contact-panel"><HSectionHeading title="Prévision commerciale" icon={CircleDollarSign} /><div className="contact-fields">{field('estimated_value', 'Montant estimé', 'number')}{field('estimated_cost', 'Coût estimé', 'number')}{field('probability', 'Probabilité (%)', 'number')}{field('expected_date', 'Échéance prévue', 'date')}<label htmlFor="crm-currency"><HFieldLabel required>Devise</HFieldLabel><Controller name="currency" control={form.control} render={({ field: input }) => <ReferencePicker id="crm-currency" label="Devise" required catalog="accounting_currencies" value={input.value} onChange={input.onChange} disabled={!editable || busy} invalid={Boolean(form.formState.errors.currency)} />} />{form.formState.errors.currency && <span className="field-error">Choisissez une devise.</span>}</label><div className="crm-margin-preview"><span>Marge estimée</span><strong>{formatAmount((Number(values.estimated_value) || 0) - (Number(values.estimated_cost) || 0), values.currency || 'EUR')}</strong><small>Calculée et vérifiée à l’enregistrement</small></div></div></section>
      </div>
      <section className="contact-panel" id={`${prefix}-notes`} role="tabpanel" aria-labelledby={`${prefix}-tab-notes`} hidden={tab !== 'notes'}><HSectionHeading title="Description" icon={FileText} description="Précisez le contexte, les besoins et les objectifs de cette affaire." /><Controller name="description_content" control={form.control} render={({ field: input }) => <HRichTextEditor label="Contexte et besoins" value={input.value} text={values.description || ''} disabled={!editable || busy} onChange={(content, text) => { input.onChange(content); form.setValue('description', text, { shouldDirty: true }) }} />} />{form.formState.errors.description && <p className="field-error">La description ne doit pas dépasser 10 000 caractères.</p>}</section>
      {values.type === 'tender' && <div id={`${prefix}-ao`} role="tabpanel" aria-labelledby={`${prefix}-tab-ao`} hidden={tab !== 'ao'}><TenderFields value={tender} onChange={setTender} disabled={!editable || busy} /></div>}
    </fieldset></form>{values.type === 'tender' && tab === 'ao' && <div className="crm-form-panels crm-ao-followup"><TenderAppointments tender={record?.tender} editable={editable && !hasChanges && !busy} hrAllowed={session.status === 'authenticated' && hasPermission(session.user, 'hr.read')} />{record?.tender && <TenderSubmissions tender={record.tender} editable={editable && Boolean(record.tender.opportunity) && !hasChanges && !busy} />}</div>}</div>
    {record && <ActivityPanel source={ao || record.type === 'tender' && record.tender ? { entity: 'crm_tenders', id: ao ? record.id : record.tender!.id } : { entity: 'crm_opportunities', id: record.id }} editable={editable} />}
  </div>
}
