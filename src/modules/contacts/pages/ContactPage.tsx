import { HRecordPageActions } from '../../../shared/ui/HRecordPageActions'
import { useRecordSection } from '../../../shared/records/useRecordSection'
import { useRecordSession } from '../../../shared/records/recordContext'
import { ContactRecordPicker } from '../components/ContactRecordPicker'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { useState, useSyncExternalStore, useId, useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { Building2, UserRound, Phone, MapPin, Fingerprint, SlidersHorizontal, StickyNote, ChevronDown, Mail, Globe } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { ActivityPanel } from '../../../shared/activity/ActivityPanel'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HRecordDuplication } from '../../../shared/ui/HRecordDuplication'
import { HRecordActions } from '../../../shared/ui/HRecordActions'
import { companyDuplicate, personDuplicate } from '../schemas/contactDuplication'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HInput } from '../../../shared/ui/HInput'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HBadge } from '../../../shared/ui/HBadge'
import { contactsService, CompanyAddressSaveError, CompanyRolesSaveError, CompanyAccountingSaveError } from '../services/ContactsService'
import { addressInputSchema, companyInputSchema, personInputSchema, roleValues } from '../schemas/contacts'
import { CompanyLookup } from '../components/CompanyLookup'
import { CompanyBusinessLinks } from '../components/CompanyBusinessLinks'
import { ReferencePicker } from '../components/ReferencePicker'
import { CompanyPeople } from '../components/CompanyPeople'
import { ContactRecordNavigator } from '../components/ContactRecordNavigator'
import { directoryContext, directoryHref } from '../navigationContext'
import { ContactImageEditor } from '../components/ContactImageEditor'
import { CompanyRoleChoices } from '../components/CompanyRelations'
import { CompanyAddresses, type AddressDraft } from '../components/CompanyAddresses'
import { AddressFields } from '../components/AddressFields'
import type { Address, AddressInput, Company, CompanyInput, Person, PersonInput, ContactKind, ContactFiles } from '../types/contacts'

import { accountDraftSchema, type AccountDraft } from '../../accounting/schemas/thirdPartyAccounts'

type FormValues = CompanyInput & PersonInput & AccountDraft
const fields = {
  name: { label: 'Nom usuel', placeholder: 'Nom de la société' }, legal_name: { label: 'Raison sociale', placeholder: 'Dénomination légale' },
  first_name: { label: 'Prénom', placeholder: 'Prénom' }, last_name: { label: 'Nom', placeholder: 'Nom' }, job_title: { label: 'Fonction', placeholder: 'Responsable, directeur…' },
  email: { label: 'E-mail', placeholder: 'contact@societe.fr', type: 'email' }, phone: { label: 'Téléphone', placeholder: '+33 …', type: 'tel' }, mobile: { label: 'Mobile', placeholder: '+33 …', type: 'tel' },
  website: { label: 'Site web', placeholder: 'https://…', type: 'url' }, vat_number: { label: 'Numéro de TVA', placeholder: 'FR…' }, lei: { label: 'LEI', placeholder: '20 caractères alphanumériques' },
  customer_account: { label: 'Compte client', placeholder: '411100' }, supplier_account: { label: 'Compte fournisseur', placeholder: '401100' },
  billing_email: { label: 'E-mail de facturation', placeholder: 'facturation@societe.fr', type: 'email' }, einvoice_routing_address: { label: 'Adresse électronique de facturation', placeholder: 'Adresse inscrite dans l’annuaire' }, einvoice_platform: { label: 'Plateforme agréée du tiers', placeholder: 'Nom de la plateforme' }, einvoice_service_code: { label: 'Code service destinataire', placeholder: 'Si nécessaire, notamment Chorus Pro' },
  siren: { label: 'SIREN', placeholder: '9 chiffres' }, siret: { label: 'SIRET', placeholder: '14 chiffres' },
}

