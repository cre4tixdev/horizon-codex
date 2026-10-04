import { useState, useSyncExternalStore } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Archive, RotateCcw } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HBadge } from '../../../shared/ui/HBadge'
import { contactsService } from '../services/ContactsService'
import { companyInputSchema, personInputSchema } from '../schemas/contacts'
import { ContactIdentity, GalleryImage } from '../components/ContactIdentity'
import { CompanyRelations } from '../components/CompanyRelations'
import type { Company, CompanyInput, Person, PersonInput, ContactKind, ContactFiles } from '../types/contacts'

type FormValues = CompanyInput & PersonInput
const companyFields: { name: keyof FormValues; label: string; type?: string }[] = [
  { name: 'name', label: 'Nom usuel *' }, { name: 'legal_name', label: 'Raison sociale' }, { name: 'email', label: 'E-mail', type: 'email' }, { name: 'phone', label: 'Téléphone' },
  { name: 'website', label: 'Site web', type: 'url' }, { name: 'vat_number', label: 'Numéro de TVA' }, { name: 'fiscal_identifier', label: 'Identifiant fiscal' },
  { name: 'preferred_language', label: 'Langue préférée' }, { name: 'preferred_currency', label: 'Devise préférée' }, { name: 'default_currency', label: 'Devise par défaut' },
]
const personFields: typeof companyFields = [ { name: 'first_name', label: 'Prénom' }, { name: 'last_name', label: 'Nom' }, { name: 'job_title', label: 'Fonction' }, { name: 'email', label: 'E-mail', type: 'email' }, { name: 'phone', label: 'Téléphone' }, { name: 'mobile', label: 'Mobile' } ]
function ContactEditor({ kind, record, canWrite }: { kind: ContactKind; record?: Company | Person | undefined; canWrite: boolean }) {
  const navigate = useNavigate()
  const client = useQueryClient()
  const [companySearch, setCompanySearch] = useState('')
  const [files, setFiles] = useState<ContactFiles>({})
  const editable = canWrite && (!record || record.active)
  const form = useForm<FormValues>({ defaultValues: { name: '', legal_name: '', vat_number: '', fiscal_identifier: '', preferred_language: '', preferred_currency: '', default_currency: '', website: '', phone: '', email: '', notes: '', company: '', first_name: '', last_name: '', job_title: '', mobile: '', ...record } })
  const companies = useQuery({ queryKey: ['contacts', 'company-options', companySearch], queryFn: () => contactsService.companies({ search: companySearch, page: 1, archived: false }), enabled: kind === 'people' && editable, retry: false })
  const company = record && 'name' in record ? record : undefined
  const person = record && 'first_name' in record ? record : undefined
  const companyOptions = companies.data?.items ?? []
  const selectedCompany = person?.expand?.company
  const save = useMutation({ mutationFn: async (input: FormValues) => kind === 'companies' ? contactsService.saveCompany(companyInputSchema.parse(input), files, record?.id) : contactsService.savePerson(personInputSchema.parse(input), files, record?.id), onSuccess: async (saved) => { setFiles({}); await client.invalidateQueries({ queryKey: ['contacts'] }); navigate(`/contacts/${kind}/${saved.id}`, { replace: true }) } })
  const archive = useMutation({ mutationFn: (active: boolean) => contactsService.setActive(kind, record!.id, active), onSuccess: () => client.invalidateQueries({ queryKey: ['contacts'] }) })
  const removeImage = useMutation({ mutationFn: (filename: string) => contactsService.removeGallery(company!.id, filename), onSuccess: () => client.invalidateQueries({ queryKey: ['contacts'] }) })
  const title = record ? company ? company.name : [person?.first_name, person?.last_name].filter(Boolean).join(' ') : kind === 'companies' ? 'Nouvelle société' : 'Nouveau contact'
  async function submit(input: FormValues) {
    const parsed = (kind === 'companies' ? companyInputSchema : personInputSchema).safeParse(input)
    if (!parsed.success) { for (const issue of parsed.error.issues) { const field = [...companyFields, ...personFields].find((item) => item.name === issue.path[0]); if (issue.path[0] === 'notes') form.setError('notes', { message: issue.message }); if (field) form.setError(field.name, { message: issue.message }, { shouldFocus: true }) }; return }
    await save.mutateAsync(input).catch(() => {})
  }
  const busy = save.isPending || archive.isPending || removeImage.isPending
  return <>
    <HButton asChild variant="ghost" size="small"><Link to={kind === 'companies' ? '/contacts' : '/contacts/people'}><ArrowLeft size={14} />Retour au répertoire</Link></HButton>
    <HPageHeader title={title} description={kind === 'companies' ? 'Identité, coordonnées et relations de la société.' : 'Coordonnées et rattachement du contact.'} actions={record && <HBadge tone={record.active ? 'success' : 'neutral'}>{record.active ? 'Actif' : 'Archivé'}</HBadge>} />
    {record && <div className="contact-detail-identity"><ContactIdentity kind={kind === 'companies' ? 'company' : 'person'} {...record} filename={company?.logo ?? person?.avatar ?? ''} name={title} company={person?.expand?.company} /></div>}
    <form className="contact-card" onSubmit={form.handleSubmit(submit)} noValidate>
      <fieldset disabled={!editable || busy}><legend>Informations générales</legend><div className="contact-form-grid">{(kind === 'companies' ? companyFields : personFields).map((field) => <label key={field.name} htmlFor={`contact-${field.name}`}>{field.label}<HInput id={`contact-${field.name}`} type={field.type} {...form.register(field.name)} aria-invalid={Boolean(form.formState.errors[field.name])} aria-describedby={form.formState.errors[field.name] ? `error-${field.name}` : undefined} />{form.formState.errors[field.name] && <span className="field-error" id={`error-${field.name}`}>{form.formState.errors[field.name]?.message}</span>}</label>)}
        {kind === 'people' && <div className="contact-company-picker"><label htmlFor="company-search">Rechercher une société<HInput id="company-search" value={companySearch} onChange={(event) => setCompanySearch(event.target.value)} /></label><label htmlFor="company-select">Société<select aria-label="Société" id="company-select" className="h-input" {...form.register('company')}><option value="">Sans société</option>{selectedCompany && !companyOptions.some((item) => item.id === selectedCompany.id) && <option value={selectedCompany.id}>{selectedCompany.name}{!selectedCompany.active && ' (archivée)'}</option>}{companyOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{companies.error && <p role="alert" className="field-error">{companies.error.message}</p>}</div>}
        <label className="contact-wide" htmlFor="contact-notes">Notes<textarea id="contact-notes" className="h-input" rows={4} {...form.register('notes')} />{form.formState.errors.notes && <span className="field-error">{form.formState.errors.notes.message}</span>}</label>
        <label className="contact-wide">{kind === 'companies' ? 'Logo' : 'Avatar'}<input aria-label={kind === 'companies' ? 'Logo' : 'Avatar'} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFiles({ ...files, image: event.target.files?.[0], removeImage: false })} /><small>JPEG, PNG ou WebP · 2 Mio maximum</small></label>
        {(company?.logo || person?.avatar) && <label className="contact-wide contact-checkbox"><input type="checkbox" checked={Boolean(files.removeImage)} onChange={(event) => setFiles({ ...files, image: undefined, removeImage: event.target.checked })} />Retirer l’image actuelle</label>}
        {kind === 'companies' && <label className="contact-wide">Ajouter des images à la galerie<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => setFiles({ ...files, gallery: Array.from(event.target.files ?? []) })} /><small>Dix images maximum au total · 2 Mio par image</small></label>}
      </div></fieldset>
      {save.error && <p role="alert" className="field-error">{save.error.message}</p>}
      <div className="contact-form-actions">{editable && <HButton type="submit" variant="primary" disabled={busy}>{save.isPending ? 'Enregistrement…' : 'Enregistrer'}</HButton>}{canWrite && record && <HButton disabled={busy} onClick={() => { if (window.confirm(record.active ? 'Archiver cette fiche ? Ses données et relations seront conservées.' : 'Réactiver cette fiche ?')) archive.mutate(!record.active) }}>{record.active ? <Archive size={14} /> : <RotateCcw size={14} />}{record.active ? 'Archiver' : 'Réactiver'}</HButton>}{!canWrite && <p className="contact-muted">Fiche en lecture seule.</p>}</div>
      {archive.error && <p role="alert" className="field-error">{archive.error.message}</p>}
    </form>
    {company && <CompanyRelations company={company} editable={editable && !busy} />}
    {company && company.images.length > 0 && <section className="contact-related"><h2>Galerie</h2><div className="contact-gallery">{company.images.map((filename) => <div key={filename}><GalleryImage company={company} filename={filename} />{editable && <HButton size="small" disabled={busy} onClick={() => { if (window.confirm('Retirer cette image de la galerie ?')) removeImage.mutate(filename) }}>Retirer l’image</HButton>}</div>)}</div>{removeImage.error && <p role="alert" className="field-error">{removeImage.error.message}</p>}</section>}
  </>
}
export function ContactPage({ kind }: { kind: ContactKind }) {
  const { id = '' } = useParams()
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const canRead = session.status === 'authenticated' && hasPermission(session.user, 'contacts.read')
  const canWrite = canRead && session.status === 'authenticated' && hasPermission(session.user, 'contacts.write')
  const record = useQuery({ queryKey: ['contacts', kind, id], queryFn: async () => kind === 'companies' ? contactsService.company(id) : contactsService.person(id), enabled: canRead && id !== 'new', retry: false })
  if (!canRead || (id === 'new' && !canWrite)) return <p role="alert">Vous ne disposez pas des permissions nécessaires.</p>
  if (id !== 'new' && record.isPending) return <p role="status">Chargement de la fiche…</p>
  if (record.error) return <div className="contact-error" role="alert">{record.error.message}<HButton onClick={() => { void record.refetch() }}>Réessayer</HButton></div>
  return <ContactEditor key={`${id}-${record.data?.updated ?? 'new'}`} kind={kind} record={record.data} canWrite={canWrite} />
}
export function CompanyPage() { return <ContactPage kind="companies" /> }
export function PersonPage() { return <ContactPage kind="people" /> }
