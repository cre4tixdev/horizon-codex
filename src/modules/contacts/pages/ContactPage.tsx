import { useState, useSyncExternalStore } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowUpRight, Building2, UserRound, Phone, MapPin, Fingerprint, SlidersHorizontal, StickyNote, ChevronDown, Save, Mail, Globe } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { ActivityPanel } from '../../../shared/activity/ActivityPanel'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HRecordActions } from '../../../shared/ui/HRecordActions'
import { companyDuplicate, personDuplicate } from '../schemas/contactDuplication'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HInput } from '../../../shared/ui/HInput'
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
  name: { label: 'Nom usuel *', placeholder: 'Nom de la société' }, legal_name: { label: 'Raison sociale', placeholder: 'Dénomination légale' },
  first_name: { label: 'Prénom', placeholder: 'Prénom' }, last_name: { label: 'Nom', placeholder: 'Nom' }, job_title: { label: 'Fonction', placeholder: 'Responsable, directeur…' },
  email: { label: 'E-mail', placeholder: 'contact@societe.fr', type: 'email' }, phone: { label: 'Téléphone', placeholder: '+33 …', type: 'tel' }, mobile: { label: 'Mobile', placeholder: '+33 …', type: 'tel' },
  website: { label: 'Site web', placeholder: 'https://…', type: 'url' }, vat_number: { label: 'Numéro de TVA', placeholder: 'FR…' }, lei: { label: 'LEI', placeholder: '20 caractères alphanumériques' },
  customer_account: { label: 'Compte client', placeholder: '411100' }, supplier_account: { label: 'Compte fournisseur', placeholder: '401100' },
  billing_email: { label: 'E-mail de facturation', placeholder: 'facturation@societe.fr', type: 'email' }, einvoice_routing_address: { label: 'Adresse électronique de facturation', placeholder: 'Adresse inscrite dans l’annuaire' }, einvoice_platform: { label: 'Plateforme agréée du tiers', placeholder: 'Nom de la plateforme' }, einvoice_service_code: { label: 'Code service destinataire', placeholder: 'Si nécessaire, notamment Chorus Pro' },
  siren: { label: 'SIREN', placeholder: '9 chiffres' }, siret: { label: 'SIRET', placeholder: '14 chiffres' },
}

