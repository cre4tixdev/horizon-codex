import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { Plus, Building2, UsersRound, LayoutGrid, List, Globe, ChevronLeft, ChevronRight } from 'lucide-react'
import { sessionService, isLayoutPreview } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HButton } from '../../../shared/ui/HButton'
import { HBadge } from '../../../shared/ui/HBadge'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { useContactList } from '../hooks/useContacts'
import { ContactSummary } from '../components/ContactSummary'
import { ContactCards } from '../components/ContactCards'
import { ContactIdentity } from '../components/ContactIdentity'
import { roleLabels } from '../schemas/contacts'
import type { Company, Person, ContactKind } from '../types/contacts'
import { directoryContext } from '../navigationContext'
import { filterValue } from '../../../shared/search/filters'
import { contactStateFilter, contactRoleFilter, contactGroupingFilter, contactSortFilter } from '../searchFilters'

export function ContactsPage({ kind = 'companies' }: { kind?: ContactKind }) {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const canRead = session.status === 'authenticated' && hasPermission(session.user, 'contacts.read')
  const canWrite = canRead && session.status === 'authenticated' && hasPermission(session.user, 'contacts.write')
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const returnedDirectory = directoryContext(location.state, kind)
  const view = searchParams.get('view') === 'list' ? 'list' : 'cards'
  const search = searchParams.get('q') ?? ''
  const archived = filterValue(searchParams, contactStateFilter) === 'archived'
  const relation = filterValue(searchParams, contactRoleFilter)
  const role = relation === 'customer' || relation === 'supplier' ? relation : undefined
  const grouping = filterValue(searchParams, contactGroupingFilter(kind === 'people'))
  const group = grouping === 'country' || grouping === 'company' ? grouping : undefined
  const sortDefinition = contactSortFilter(kind === 'people')
  const selectedSort = filterValue(searchParams, sortDefinition)
  const [sortId, sortDirection] = selectedSort.split(':')
  const sorting: SortingState = [{ id: sortId!, desc: sortDirection === 'desc' }]
  const setSorting = (update: SortingState | ((current: SortingState) => SortingState)) => {
    const next = typeof update === 'function' ? update(sorting) : update
    const value = next[0] ? `${next[0].id}:${next[0].desc ? 'desc' : 'asc'}` : sortDefinition.defaultValue
    setSearchParams((current) => { const params = new URLSearchParams(current); if (value === sortDefinition.defaultValue) params.delete('sort'); else params.set('sort', value); return params })
  }
  const [pagination, setPagination] = useState({ search, kind, archived, role, group, selectedSort, page: returnedDirectory?.query === searchParams.toString() ? returnedDirectory.page : 1 })
  const sameContext = pagination.search === search && pagination.kind === kind && pagination.archived === archived && pagination.role === role && pagination.group === group && pagination.selectedSort === selectedSort
  const page = sameContext ? pagination.page : 1
  if (!sameContext) setPagination({ search, kind, archived, role, group, selectedSort, page: 1 })
  const setPage = (next: number) => setPagination({ search, kind, archived, role, group, selectedSort, page: next })
  function tabHref(target: ContactKind) {
    const params = new URLSearchParams(searchParams)
    if (params.get('q')) params.set('scope', target); else params.delete('scope')
    if (params.get('group') === 'company' && target === 'companies') params.delete('group')
    const sort = params.get('sort')
    if (sort?.startsWith('legal_name:') && target === 'people') params.delete('sort')
    if (sort?.startsWith('name:') && target === 'people') params.set('sort', sort.replace('name:', 'last_name:'))
    if (sort?.startsWith('last_name:') && target === 'companies') params.set('sort', sort.replace('last_name:', 'name:'))
    return `${target === 'companies' ? '/contacts' : '/contacts/people'}${params.size ? `?${params}` : ''}`
  }
  const directory = { kind, query: searchParams.toString(), page }
  const linkState = { contactDirectory: directory }
  const records = useContactList(kind, { search, archived, role, group, page, sort: sortId, descending: sortDirection === 'desc' }, canRead)
  const otherKind = kind === 'companies' ? 'people' : 'companies'
  const autoSearch = canRead && Boolean(search.trim()) && !['companies', 'people'].includes(searchParams.get('scope') ?? '')
  const otherRecords = useContactList(otherKind, { search, archived, role, page: 1 }, autoSearch)
  useEffect(() => {
    if (!autoSearch || !records.isSuccess || !otherRecords.isSuccess || records.data.totalItems !== 0 || otherRecords.data.totalItems === 0) return
    const params = new URLSearchParams(searchParams)
    params.delete('scope')
    if (params.get('group') === 'company' && otherKind === 'companies') params.delete('group')
    const sort = params.get('sort')
    if (sort?.startsWith('name:') && otherKind === 'people') params.set('sort', sort.replace('name:', 'last_name:'))
    if (sort?.startsWith('last_name:') && otherKind === 'companies') params.set('sort', sort.replace('last_name:', 'name:'))
    if (sort?.startsWith('legal_name:') && otherKind === 'people') params.delete('sort')
    navigate(`${otherKind === 'companies' ? '/contacts' : '/contacts/people'}?${params}`, { replace: true, state: { contactSearchAutofocus: true } })
  }, [autoSearch, records.isSuccess, records.data, otherRecords.isSuccess, otherRecords.data, otherKind, searchParams, navigate])
  const companyColumns: ColumnDef<Company>[] = [
    { id: 'name', accessorKey: 'name', header: 'Société', cell: ({ row }) => <Link to={`/contacts/companies/${row.original.id}`} state={linkState}><ContactIdentity kind="company" {...row.original} filename={row.original.logo} /></Link> },
    { id: 'roles', header: 'Relations', enableSorting: false, cell: ({ row }) => <span className="contact-role-list">{row.original.expand?.contacts_company_roles_via_company?.filter((role) => role.active).map((role) => <HBadge key={role.id} className={`contact-role-pill contact-role-pill--${role.role}`}>{roleLabels[role.role]}</HBadge>)}</span> },
    { accessorKey: 'email', header: 'E-mail' }, { accessorKey: 'phone', header: 'Téléphone', enableSorting: false },
    { accessorKey: 'legal_name', header: 'Raison sociale' },
    { id: 'status', header: 'Statut', enableSorting: false, cell: ({ row }) => <HBadge tone={row.original.active ? 'success' : 'neutral'}>{row.original.active ? 'Actif' : 'Archivé'}</HBadge> },
  ]
  const personColumns: ColumnDef<Person>[] = [
    { id: 'last_name', accessorKey: 'last_name', header: 'Contact', cell: ({ row }) => <Link to={`/contacts/people/${row.original.id}`} state={linkState}><ContactIdentity kind="person" {...row.original} filename={row.original.avatar} name={[row.original.first_name, row.original.last_name].filter(Boolean).join(' ')} company={row.original.expand?.company} /></Link> },
    { id: 'company', header: 'Société', enableSorting: false, cell: ({ row }) => row.original.expand?.company ? <Link to={`/contacts/companies/${row.original.company}`}>{row.original.expand.company.name}</Link> : '—' },
    { id: 'roles', header: 'Relation', enableSorting: false, cell: ({ row }) => <span className="contact-role-list">{row.original.expand?.company?.expand?.contacts_company_roles_via_company?.filter((role) => role.active).map((role) => <HBadge key={role.id} className={`contact-role-pill contact-role-pill--${role.role}`}>{roleLabels[role.role]}</HBadge>)}</span> },
    { id: 'status', header: 'Statut', enableSorting: false, cell: ({ row }) => <HBadge tone={row.original.active ? 'success' : 'neutral'}>{row.original.active ? 'Actif' : 'Archivé'}</HBadge> },
    { accessorKey: 'job_title', header: 'Fonction', enableSorting: false }, { accessorKey: 'email', header: 'E-mail' }, { accessorKey: 'phone', header: 'Téléphone', enableSorting: false },
  ]
  const renderRecords = (items: (Company | Person)[]) => view === 'cards' ? <ContactCards records={items} directory={directory} /> : kind === 'companies'
    ? <HDataTable getRowLink={(company) => ({ href: `/contacts/companies/${company.id}`, state: linkState, label: `Ouvrir la fiche de ${company.name}` })} data={items.filter((item): item is Company => 'name' in item)} columns={companyColumns} sorting={sorting} onSortingChange={setSorting} />
    : <HDataTable getRowLink={(person) => ({ href: `/contacts/people/${person.id}`, state: linkState, label: `Ouvrir la fiche de ${[person.first_name, person.last_name].filter(Boolean).join(' ')}` })} data={items.filter((item): item is Person => 'first_name' in item)} columns={personColumns} sorting={sorting} onSortingChange={setSorting} />
  return <div className="contact-directory">
    {canRead && <HBreadcrumbActions><nav className="record-navigator" aria-label="Pagination des contacts" aria-busy={records.isFetching}>
      <span className="record-navigator-count" aria-live="polite" title="Page actuelle / nombre de pages">Page {page} / {Math.max(records.data?.totalPages ?? 1, 1)}</span>
      <HButton size="icon" variant="ghost" aria-label="Page précédente" title="Page précédente" disabled={page <= 1 || records.isFetching} onClick={() => setPage(page - 1)}><ChevronLeft size={15} /></HButton>
      <HButton size="icon" variant="ghost" aria-label="Page suivante" title="Page suivante" disabled={page >= (records.data?.totalPages ?? 1) || records.isFetching} onClick={() => setPage(page + 1)}><ChevronRight size={15} /></HButton>
    </nav></HBreadcrumbActions>}
    <HPageHeader title="Contacts" description="Votre référentiel de sociétés et de personnes." actions={canWrite && <HButton asChild variant="primary"><Link to={`/contacts/${kind}/new`}><Plus size={15} />{kind === 'companies' ? 'Nouvelle société' : 'Nouveau contact'}</Link></HButton>} />
    {canRead && <ContactSummary />}
    <nav className="contact-tabs" aria-label="Référentiel Contacts"><Link className={kind === 'companies' ? 'selected' : ''} to={tabHref('companies')}><Building2 size={15} />Sociétés</Link><Link className={kind === 'people' ? 'selected' : ''} to={tabHref('people')}><UsersRound size={15} />Personnes</Link></nav>
    {!canRead ? <div className="contact-empty"><h2>{isLayoutPreview ? 'Référentiel Contacts' : 'Accès aux contacts non autorisé'}</h2><p>{isLayoutPreview ? 'Connectez-vous à Horizon pour consulter les sociétés et les personnes.' : 'La permission contacts.read est nécessaire. Contactez votre administrateur.'}</p></div> : <>
      <div className="contact-toolbar">
        <span className="contact-result-count">{records.data?.totalItems ?? '—'} résultat(s)</span>

        <div className="contact-view-switch" role="group" aria-label="Présentation des contacts">{[{ value: 'cards', label: 'Vue cartes', icon: LayoutGrid }, { value: 'list', label: 'Vue liste', icon: List }].map(({ value, label, icon: Icon }) => <HButton key={value} aria-label={label} aria-pressed={view === value} size="small" variant="ghost" onClick={() => setSearchParams((current) => { const next = new URLSearchParams(current); next.set('view', value); return next }, { replace: true })}><Icon size={15} /><span>{value === 'cards' ? 'Cartes' : 'Liste'}</span></HButton>)}</div>
      </div>
      {records.isFetching && <p role="status">Chargement des contacts…</p>}
      {records.error && <div role="alert" className="contact-error">{records.error.message}<HButton onClick={() => { void records.refetch() }}>Réessayer</HButton></div>}
      {records.data && (records.data.items.length ? records.data.groups ? <div className="contact-groups">{records.data.groups.map((item) => {
        const visible = records.data.items.filter((record) => item.ids.includes(record.id))
        const Icon = group === 'company' ? Building2 : Globe
        return <section key={item.key || 'unspecified'} className="contact-group" aria-label={`${item.label} : ${item.total} fiches`}><header><h2><Icon size={16} />{item.label}</h2><span>{item.total} fiche(s){visible.length < item.total && <small> · {visible.length} sur cette page</small>}</span></header>{renderRecords(visible)}</section>
      })}</div> : renderRecords(records.data.items) : <div className="contact-empty"><h2>Aucun résultat</h2><p>{search ? 'Essayez une autre recherche.' : archived ? 'Aucune fiche archivée.' : 'Commencez par créer votre première fiche.'}</p></div>)}
    </>}
  </div>
}
export function PeoplePage() { return <ContactsPage kind="people" /> }
