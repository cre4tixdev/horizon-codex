import { useState, useSyncExternalStore } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { Plus, RefreshCw, Building2, UsersRound, LayoutGrid, List } from 'lucide-react'
import { sessionService, isLayoutPreview } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HButton } from '../../../shared/ui/HButton'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HBadge } from '../../../shared/ui/HBadge'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { useContactList } from '../hooks/useContacts'
import { ContactSummary } from '../components/ContactSummary'
import { ContactCards } from '../components/ContactCards'
import { ContactIdentity } from '../components/ContactIdentity'
import { roleLabels } from '../schemas/contacts'
import type { Company, Person, ContactKind } from '../types/contacts'

export function ContactsPage({ kind = 'companies' }: { kind?: ContactKind }) {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const canRead = session.status === 'authenticated' && hasPermission(session.user, 'contacts.read')
  const canWrite = canRead && session.status === 'authenticated' && hasPermission(session.user, 'contacts.write')
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('view') === 'list' ? 'list' : 'cards'
  const search = searchParams.get('q') ?? ''
  const [archived, setArchived] = useState(false)
  const [pagination, setPagination] = useState({ search, kind, page: 1 })
  const page = pagination.search === search && pagination.kind === kind ? pagination.page : 1
  const setPage = (next: number) => setPagination({ search, kind, page: next })
  const [sorting, setSorting] = useState<SortingState>([])
  const client = useQueryClient()
  const records = useContactList(kind, { search, archived, page, sort: sorting[0]?.id, descending: sorting[0]?.desc }, canRead)
  const companyColumns: ColumnDef<Company>[] = [
    { id: 'name', accessorKey: 'name', header: 'Société', cell: ({ row }) => <Link to={`/contacts/companies/${row.original.id}`}><ContactIdentity kind="company" {...row.original} filename={row.original.logo} /></Link> },
    { id: 'roles', header: 'Relations', enableSorting: false, cell: ({ row }) => <span className="contact-role-list">{row.original.expand?.contacts_company_roles_via_company?.filter((role) => role.active).map((role) => <HBadge key={role.id} className={`contact-role-pill contact-role-pill--${role.role}`}>{roleLabels[role.role]}</HBadge>)}</span> },
    { accessorKey: 'email', header: 'E-mail' }, { accessorKey: 'phone', header: 'Téléphone', enableSorting: false },
    { accessorKey: 'legal_name', header: 'Raison sociale' },
    { id: 'status', header: 'Statut', enableSorting: false, cell: ({ row }) => <HBadge tone={row.original.active ? 'success' : 'neutral'}>{row.original.active ? 'Actif' : 'Archivé'}</HBadge> },
  ]
  const personColumns: ColumnDef<Person>[] = [
    { id: 'last_name', accessorKey: 'last_name', header: 'Contact', cell: ({ row }) => <Link to={`/contacts/people/${row.original.id}`}><ContactIdentity kind="person" {...row.original} filename={row.original.avatar} name={[row.original.first_name, row.original.last_name].filter(Boolean).join(' ')} company={row.original.expand?.company} /></Link> },
    { id: 'company', header: 'Société', enableSorting: false, cell: ({ row }) => row.original.expand?.company ? <Link to={`/contacts/companies/${row.original.company}`}>{row.original.expand.company.name}</Link> : '—' },
    { id: 'roles', header: 'Relation', enableSorting: false, cell: ({ row }) => <span className="contact-role-list">{row.original.expand?.company?.expand?.contacts_company_roles_via_company?.filter((role) => role.active).map((role) => <HBadge key={role.id} className={`contact-role-pill contact-role-pill--${role.role}`}>{roleLabels[role.role]}</HBadge>)}</span> },
    { id: 'status', header: 'Statut', enableSorting: false, cell: ({ row }) => <HBadge tone={row.original.active ? 'success' : 'neutral'}>{row.original.active ? 'Actif' : 'Archivé'}</HBadge> },
    { accessorKey: 'job_title', header: 'Fonction', enableSorting: false }, { accessorKey: 'email', header: 'E-mail' }, { accessorKey: 'phone', header: 'Téléphone', enableSorting: false },
  ]
  return <div className="contact-directory">
    <HPageHeader title="Contacts" description="Votre référentiel de sociétés et de personnes." actions={canWrite && <HButton asChild variant="primary"><Link to={`/contacts/${kind}/new`}><Plus size={15} />{kind === 'companies' ? 'Nouvelle société' : 'Nouveau contact'}</Link></HButton>} />
    {canRead && <ContactSummary />}
    <nav className="contact-tabs" aria-label="Référentiel Contacts"><Link className={kind === 'companies' ? 'selected' : ''} to={`/contacts?view=${view}`}><Building2 size={15} />Sociétés</Link><Link className={kind === 'people' ? 'selected' : ''} to={`/contacts/people?view=${view}`}><UsersRound size={15} />Personnes</Link></nav>
    {!canRead ? <div className="contact-empty"><h2>{isLayoutPreview ? 'Référentiel Contacts' : 'Accès aux contacts non autorisé'}</h2><p>{isLayoutPreview ? 'Connectez-vous à Horizon pour consulter les sociétés et les personnes.' : 'La permission contacts.read est nécessaire. Contactez votre administrateur.'}</p></div> : <>
      <div className="contact-toolbar">
        <div className="contact-state-filter"><HCombobox label="État des fiches" value={archived ? 'archived' : 'active'} required showCodes={false} options={[{ value: 'active', label: 'Actifs' }, { value: 'archived', label: 'Archivés' }]} onChange={(value) => { setArchived(value === 'archived'); setPage(1) }} /></div>
        <HButton aria-label="Actualiser les contacts" size="icon" onClick={() => { void client.invalidateQueries({ queryKey: ['contacts'] }) }}><RefreshCw size={15} /></HButton><span className="contact-result-count">{records.data?.totalItems ?? '—'} résultat(s)</span>
        <div className="contact-sort"><HCombobox label="Trier les contacts" value={`${sorting[0]?.id ?? (kind === 'companies' ? 'name' : 'last_name')}:${sorting[0]?.desc ? 'desc' : 'asc'}`} required showCodes={false} options={[{ value: `${kind === 'companies' ? 'name' : 'last_name'}:asc`, label: 'Nom : A → Z' }, { value: `${kind === 'companies' ? 'name' : 'last_name'}:desc`, label: 'Nom : Z → A' }, { value: 'email:asc', label: 'E-mail : A → Z' }, ...(kind === 'companies' ? [{ value: 'legal_name:asc', label: 'Raison sociale : A → Z' }] : [])]} onChange={(value) => { const [id, direction] = value.split(':'); setSorting([{ id: id ?? 'name', desc: direction === 'desc' }]); setPage(1) }} /></div>
        <div className="contact-view-switch" role="group" aria-label="Présentation des contacts">{[{ value: 'cards', label: 'Vue cartes', icon: LayoutGrid }, { value: 'list', label: 'Vue liste', icon: List }].map(({ value, label, icon: Icon }) => <HButton key={value} aria-label={label} aria-pressed={view === value} size="small" variant="ghost" onClick={() => setSearchParams((current) => { const next = new URLSearchParams(current); next.set('view', value); return next }, { replace: true })}><Icon size={15} /><span>{value === 'cards' ? 'Cartes' : 'Liste'}</span></HButton>)}</div>
      </div>
      {records.isFetching && <p role="status">Chargement des contacts…</p>}
      {records.error && <div role="alert" className="contact-error">{records.error.message}<HButton onClick={() => { void records.refetch() }}>Réessayer</HButton></div>}
      {records.data && (records.data.items.length ? view === 'cards' ? <ContactCards records={records.data.items} /> : kind === 'companies' ? <HDataTable getRowLink={(company) => ({ href: `/contacts/companies/${company.id}`, label: `Ouvrir la fiche de ${company.name}` })} data={records.data.items.filter((item): item is Company => 'name' in item)} columns={companyColumns} sorting={sorting} onSortingChange={(next) => { setSorting(next); setPage(1) }} /> : <HDataTable getRowLink={(person) => ({ href: `/contacts/people/${person.id}`, label: `Ouvrir la fiche de ${[person.first_name, person.last_name].filter(Boolean).join(' ')}` })} data={records.data.items.filter((item): item is Person => 'first_name' in item)} columns={personColumns} sorting={sorting} onSortingChange={(next) => { setSorting(next); setPage(1) }} /> : <div className="contact-empty"><h2>Aucun résultat</h2><p>{search ? 'Essayez une autre recherche.' : archived ? 'Aucune fiche archivée.' : 'Commencez par créer votre première fiche.'}</p></div>)}
      <div className="contact-pagination"><HButton disabled={page <= 1 || records.isFetching} onClick={() => setPage(page - 1)}>Précédent</HButton><span>Page {page} / {Math.max(records.data?.totalPages ?? 1, 1)}</span><HButton disabled={page >= (records.data?.totalPages ?? 1) || records.isFetching} onClick={() => setPage(page + 1)}>Suivant</HButton></div>
    </>}
  </div>
}
export function PeoplePage() { return <ContactsPage kind="people" /> }