function ContactEditor({ kind, record, addresses, accounts, canWrite, duplicateSource, duplicateAddress, section, setSection }: { section: string; setSection: (section: string) => void; accounts: AccountDraft; duplicateSource?: Company | Person | undefined; duplicateAddress?: Address | undefined; kind: ContactKind; record?: Company | Person | undefined; addresses: Address[]; canWrite: boolean }) {
  const embedded = useRecordSession()
  const uniqueId = useId()
  const formId = embedded ? `${uniqueId}-contact-record-form` : 'contact-record-form'
  const prefix = embedded ? `${uniqueId}-contact` : 'contact'
  const navigate = useNavigate()
  const location = useLocation()
  const directory = directoryContext(location.state, kind)
  const [searchParams, setSearchParams] = useSearchParams()
  const client = useQueryClient()
  const [companySearch, setCompanySearch] = useState('')
  const [chosenCompany, setChosenCompany] = useState<Company>()
  const [changingRecord, setChangingRecord] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [files, setFiles] = useState<ContactFiles>({})
  const source = record ?? duplicateSource
  const initialRoles = source && 'name' in source ? source.expand?.contacts_company_roles_via_company?.filter((role) => role.active).map((role) => role.role) ?? [] : []
  const [draftRoles, setDraftRoles] = useState<(typeof roleValues[number])[]>(!record && embedded?.initial?.roles === 'supplier' ? ['supplier'] : initialRoles)
  const rolesChanged = kind === 'companies' && roleValues.some((role) => initialRoles.includes(role) !== draftRoles.includes(role))
  const [stagedCompany, setStagedCompany] = useState<Company>()
  const readiness = useQuery({ queryKey: ['contacts', 'revision'], queryFn: () => contactsService.ready(), retry: false })
  const editable = readiness.isSuccess && canWrite && (!record || record.active)
  const company = record && 'name' in record ? record : undefined
  const person = record && 'first_name' in record ? record : undefined
  const relatedCompany = company ?? person?.expand?.company
  const peopleCount = useQuery({ queryKey: ['contacts', 'company-people-count', company?.id], queryFn: () => contactsService.companyPeopleCount(company!.id), enabled: Boolean(company), staleTime: 10_000, retry: false })
  const addressCount = addresses.length + (company?.billing_email ? 1 : 0)
  const registered = addresses.filter((address) => address.type === 'registered')
  const primaryAddress = registered.find((address) => address.is_primary) ?? (registered.length === 1 ? registered[0] : undefined)
  const initialExtraDrafts: AddressDraft[] = addresses.filter((address) => address.id !== primaryAddress?.id).map((address) => ({ key: address.id, id: address.id, input: addressInputSchema.parse(address) }))
  const [addressDrafts, setAddressDrafts] = useState<AddressDraft[]>(initialExtraDrafts)
  const [addressError, setAddressError] = useState('')
  const [primaryCreationId] = useState(() => crypto.randomUUID().replace(/-/g, '').slice(0, 15))
  const extraChanges = addressDrafts.filter((draft) => !draft.id || JSON.stringify(draft.input) !== JSON.stringify(initialExtraDrafts.find((item) => item.id === draft.id)?.input))
  const form = useForm<FormValues>({ defaultValues: { name: '', legal_name: '', vat_number: '', lei: '', billing_email: '', einvoice_routing_address: '', einvoice_platform: '', einvoice_service_code: '', einvoice_status: 'unknown', ...accounts, preferred_language: 'fr', siren: '', siret: '', default_currency: 'EUR', website: '', phone: '', email: '', notes: '', company: embedded?.initial?.company ?? (embedded ? '' : searchParams.get('company') ?? ''), first_name: '', last_name: '', job_title: '', mobile: '', ...(embedded?.initial?.search ? kind === 'companies' ? { name: embedded.initial.search } : { last_name: embedded.initial.search } : {}), ...(duplicateSource ? 'name' in duplicateSource ? companyDuplicate(duplicateSource) : personDuplicate(duplicateSource) : record) } })
  const companyName = useWatch({ control: form.control, name: 'name' })
  const selectedCompanyId = useWatch({ control: form.control, name: 'company' })
  const addressForm = useForm<AddressInput>({ defaultValues: { type: 'registered', label: '', email: '', line1: '', line2: '', postal_code: '', city: '', country: '', state_region: '', ...(primaryAddress ?? (duplicateAddress ? addressInputSchema.parse(duplicateAddress) : undefined)), company: company?.id ?? 'pending', is_primary: true } })
  const billingEmail = useWatch({ control: form.control, name: 'billing_email' })
  const primaryDraft = useWatch({ control: addressForm.control })
  const allAddressDrafts: AddressDraft[] = [...(primaryAddress || primaryDraft.line1 || primaryDraft.email ? [{ key: 'primary', ...(primaryAddress ? { id: primaryAddress.id } : {}), input: addressForm.getValues() }] : []), ...addressDrafts, ...([{ field: 'billing_email', value: billingEmail, label: 'E-mail de facturation', type: 'billing' }] as const).filter((item) => item.value || company?.[item.field]).map((item) => ({ key: item.field, virtual: item.field, input: { company: company?.id ?? 'pending', type: item.type, label: item.label, email: item.value, line1: '', line2: '', postal_code: '', city: '', country: '', state_region: '', is_primary: false } }))]
  const companies = useQuery({ queryKey: ['contacts', 'company-options', companySearch], queryFn: () => contactsService.companies({ search: companySearch, page: 1, archived: false }), enabled: kind === 'people' && editable, retry: false })
  const preselectedCompany = useQuery({ queryKey: ['contacts', 'companies', searchParams.get('company')], queryFn: () => contactsService.company(searchParams.get('company')!), enabled: !embedded && kind === 'people' && !record && Boolean(searchParams.get('company')), retry: false })
  const selectedCompanyRecord = useQuery({ queryKey: ['contacts', 'companies', selectedCompanyId], queryFn: () => contactsService.company(selectedCompanyId), enabled: kind === 'people' && Boolean(selectedCompanyId), retry: false })
  const selectedCompany = selectedCompanyRecord.data ?? chosenCompany ?? person?.expand?.company ?? (duplicateSource && 'first_name' in duplicateSource ? duplicateSource.expand?.company : undefined) ?? preselectedCompany.data
  const companyOptions = companies.data?.items ?? []
  const save = useMutation({
    mutationFn: async ({ input, address }: { input: FormValues; address?: AddressInput | undefined }) => kind === 'companies'
      ? contactsService.saveCompanyDetails(companyInputSchema.parse(input), files, address, record?.id ?? stagedCompany?.id, primaryAddress?.id, draftRoles, accountDraftSchema.parse(input), extraChanges.map((draft) => ({ ...(draft.id ? { id: draft.id } : { creation_id: draft.key }), input: draft.input })), primaryCreationId)
      : contactsService.savePerson(personInputSchema.parse(input), files, record?.id),
    onSuccess: async (saved) => { setFiles({}); await client.cancelQueries({ queryKey: ['contacts'] }); await client.invalidateQueries({ queryKey: ['contacts'] }); await client.invalidateQueries({ queryKey: ['activity'] }); if (embedded) embedded.onSaved({ id: saved.id, label: 'name' in saved ? saved.name : [saved.first_name, saved.last_name].filter(Boolean).join(' ') }); else navigate(`/contacts/${kind}/${saved.id}${section !== 'information' ? `?section=${section}` : ''}`, { replace: true, state: location.state }) },
    onError: (error) => { if (error instanceof CompanyAddressSaveError || error instanceof CompanyRolesSaveError || error instanceof CompanyAccountingSaveError) { setStagedCompany(error.company); setFiles({}) } },
  })
  const archive = useMutation({ mutationFn: (active: boolean) => contactsService.setActive(kind, record!.id, active), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['contacts'] }); await client.invalidateQueries({ queryKey: ['activity'] }) } })
  const deletion = useMutation({ mutationFn: () => contactsService.deleteRecord(kind, record!.id), onSuccess: async () => { await client.cancelQueries({ queryKey: ['contacts'] }); client.removeQueries({ queryKey: ['contacts', kind, record!.id] }); navigate(kind === 'companies' ? '/contacts' : '/contacts/people', { replace: true }); await client.invalidateQueries({ queryKey: ['contacts'] }) } })
  const busy = save.isPending || archive.isPending || deletion.isPending
  const hasChanges = Boolean(!record && embedded?.initial?.search) || form.formState.isDirty || (kind === 'companies' && addressForm.formState.isDirty) || Boolean(files.image || files.removeImage) || rolesChanged || Boolean(stagedCompany) || Boolean(duplicateSource) || extraChanges.length > 0
  useEffect(() => { embedded?.report({ dirty: hasChanges, busy }) }, [embedded, hasChanges, busy])
  const title = record ? company ? company.name : [person?.first_name, person?.last_name].filter(Boolean).join(' ') : stagedCompany?.name ?? (kind === 'companies' ? 'Nouvelle société' : 'Nouveau contact')

  async function submit(input: FormValues) {
    if (!hasChanges || busy) return
    setAddressError('')
    for (const draft of extraChanges) { const parsedDraft = addressInputSchema.safeParse(draft.input); if (!parsedDraft.success) { setSection('addresses'); setAddressError(`${draft.input.label || draft.input.email || 'Adresse'} : ${parsedDraft.error.issues[0]?.message}`); return } }
    form.clearErrors()
    addressForm.clearErrors()
    const parsed = (kind === 'companies' ? companyInputSchema : personInputSchema).safeParse(input)
    const parsedAccounts = accountDraftSchema.safeParse(input)
    if (kind === 'companies' && !parsedAccounts.success) { setSection('accounting'); for (const issue of parsedAccounts.error.issues) { const name = issue.path[0]; if (name === 'customer_account' || name === 'supplier_account') form.setError(name, { message: issue.message }, { shouldFocus: true }) }; return }
    if (!parsed.success) { setSection(parsed.error.issues.some((issue) => String(issue.path[0]).startsWith('einvoice_') || issue.path[0] === 'billing_email') ? 'accounting' : 'information'); for (const issue of parsed.error.issues) { const name = issue.path[0]; if (name === 'notes' || (typeof name === 'string' && name in fields)) form.setError(name as keyof FormValues, { message: issue.message }, { shouldFocus: true }) }; return }
    let address: AddressInput | undefined
    if (kind === 'companies') {
      const values = addressForm.getValues()
      const hasAddress = Boolean(primaryAddress || values.line1 || values.line2 || values.postal_code || values.city || values.country || values.state_region || values.email)
      if (hasAddress) {
        const parsedAddress = addressInputSchema.safeParse(values)
        if (!parsedAddress.success) { if (section === 'addresses') setAddressError(`Adresse du siège : ${parsedAddress.error.issues[0]?.message}`); else setSection('information'); for (const issue of parsedAddress.error.issues) { const name = issue.path[0]; if (name === 'line1' || name === 'line2' || name === 'postal_code' || name === 'city' || name === 'country' || name === 'state_region') addressForm.setError(name, { message: issue.message }, { shouldFocus: true }) }; return }
        if (!primaryAddress || addressForm.formState.isDirty || !primaryAddress.is_primary) address = parsedAddress.data
      }
    }
    await save.mutateAsync({ input, address }).catch(() => {})
  }

  function renderField(name: keyof typeof fields) {
    const field = fields[name]
    return <label key={name} htmlFor={`${prefix}-${name}`}><HFieldLabel required={name === 'name'}>{field.label}</HFieldLabel><HInput id={`${prefix}-${name}`} aria-required={name === 'name'} type={'type' in field ? field.type : 'text'} placeholder={field.placeholder} {...form.register(name)} aria-invalid={Boolean(form.formState.errors[name])} aria-describedby={form.formState.errors[name] ? `error-${name}` : undefined} />{form.formState.errors[name] && <span className="field-error" id={`error-${name}`}>{form.formState.errors[name]?.message}</span>}</label>
  }

  function openSection(value: string) {
    setSection(value)
    if (company && !embedded) setSearchParams((params) => { if (value === 'addresses' || value === 'contacts') params.set('section', value); else params.delete('section'); return params }, { replace: true, state: location.state })
    if (value === 'notes') document.getElementById(`${prefix}-record-notes`)?.setAttribute('open', '')
  }

  const lookupAction = kind === 'companies' && canWrite && <CompanyLookup getInitialQuery={() => form.getValues('siret') || form.getValues('siren') || form.getValues('legal_name') || form.getValues('name')} disabled={!editable || busy} onApply={(proposal, selectedFields, includeAddress) => { setSection('information'); for (const field of selectedFields) { const value = proposal.fields[field]; if (value !== undefined) form.setValue(field, value, { shouldDirty: true }) }; if (includeAddress && proposal.address) for (const field of ['line1', 'line2', 'postal_code', 'city', 'country'] as const) addressForm.setValue(field, proposal.address[field], { shouldDirty: true }) }} />

  const addressPanel = kind === 'companies' ? <section className="contact-panel contact-primary-address"><HSectionHeading title="Adresse du siège" icon={MapPin} description={primaryAddress ? 'Adresse principale de la société.' : 'Renseignez l’adresse principale de la société.'} /><AddressFields form={addressForm} prefix={embedded ? `${prefix}-primary-address` : 'primary-address'} disabled={!editable || busy} /></section> : null
  const preferencesPanel = kind === 'companies' ? <section className="contact-panel contact-preferences-panel"><HSectionHeading title="Préférences" icon={SlidersHorizontal} /><div className="contact-fields">{(['preferred_language', 'default_currency'] as const).map((name) => <label key={name} htmlFor={`${prefix}-${name}`}>{name === 'preferred_language' ? 'Langue' : 'Devise'}<Controller name={name} control={form.control} render={({ field }) => <ReferencePicker id={`${prefix}-${name}`} label={name === 'preferred_language' ? 'Langue' : 'Devise'} catalog={name === 'preferred_language' ? 'settings_languages' : 'accounting_currencies'} value={field.value} onChange={field.onChange} disabled={!editable || busy} invalid={Boolean(form.formState.errors[name])} />} /></label>)}</div></section> : null

  return <div className={`contact-record contact-record--form-layout${!record ? ' contact-record--creating' : ''}`} data-section={section} inert={changingRecord} aria-busy={changingRecord}>
    {!embedded && <HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Contacts', href: directoryHref(directory, kind), state: directory ? { contactDirectory: directory } : undefined }, { label: title }]} />}
    <div className="contact-record-toolbar"><div className="contact-title-group" hidden={Boolean(embedded && !record)}><div className="contact-page-heading"><h1>{title}</h1>{record && <HBadge tone={record.active ? 'success' : 'neutral'}>{record.active ? 'Actif' : 'Archivé'}</HBadge>}</div></div><HRecordPageActions inline={Boolean(embedded)} inert={changingRecord}>

      {!embedded && !record && <HButton asChild><Link to={directoryHref(directory, kind)} state={directory ? { contactDirectory: directory } : undefined}>Annuler</Link></HButton>}
      {editable && <HSaveButton form={formId} hasChanges={hasChanges} pending={save.isPending} disabled={busy}>{save.isPending ? 'Enregistrement…' : 'Enregistrer'}</HSaveButton>}
      {!embedded && canWrite && record && <HRecordActions itemName={title} active={record.active} disabled={busy || (hasChanges && record.active)} onArchive={() => archive.mutateAsync(false)} onRestore={() => { if (window.confirm('Réactiver cette fiche ?')) archive.mutate(true) }} onDuplicate={() => setDuplicating(true)} onDelete={() => deletion.mutateAsync()} />}
    </HRecordPageActions></div>
    {duplicating && record && <HRecordDuplication title={kind === 'companies' ? 'Dupliquer la société' : 'Dupliquer le contact'} itemName={title} onClose={() => setDuplicating(false)} onDuplicate={() => { setDuplicating(false); navigate(`/contacts/${kind}/new?duplicate=${record.id}`, { state: directory ? { contactDirectory: directory } : undefined }) }} />}
    <div className="contact-record-sheet">
    {!embedded && relatedCompany && <CompanyBusinessLinks company={relatedCompany} person={Boolean(person)} busy={busy || changingRecord} />}
    {readiness.isPending && <HLoadingIndicator inline label="Vérification du module Contacts…" />}
    {readiness.error && <p role="alert" className="field-error">{readiness.error.message}<HButton onClick={() => { void readiness.refetch() }}>Réessayer</HButton></p>}
    {archive.error && record && !record.active && <p role="alert" className="field-error">{archive.error.message}</p>}
    {save.error && <div role="alert" className="contact-save-error">{save.error.message}</div>}
    {(record || kind === 'companies') && <HRecordTabs label="Sections de la fiche" idPrefix={`${prefix}-tab`} value={section} onChange={openSection} items={[{ value: 'information', label: 'Informations', count: undefined, panel: formId }, ...(company ? [{ value: 'contacts', label: 'Contacts', count: peopleCount.data, panel: `${prefix}-record-contacts` }, { value: 'addresses', label: 'Adresses', count: addressCount, panel: `${prefix}-record-addresses` }] : []), ...(kind === 'companies' ? [{ value: 'accounting', label: 'Comptabilité', count: undefined, panel: formId }] : []), { value: 'notes', label: 'Notes', count: undefined, panel: formId }]} />}
    {peopleCount.error && <p role="alert" className="field-error">{peopleCount.error.message}<HButton size="small" variant="ghost" onClick={() => { void peopleCount.refetch() }}>Réessayer le compteur des contacts</HButton></p>}
    <form id={formId} role={record || kind === 'companies' ? 'tabpanel' : undefined} aria-labelledby={record || kind === 'companies' ? `${prefix}-tab-${section}` : undefined} hidden={section === 'contacts' || section === 'addresses'} className="contact-record-form" onSubmit={form.handleSubmit(submit)} noValidate>
      <fieldset hidden={section === 'accounting'} disabled={!editable || busy} className={`contact-record-layout${kind === 'people' ? ' contact-person-layout' : ''}`}>
        <div className="contact-main-column">
          <section className="contact-panel contact-identity-panel"><div className="contact-identity-layout"><div className="contact-identity-details"><HSectionHeading title="Identité" icon={kind === 'companies' ? Building2 : UserRound} actions={lookupAction} /><div className="contact-fields">{(kind === 'companies' ? ['name', 'legal_name'] as const : ['first_name', 'last_name'] as const).map(renderField)}</div>
            {kind === 'people' && <div className="contact-company-assignment">{renderField('job_title')}<div className="contact-company-field"><label htmlFor={`${prefix}-company-select`}>Société</label><div className="contact-company-control"><Controller name="company" control={form.control} render={({ field }) => <ContactRecordPicker resource="company" inspectDisabled={busy || changingRecord} ready={!companies.isPending && !companies.error} label="Société" id={`${prefix}-company-select`} value={field.value} onChange={(value) => { setChosenCompany(companyOptions.find((item) => item.id === value) ?? (selectedCompany?.id === value ? selectedCompany : undefined)); field.onChange(value) }} onSearchChange={setCompanySearch} disabled={!editable || busy} showCodes={false} emptyLabel="Sans société" options={[...(selectedCompany && !companyOptions.some((item) => item.id === selectedCompany.id) ? [{ value: selectedCompany.id, label: `${selectedCompany.name}${!selectedCompany.active ? ' (archivée)' : ''}`, disabled: !selectedCompany.active }] : []), ...companyOptions.map((item) => ({ value: item.id, label: item.name }))]} />} /></div></div>{companies.error && <p role="alert" className="field-error">{companies.error.message}</p>}</div>}
          {person && relatedCompany && <CompanyRoleChoices name={relatedCompany.name} selected={relatedCompany.expand?.contacts_company_roles_via_company?.filter((role) => role.active).map((role) => role.role) ?? []} disabled onChange={() => {}} />}
          {kind === 'companies' && <CompanyRoleChoices name={title} selected={draftRoles} disabled={!editable || busy} onChange={(value, checked) => setDraftRoles((current) => checked ? [...current, value] : current.filter((role) => role !== value))} />}
          </div>
          <div className="contact-identity-photo"><ContactImageEditor searchQuery={companyName} kind={kind} record={record ?? stagedCompany} files={files} onChange={setFiles} disabled={!editable || busy} /></div>
          </div></section>
          <section className="contact-panel contact-coordinates-panel"><HSectionHeading title="Coordonnées" icon={Phone} actions={record && <nav className="contact-coordinate-actions" aria-label="Actions de contact">{record.email && <a href={`mailto:${record.email}`} aria-label="Envoyer un e-mail" title={record.email}><Mail size={15} /></a>}{record.phone && <a href={`tel:${record.phone}`} aria-label="Appeler" title={record.phone}><Phone size={15} /></a>}{company?.website && <a href={company.website} target="_blank" rel="noreferrer" aria-label="Ouvrir le site web" title={company.website}><Globe size={15} /></a>}</nav>} /><div className="contact-fields">{(kind === 'companies' ? ['email', 'phone', 'website'] as const : ['email', 'phone', 'mobile'] as const).map(renderField)}</div></section>
          {addressPanel}
          {kind === 'companies' && <section className="contact-panel contact-legal-panel"><HSectionHeading title="Informations légales" icon={Fingerprint} /><div className="contact-fields">{(['siren', 'siret', 'vat_number', 'lei'] as const).map(renderField)}</div></section>}

          {preferencesPanel}
          <details id={`${prefix}-record-notes`} open className="contact-panel contact-notes-panel"><summary><HSectionHeading title="Notes internes" icon={StickyNote} /><span className="contact-summary-hint">{record?.notes ? 'Note enregistrée' : 'Facultatif'}<ChevronDown size={15} /></span></summary><label className="contact-notes-label" htmlFor={`${prefix}-notes`}>Notes<textarea id={`${prefix}-notes`} className="h-input" rows={3} placeholder="Informations utiles pour votre équipe…" {...form.register('notes')} />{form.formState.errors.notes && <span className="field-error">{form.formState.errors.notes.message}</span>}</label></details>
        </div>
      </fieldset>
      {kind === 'companies' && <fieldset disabled={!editable || busy} hidden={section !== 'accounting'} className="contact-accounting-layout">
        <section className="contact-panel"><HSectionHeading title="Comptes tiers" icon={SlidersHorizontal} description="Comptes utilisés pour les échanges comptables. Renseignez ceux qui concernent cette société." /><div className="contact-fields">{(['customer_account', 'supplier_account'] as const).map(renderField)}</div></section>
        <section className="contact-panel"><HSectionHeading title="Facturation électronique" icon={Mail} description="Préparez les informations du destinataire. Le routage reste à vérifier dans l’annuaire avant tout envoi." /><div className="contact-fields">
          <label htmlFor={`${prefix}-einvoice-status`}> <HFieldLabel required>Préparation</HFieldLabel><Controller name="einvoice_status" control={form.control} render={({ field }) => <HCombobox id={`${prefix}-einvoice-status`} label="Préparation" value={field.value} onChange={field.onChange} required showCodes={false} options={[{ value: 'unknown', label: 'À vérifier' }, { value: 'to_configure', label: 'À compléter' }, { value: 'ready', label: 'Informations renseignées' }, { value: 'not_applicable', label: 'Non concerné' }]} />} /></label>
          {(['einvoice_platform', 'einvoice_routing_address', 'billing_email', 'einvoice_service_code'] as const).map(renderField)}
        </div></section>
      </fieldset>}
      {!canWrite && <p className="contact-muted">Fiche en lecture seule.</p>}
    </form>
    {company && <div id={`${prefix}-record-contacts`} role="tabpanel" aria-labelledby={`${prefix}-tab-contacts`} hidden={section !== 'contacts'}><CompanyPeople company={company.id} editable={editable && !busy} /></div>}
    {company && <div id={`${prefix}-record-addresses`} role="tabpanel" aria-labelledby={`${prefix}-tab-addresses`} hidden={section !== 'addresses'}><CompanyAddresses drafts={allAddressDrafts} editable={editable && !busy} error={addressError} onChange={(key, input) => {
      setAddressError('')
      if (key === 'billing_email') { form.setValue(key, input.email || '', { shouldDirty: true }); return }
      if (key === 'primary') addressForm.reset(input, { keepDefaultValues: true })
      else if (input.is_primary && input.type === 'registered') addressForm.setValue('is_primary', false, { shouldDirty: true })
      setAddressDrafts((items) => items.map((item) => item.key === key ? { ...item, input } : input.is_primary && item.input.type === input.type ? { ...item, input: { ...item.input, is_primary: false } } : item))
    }} onAdd={() => { const key = crypto.randomUUID().replace(/-/g, '').slice(0, 15); setAddressDrafts((items) => [...items, { key, input: { company: company.id, type: 'billing', label: '', email: '', line1: '', line2: '', postal_code: '', city: '', country: '', state_region: '', is_primary: false } }]); return key }} onRemove={(key) => setAddressDrafts((items) => items.filter((item) => item.key !== key))} /></div>}

    </div>
    {!embedded && record && <ContactRecordNavigator kind={kind} id={record.id} active={record.active} dirty={hasChanges} busy={busy} onChanging={setChangingRecord} />}
    {record && <ActivityPanel source={{ entity: kind === 'companies' ? 'contacts_companies' : 'contacts_people', id: record.id }} editable={editable && !busy} />}
  </div>
}