function ContactEditor({ kind, record, addresses, accounts, canWrite, duplicateSource, duplicateAddress }: { accounts: AccountDraft; duplicateSource?: Company | Person | undefined; duplicateAddress?: Address | undefined; kind: ContactKind; record?: Company | Person | undefined; addresses: Address[]; canWrite: boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  const directory = directoryContext(location.state, kind)
  const [searchParams, setSearchParams] = useSearchParams()
  const client = useQueryClient()
  const [section, setSection] = useState(kind === 'companies' && record && ['contacts', 'addresses'].includes(searchParams.get('section') ?? '') ? searchParams.get('section')! : 'information')
  const [companySearch, setCompanySearch] = useState('')
  const [chosenCompany, setChosenCompany] = useState<Company>()
  const [changingRecord, setChangingRecord] = useState(false)
  const [files, setFiles] = useState<ContactFiles>({})
  const source = record ?? duplicateSource
  const initialRoles = source && 'name' in source ? source.expand?.contacts_company_roles_via_company?.filter((role) => role.active).map((role) => role.role) ?? [] : []
  const [draftRoles, setDraftRoles] = useState<(typeof roleValues[number])[]>(initialRoles)
  const rolesChanged = kind === 'companies' && roleValues.some((role) => initialRoles.includes(role) !== draftRoles.includes(role))
  const [stagedCompany, setStagedCompany] = useState<Company>()
  const readiness = useQuery({ queryKey: ['contacts', 'revision'], queryFn: () => contactsService.ready(), retry: false })
  const editable = readiness.isSuccess && canWrite && (!record || record.active)
  const company = record && 'name' in record ? record : undefined
  const person = record && 'first_name' in record ? record : undefined
  const relatedCompany = company ?? person?.expand?.company
  const peopleCount = useQuery({ queryKey: ['contacts', 'company-people-count', company?.id], queryFn: () => contactsService.companyPeopleCount(company!.id), enabled: Boolean(company), staleTime: 10_000, retry: false })
  const addressCount = addresses.length + (company?.email ? 1 : 0) + (company?.billing_email ? 1 : 0)
  const registered = addresses.filter((address) => address.type === 'registered')
  const primaryAddress = registered.find((address) => address.is_primary) ?? (registered.length === 1 ? registered[0] : undefined)
  const initialExtraDrafts: AddressDraft[] = addresses.filter((address) => address.id !== primaryAddress?.id).map((address) => ({ key: address.id, id: address.id, input: addressInputSchema.parse(address) }))
  const [addressDrafts, setAddressDrafts] = useState<AddressDraft[]>(initialExtraDrafts)
  const [addressError, setAddressError] = useState('')
  const [primaryCreationId] = useState(() => crypto.randomUUID().replace(/-/g, '').slice(0, 15))
  const extraChanges = addressDrafts.filter((draft) => !draft.id || JSON.stringify(draft.input) !== JSON.stringify(initialExtraDrafts.find((item) => item.id === draft.id)?.input))
  const form = useForm<FormValues>({ defaultValues: { name: '', legal_name: '', vat_number: '', lei: '', billing_email: '', einvoice_routing_address: '', einvoice_platform: '', einvoice_service_code: '', einvoice_status: 'unknown', ...accounts, preferred_language: 'fr', siren: '', siret: '', default_currency: 'EUR', website: '', phone: '', email: '', notes: '', company: searchParams.get('company') ?? '', first_name: '', last_name: '', job_title: '', mobile: '', ...(duplicateSource ? 'name' in duplicateSource ? companyDuplicate(duplicateSource) : personDuplicate(duplicateSource) : record) } })
  const companyName = useWatch({ control: form.control, name: 'name' })
  const selectedCompanyId = useWatch({ control: form.control, name: 'company' })
  const addressForm = useForm<AddressInput>({ defaultValues: { type: 'registered', label: '', email: '', line1: '', line2: '', postal_code: '', city: '', country: '', state_region: '', ...(primaryAddress ?? (duplicateAddress ? addressInputSchema.parse(duplicateAddress) : undefined)), company: company?.id ?? 'pending', is_primary: true } })
  const companyEmail = useWatch({ control: form.control, name: 'email' })
  const billingEmail = useWatch({ control: form.control, name: 'billing_email' })
  const primaryDraft = useWatch({ control: addressForm.control })
  const allAddressDrafts: AddressDraft[] = [...(primaryAddress || primaryDraft.line1 || primaryDraft.email ? [{ key: 'primary', ...(primaryAddress ? { id: primaryAddress.id } : {}), input: addressForm.getValues() }] : []), ...addressDrafts, ...([{ field: 'email', value: companyEmail, label: 'E-mail général', type: 'other' }, { field: 'billing_email', value: billingEmail, label: 'E-mail de facturation', type: 'billing' }] as const).filter((item) => item.value || company?.[item.field]).map((item) => ({ key: item.field, virtual: item.field, input: { company: company?.id ?? 'pending', type: item.type, label: item.label, email: item.value, line1: '', line2: '', postal_code: '', city: '', country: '', state_region: '', is_primary: false } }))]
  const companies = useQuery({ queryKey: ['contacts', 'company-options', companySearch], queryFn: () => contactsService.companies({ search: companySearch, page: 1, archived: false }), enabled: kind === 'people' && editable, retry: false })
  const preselectedCompany = useQuery({ queryKey: ['contacts', 'companies', searchParams.get('company')], queryFn: () => contactsService.company(searchParams.get('company')!), enabled: kind === 'people' && !record && Boolean(searchParams.get('company')), retry: false })
  const selectedCompany = chosenCompany ?? person?.expand?.company ?? (duplicateSource && 'first_name' in duplicateSource ? duplicateSource.expand?.company : undefined) ?? preselectedCompany.data
  const companyOptions = companies.data?.items ?? []
  const save = useMutation({
    mutationFn: async ({ input, address }: { input: FormValues; address?: AddressInput | undefined }) => kind === 'companies'
      ? contactsService.saveCompanyDetails(companyInputSchema.parse(input), files, address, record?.id ?? stagedCompany?.id, primaryAddress?.id, draftRoles, accountDraftSchema.parse(input), extraChanges.map((draft) => ({ ...(draft.id ? { id: draft.id } : { creation_id: draft.key }), input: draft.input })), primaryCreationId)
      : contactsService.savePerson(personInputSchema.parse(input), files, record?.id),
    onSuccess: async (saved) => { setFiles({}); await client.cancelQueries({ queryKey: ['contacts'] }); await client.invalidateQueries({ queryKey: ['contacts'] }); await client.invalidateQueries({ queryKey: ['activity'] }); navigate(`/contacts/${kind}/${saved.id}${['addresses', 'contacts'].includes(section) ? `?section=${section}` : ''}`, { replace: true, state: location.state }) },
    onError: (error) => { if (error instanceof CompanyAddressSaveError || error instanceof CompanyRolesSaveError || error instanceof CompanyAccountingSaveError) { setStagedCompany(error.company); setFiles({}) } },
  })
  const archive = useMutation({ mutationFn: (active: boolean) => contactsService.setActive(kind, record!.id, active), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['contacts'] }); await client.invalidateQueries({ queryKey: ['activity'] }) } })
  const deletion = useMutation({ mutationFn: () => contactsService.deleteRecord(kind, record!.id), onSuccess: async () => { await client.cancelQueries({ queryKey: ['contacts'] }); client.removeQueries({ queryKey: ['contacts', kind, record!.id] }); navigate(kind === 'companies' ? '/contacts' : '/contacts/people', { replace: true }); await client.invalidateQueries({ queryKey: ['contacts'] }) } })
  const busy = save.isPending || archive.isPending || deletion.isPending
  const hasChanges = form.formState.isDirty || (kind === 'companies' && addressForm.formState.isDirty) || Boolean(files.image || files.removeImage) || rolesChanged || Boolean(stagedCompany) || Boolean(duplicateSource) || extraChanges.length > 0
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
    return <label key={name} htmlFor={`contact-${name}`}>{field.label}<HInput id={`contact-${name}`} type={'type' in field ? field.type : 'text'} placeholder={field.placeholder} {...form.register(name)} aria-invalid={Boolean(form.formState.errors[name])} aria-describedby={form.formState.errors[name] ? `error-${name}` : undefined} />{form.formState.errors[name] && <span className="field-error" id={`error-${name}`}>{form.formState.errors[name]?.message}</span>}</label>
  }

  function openSection(value: string) {
    setSection(value)
    if (company) setSearchParams((params) => { if (value === 'addresses' || value === 'contacts') params.set('section', value); else params.delete('section'); return params }, { replace: true, state: location.state })
    if (value === 'notes') document.getElementById('contact-record-notes')?.setAttribute('open', '')
  }

  const addressPanel = kind === 'companies' ? <section className="contact-panel contact-primary-address"><div className="contact-panel-heading"><MapPin size={16} /><h2>Adresse du siège</h2></div><p className="contact-section-description">{primaryAddress ? 'Adresse principale de la société.' : 'Renseignez l’adresse principale de la société.'}</p><AddressFields form={addressForm} prefix="primary-address" disabled={!editable || busy} /></section> : null
  const preferencesPanel = kind === 'companies' ? <section className="contact-panel contact-preferences-panel"><div className="contact-panel-heading"><SlidersHorizontal size={16} /><h2>Préférences</h2></div><div className="contact-fields">{(['preferred_language', 'default_currency'] as const).map((name) => <label key={name} htmlFor={`contact-${name}`}>{name === 'preferred_language' ? 'Langue' : 'Devise'}<Controller name={name} control={form.control} render={({ field }) => <ReferencePicker id={`contact-${name}`} label={name === 'preferred_language' ? 'Langue' : 'Devise'} catalog={name === 'preferred_language' ? 'settings_languages' : 'accounting_currencies'} value={field.value} onChange={field.onChange} disabled={!editable || busy} invalid={Boolean(form.formState.errors[name])} />} /></label>)}</div></section> : null

  return <div className={`contact-record contact-record--form-layout${!record ? ' contact-record--creating' : ''}`} data-section={section} inert={changingRecord} aria-busy={changingRecord}>
    <div className="contact-record-toolbar"><div className="contact-title-group"><HButton asChild variant="ghost" size="small"><Link to={directoryHref(directory, kind)} state={directory ? { contactDirectory: directory } : undefined}><ArrowLeft size={14} />Répertoire</Link></HButton><div className="contact-page-heading"><h1>{title}</h1>{record && <HBadge tone={record.active ? 'success' : 'neutral'}>{record.active ? 'Actif' : 'Archivé'}</HBadge>}</div></div><div className="contact-record-actions">
      {kind === 'companies' && canWrite && <CompanyLookup getInitialQuery={() => form.getValues('siret') || form.getValues('siren') || form.getValues('legal_name') || form.getValues('name')} disabled={!editable || busy} onApply={(proposal, selectedFields, includeAddress) => { setSection('information'); for (const field of selectedFields) { const value = proposal.fields[field]; if (value !== undefined) form.setValue(field, value, { shouldDirty: true }) }; if (includeAddress && proposal.address) for (const field of ['line1', 'line2', 'postal_code', 'city', 'country'] as const) addressForm.setValue(field, proposal.address[field], { shouldDirty: true }) }} />}

      {!record && <HButton asChild><Link to={directoryHref(directory, kind)} state={directory ? { contactDirectory: directory } : undefined}>Annuler</Link></HButton>}
      {editable && <HSaveButton form="contact-record-form" hasChanges={hasChanges} pending={save.isPending} disabled={busy}><Save size={14} />{save.isPending ? 'Enregistrement…' : 'Enregistrer'}</HSaveButton>}
      {canWrite && record && <HRecordActions itemName={title} active={record.active} disabled={busy || (hasChanges && record.active)} onArchive={() => archive.mutateAsync(false)} onRestore={() => { if (window.confirm('Réactiver cette fiche ?')) archive.mutate(true) }} onDuplicate={() => navigate(`/contacts/${kind}/new?duplicate=${record.id}`)} onDelete={() => deletion.mutateAsync()} />}
    </div></div>
    <div className="contact-record-sheet">
    {relatedCompany && <CompanyBusinessLinks company={relatedCompany} person={Boolean(person)} busy={busy || changingRecord} />}
    {readiness.isPending && <p role="status">Vérification du module Contacts…</p>}
    {readiness.error && <p role="alert" className="field-error">{readiness.error.message}<HButton onClick={() => { void readiness.refetch() }}>Réessayer</HButton></p>}
    {archive.error && record && !record.active && <p role="alert" className="field-error">{archive.error.message}</p>}
    {save.error && <div role="alert" className="contact-save-error">{save.error.message}</div>}
    {(record || kind === 'companies') && <div className="contact-record-navigation" role="tablist" aria-label="Sections de la fiche">{[{ value: 'information', label: 'Informations', count: undefined, panel: 'contact-record-form' }, ...(company ? [{ value: 'contacts', label: 'Contacts', count: peopleCount.data, panel: 'contact-record-contacts' }, { value: 'addresses', label: 'Adresses', count: addressCount, panel: 'contact-record-addresses' }] : []), ...(kind === 'companies' ? [{ value: 'accounting', label: 'Comptabilité', count: undefined, panel: 'contact-record-form' }] : []), { value: 'notes', label: 'Notes', count: undefined, panel: 'contact-record-form' }].map(({ value, label, count, panel }) => <button key={value} id={`contact-tab-${value}`} type="button" role="tab" aria-selected={section === value} aria-controls={panel} tabIndex={section === value ? 0 : -1} onKeyDown={(event) => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role=tab]') ?? []); const index = tabs.indexOf(event.currentTarget); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; tabs[next]?.click(); tabs[next]?.focus() }} onClick={() => openSection(value)}>{label}{count !== undefined && <span className="contact-tab-count">{count}</span>}</button>)}</div>}
    {peopleCount.error && <p role="alert" className="field-error">{peopleCount.error.message}<HButton size="small" variant="ghost" onClick={() => { void peopleCount.refetch() }}>Réessayer le compteur des contacts</HButton></p>}
    <form id="contact-record-form" role={record || kind === 'companies' ? 'tabpanel' : undefined} aria-labelledby={record || kind === 'companies' ? `contact-tab-${section}` : undefined} hidden={section === 'contacts' || section === 'addresses'} className="contact-record-form" onSubmit={form.handleSubmit(submit)} noValidate>
      <fieldset hidden={section === 'accounting'} disabled={!editable || busy} className={`contact-record-layout${kind === 'people' ? ' contact-person-layout' : ''}`}>
        <div className="contact-main-column">
          <section className="contact-panel contact-identity-panel"><div className="contact-identity-layout"><div className="contact-identity-details"><div className="contact-section-heading"><div className="contact-panel-heading">{kind === 'companies' ? <Building2 size={16} /> : <UserRound size={16} />}<h2>Identité</h2></div></div><div className="contact-fields">{(kind === 'companies' ? ['name', 'legal_name'] as const : ['first_name', 'last_name'] as const).map(renderField)}</div>
            {kind === 'people' && <div className="contact-company-assignment">{renderField('job_title')}<div className="contact-company-field"><label htmlFor="company-select">Société</label><div className="contact-company-control"><Controller name="company" control={form.control} render={({ field }) => <HCombobox label="Société" id="company-select" value={field.value} onChange={(value) => { setChosenCompany(companyOptions.find((item) => item.id === value) ?? (selectedCompany?.id === value ? selectedCompany : undefined)); field.onChange(value) }} onSearchChange={setCompanySearch} disabled={!editable || busy} showCodes={false} emptyLabel="Sans société" options={[...(selectedCompany && !companyOptions.some((item) => item.id === selectedCompany.id) ? [{ value: selectedCompany.id, label: `${selectedCompany.name}${!selectedCompany.active ? ' (archivée)' : ''}`, disabled: !selectedCompany.active }] : []), ...companyOptions.map((item) => ({ value: item.id, label: item.name }))]} />} />{selectedCompanyId && <Link className="contact-company-open" to={`/contacts/companies/${selectedCompanyId}`} aria-label={`Ouvrir la société ${selectedCompany?.id === selectedCompanyId ? selectedCompany.name : companyOptions.find((item) => item.id === selectedCompanyId)?.name ?? ''}`.trim()} title="Ouvrir la fiche société"><ArrowUpRight size={16} /></Link>}</div></div>{companies.error && <p role="alert" className="field-error">{companies.error.message}</p>}</div>}
          {person && relatedCompany && <CompanyRoleChoices name={relatedCompany.name} selected={relatedCompany.expand?.contacts_company_roles_via_company?.filter((role) => role.active).map((role) => role.role) ?? []} disabled onChange={() => {}} />}
          {kind === 'companies' && <CompanyRoleChoices name={title} selected={draftRoles} disabled={!editable || busy} onChange={(value, checked) => setDraftRoles((current) => checked ? [...current, value] : current.filter((role) => role !== value))} />}
          </div>
          <div className="contact-identity-photo"><ContactImageEditor searchQuery={companyName} kind={kind} record={record ?? stagedCompany} files={files} onChange={setFiles} disabled={!editable || busy} /></div>
          </div></section>
          <section className="contact-panel contact-coordinates-panel"><div className="contact-section-heading"><div className="contact-panel-heading"><Phone size={16} /><h2>Coordonnées</h2></div>{record && <nav className="contact-coordinate-actions" aria-label="Actions de contact">{record.email && <a href={`mailto:${record.email}`} aria-label="Envoyer un e-mail" title={record.email}><Mail size={15} /></a>}{record.phone && <a href={`tel:${record.phone}`} aria-label="Appeler" title={record.phone}><Phone size={15} /></a>}{company?.website && <a href={company.website} target="_blank" rel="noreferrer" aria-label="Ouvrir le site web" title={company.website}><Globe size={15} /></a>}</nav>}</div><div className="contact-fields">{(kind === 'companies' ? ['email', 'phone', 'website'] as const : ['email', 'phone', 'mobile'] as const).map(renderField)}</div></section>
          {addressPanel}
          {kind === 'companies' && <section className="contact-panel contact-legal-panel"><div className="contact-panel-heading"><Fingerprint size={16} /><h2>Informations légales</h2></div><div className="contact-fields">{(['siren', 'siret', 'vat_number', 'lei'] as const).map(renderField)}</div></section>}

          {preferencesPanel}
          <details id="contact-record-notes" open className="contact-panel contact-notes-panel"><summary><span className="contact-panel-heading"><StickyNote size={16} /><h2>Notes internes</h2></span><span className="contact-summary-hint">{record?.notes ? 'Note enregistrée' : 'Facultatif'}<ChevronDown size={15} /></span></summary><label className="contact-notes-label" htmlFor="contact-notes">Notes<textarea id="contact-notes" className="h-input" rows={3} placeholder="Informations utiles pour votre équipe…" {...form.register('notes')} />{form.formState.errors.notes && <span className="field-error">{form.formState.errors.notes.message}</span>}</label></details>
        </div>
      </fieldset>
      {kind === 'companies' && <fieldset disabled={!editable || busy} hidden={section !== 'accounting'} className="contact-accounting-layout">
        <section className="contact-panel"><div className="contact-panel-heading"><SlidersHorizontal size={16} /><h2>Comptes tiers</h2></div><p className="contact-muted">Comptes utilisés pour les échanges comptables. Renseignez ceux qui concernent cette société.</p><div className="contact-fields">{(['customer_account', 'supplier_account'] as const).map(renderField)}</div></section>
        <section className="contact-panel"><div className="contact-panel-heading"><Mail size={16} /><h2>Facturation électronique</h2></div><p className="contact-muted">Préparez les informations du destinataire. Le routage reste à vérifier dans l’annuaire avant tout envoi.</p><div className="contact-fields">
          <label htmlFor="einvoice-status">Préparation<Controller name="einvoice_status" control={form.control} render={({ field }) => <HCombobox id="einvoice-status" label="Préparation" value={field.value} onChange={field.onChange} required showCodes={false} options={[{ value: 'unknown', label: 'À vérifier' }, { value: 'to_configure', label: 'À compléter' }, { value: 'ready', label: 'Informations renseignées' }, { value: 'not_applicable', label: 'Non concerné' }]} />} /></label>
          {(['einvoice_platform', 'einvoice_routing_address', 'billing_email', 'einvoice_service_code'] as const).map(renderField)}
        </div></section>
      </fieldset>}
      {!canWrite && <p className="contact-muted">Fiche en lecture seule.</p>}
    </form>
    {company && <div id="contact-record-contacts" role="tabpanel" aria-labelledby="contact-tab-contacts" hidden={section !== 'contacts'}><CompanyPeople company={company.id} editable={editable && !busy} /></div>}
    {company && <div id="contact-record-addresses" role="tabpanel" aria-labelledby="contact-tab-addresses" hidden={section !== 'addresses'}><CompanyAddresses drafts={allAddressDrafts} editable={editable && !busy} error={addressError} onChange={(key, input) => {
      setAddressError('')
      if (key === 'email' || key === 'billing_email') { form.setValue(key, input.email || '', { shouldDirty: true }); return }
      if (key === 'primary') addressForm.reset(input, { keepDefaultValues: true })
      else if (input.is_primary && input.type === 'registered') addressForm.setValue('is_primary', false, { shouldDirty: true })
      setAddressDrafts((items) => items.map((item) => item.key === key ? { ...item, input } : input.is_primary && item.input.type === input.type ? { ...item, input: { ...item.input, is_primary: false } } : item))
    }} onAdd={() => { const key = crypto.randomUUID().replace(/-/g, '').slice(0, 15); setAddressDrafts((items) => [...items, { key, input: { company: company.id, type: 'billing', label: '', email: '', line1: '', line2: '', postal_code: '', city: '', country: '', state_region: '', is_primary: false } }]); return key }} onRemove={(key) => setAddressDrafts((items) => items.filter((item) => item.key !== key))} /></div>}

    </div>
    {record && <ContactRecordNavigator kind={kind} id={record.id} active={record.active} dirty={hasChanges} busy={busy} onChanging={setChangingRecord} />}
    {record && <ActivityPanel source={{ entity: kind === 'companies' ? 'contacts_companies' : 'contacts_people', id: record.id }} editable={editable && !busy} />}
  </div>
}

export function ContactPage({ kind }: { kind: ContactKind }) {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const duplicateId = id === 'new' ? searchParams.get('duplicate') ?? '' : ''
  const sourceId = duplicateId || id
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const canRead = session.status === 'authenticated' && hasPermission(session.user, 'contacts.read')
  const canWrite = canRead && session.status === 'authenticated' && hasPermission(session.user, 'contacts.write')
  const record = useQuery({ queryKey: ['contacts', kind, sourceId], queryFn: async () => kind === 'companies' ? contactsService.company(sourceId) : contactsService.person(sourceId), enabled: canRead && sourceId !== 'new', staleTime: 10_000, retry: false })
  const addresses = useQuery({ queryKey: ['contacts', 'addresses', sourceId], queryFn: () => contactsService.addresses(sourceId), enabled: canRead && kind === 'companies' && sourceId !== 'new', staleTime: 10_000, retry: false })
  const accounts = useQuery({ queryKey: ['contacts', 'accounts', sourceId], queryFn: () => contactsService.accounts(sourceId), enabled: canRead && kind === 'companies' && id !== 'new', staleTime: 10_000, retry: false })
  if (!canRead || (id === 'new' && !canWrite)) return <p role="alert">Vous ne disposez pas des permissions nécessaires.</p>
  if (sourceId !== 'new' && (record.isPending || (kind === 'companies' && (addresses.isPending || (id !== 'new' && accounts.isPending))))) return <p role="status">Chargement de la fiche…</p>
  const error = record.error ?? addresses.error ?? accounts.error
  if (error) return <div className="contact-error" role="alert">{error.message}<HButton onClick={() => { void record.refetch(); if (kind === 'companies') void addresses.refetch(); void accounts.refetch() }}>Réessayer</HButton></div>
  const registered = addresses.data?.filter((address) => address.type === 'registered') ?? []
  const primary = registered.find((address) => address.is_primary) ?? (registered.length === 1 ? registered[0] : undefined)
  const addressKey = primary ? `${primary.id}-${primary.updated}` : ''
  return <ContactEditor key={`${id}-${record.data?.updated ?? 'new'}-${addressKey}-${accounts.data?.map((item) => `${item.id}:${item.account_code}:${item.active}`).join(',') ?? ''}`} kind={kind} record={duplicateId ? undefined : record.data} duplicateSource={duplicateId ? record.data : undefined} duplicateAddress={duplicateId ? primary : undefined} addresses={duplicateId ? [] : addresses.data ?? []} accounts={{ customer_account: accounts.data?.find((item) => item.type === 'customer' && item.active)?.account_code ?? '', supplier_account: accounts.data?.find((item) => item.type === 'supplier' && item.active)?.account_code ?? '' }} canWrite={canWrite} />
}
export function CompanyPage() { return <ContactPage kind="companies" /> }
export function PersonPage() { return <ContactPage kind="people" /> }