export function ContactPage({ kind }: { kind: ContactKind }) {
  const embedded = useRecordSession()
  const route = useParams()
  const id = embedded ? embedded.id ?? 'new' : route.id ?? ''
  const [searchParams] = useSearchParams()
  const requestedSection = !embedded ? searchParams.get('section') : ''
  const allowedSections = kind === 'companies' ? ['information', 'accounting', 'notes', ...(id !== 'new' ? ['contacts', 'addresses'] : [])] : ['information', 'notes']
  const [section, setSection] = useRecordSection(`${kind}:${id}`, requestedSection && allowedSections.includes(requestedSection) ? requestedSection : 'information')
  const duplicateId = !embedded && id === 'new' ? searchParams.get('duplicate') ?? '' : ''
  const sourceId = duplicateId || id
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const canRead = session.status === 'authenticated' && hasPermission(session.user, 'contacts.read')
  const canWrite = canRead && session.status === 'authenticated' && hasPermission(session.user, 'contacts.write')
  const record = useQuery({ queryKey: ['contacts', kind, sourceId], queryFn: async () => kind === 'companies' ? contactsService.company(sourceId) : contactsService.person(sourceId), enabled: canRead && sourceId !== 'new', staleTime: 10_000, retry: false })
  const addresses = useQuery({ queryKey: ['contacts', 'addresses', sourceId], queryFn: () => contactsService.addresses(sourceId), enabled: canRead && kind === 'companies' && sourceId !== 'new', staleTime: 10_000, retry: false })
  const accounts = useQuery({ queryKey: ['contacts', 'accounts', sourceId], queryFn: () => contactsService.accounts(sourceId), enabled: canRead && kind === 'companies' && id !== 'new', staleTime: 10_000, retry: false })
  if (!canRead || (id === 'new' && !canWrite)) return <p role="alert">Vous ne disposez pas des permissions nécessaires.</p>
  if (sourceId !== 'new' && (record.isPending || (kind === 'companies' && (addresses.isPending || (id !== 'new' && accounts.isPending))))) return <HLoadingIndicator label="Chargement de la fiche…" />
  const error = record.error ?? addresses.error ?? accounts.error
  if (error) return <div className="contact-error" role="alert">{error.message}<HButton onClick={() => { void record.refetch(); if (kind === 'companies') void addresses.refetch(); void accounts.refetch() }}>Réessayer</HButton></div>
  const registered = addresses.data?.filter((address) => address.type === 'registered') ?? []
  const primary = registered.find((address) => address.is_primary) ?? (registered.length === 1 ? registered[0] : undefined)
  const addressKey = primary ? `${primary.id}-${primary.updated}` : ''
  return <ContactEditor section={section} setSection={setSection} key={`${id}-${record.data?.updated ?? 'new'}-${addressKey}-${accounts.data?.map((item) => `${item.id}:${item.account_code}:${item.active}`).join(',') ?? ''}`} kind={kind} record={duplicateId ? undefined : record.data} duplicateSource={duplicateId ? record.data : undefined} duplicateAddress={duplicateId ? primary : undefined} addresses={duplicateId ? [] : addresses.data ?? []} accounts={{ customer_account: accounts.data?.find((item) => item.type === 'customer' && item.active)?.account_code ?? '', supplier_account: accounts.data?.find((item) => item.type === 'supplier' && item.active)?.account_code ?? '' }} canWrite={canWrite} />
}
export function CompanyPage() { return <ContactPage kind="companies" /> }
export function PersonPage() { return <ContactPage kind="people" /> }
