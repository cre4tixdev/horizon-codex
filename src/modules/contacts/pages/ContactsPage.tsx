import { useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { Plus, RefreshCw, Building2, UsersRound } from 'lucide-react'
import { sessionService, isLayoutPreview } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HBadge } from '../../../shared/ui/HBadge'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { useContactList } from '../hooks/useContacts'
import { ContactIdentity } from '../components/ContactIdentity'
import { roleLabels } from '../schemas/contacts'
import type { Company, Person, ContactKind } from '../types/contacts'

export function ContactsPage({ kind = 'companies' }: { kind?: ContactKind }) {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const canRead = session.status === 'authenticated' && hasPermission(session.user, 'contacts.read')
  const canWrite = canRead && session.status === 'authenticated' && hasPermission(session.user, 'contacts.write')
  const [search, setSearch] = useState('')
  const [archived, setArchived] = useState(false)
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const client = useQueryClient()
  const records = useContactList(kind, { search, archived, page, sort: sorting[0]?.id, descending: sorting[0]?.desc }, canRead)
  const companyColumns: ColumnDef<Company>[] = [
    { id: 'name', accessorKey: 'name', header: 'Société', cell: ({ row }) => <Link to={`/contacts/companies/${row.original.id}`}><ContactIdentity kind="company" {...row.original} filename={row.original.logo} /></Link> },
    { id: 'roles', header: 'Rôles', enableSorting: false, cell: ({ row }) => <span className="contact-role-list">{row.original.expand?.contacts_company_roles_via_company?.filter((role) => role.active).map((role) => <HBadge key={role.id}>{roleLabels[role.role]}</HBadge>)}</span> },
    { accessorKey: 'email', header: 'E-mail' }, { accessorKey: 'phone', header: 'Téléphone', enableSorting: false },
    { accessorKey: 'legal_name', header: 'Raison sociale' },
  ]
  const personColumns: ColumnDef<Person>[] = [
    { id: 'last_name', accessorKey: 'last_name', header: 'Contact', cell: ({ row }) => <Link to={`/contacts/people/${row.original.id}`}><ContactIdentity kind="person" {...row.original} filename={row.original.avatar} name={[row.original.first_name, row.original.last_name].filter(Boolean).join(' ')} company={row.original.expand?.company} /></Link> },
    { id: 'company', header: 'Société', enableSorting: false, cell: ({ row }) => row.original.expand?.company ? <Link to={`/contacts/companies/${row.original.company}`}>{row.original.expand.company.name}</Link> : '—' },
    { accessorKey: 'job_title', header: 'Fonction', enableSorting: false }, { accessorKey: 'email', header: 'E-mail' }, { accessorKey: 'phone', header: 'Téléphone', enableSorting: false },
  ]
  return <>
    <HPageHeader title="Contacts" description="Votre référentiel de sociétés et de personnes." actions={canWrite && <HButton asChild variant="primary"><Link to={`/contacts/${kind}/new`}><Plus size={15} />{kind === 'companies' ? 'Nouvelle société' : 'Nouveau contact'}</Link></HButton>} />
    <nav className="contact-tabs" aria-label="Référentiel Contacts"><Link className={kind === 'companies' ? 'selected' : ''} to="/contacts"><Building2 size={15} />Sociétés</Link><Link className={kind === 'people' ? 'selected' : ''} to="/contacts/people"><UsersRound size={15} />Personnes</Link></nav>
    {!canRead ? <div className="contact-empty"><h2>{isLayoutPreview ? 'Référentiel Contacts' : 'Accès aux contacts non autorisé'}</h2><p>{isLayoutPreview ? 'Connectez-vous à Horizon pour consulter les sociétés et les personnes.' : 'La permission contacts.read est nécessaire. Contactez votre administrateur.'}</p></div> : <>
      <div className="contact-toolbar"><HInput aria-label="Rechercher dans les contacts" placeholder={kind === 'companies' ? 'Rechercher une société, un e-mail…' : 'Rechercher une personne, une société…'} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />
        <select className="h-input" aria-label="État des fiches" value={archived ? 'archived' : 'active'} onChange={(event) => { setArchived(event.target.value === 'archived'); setPage(1) }}><option value="active">Actifs</option><option value="archived">Archivés</option></select>
        <HButton aria-label="Actualiser les contacts" size="icon" onClick={() => { void client.invalidateQueries({ queryKey: ['contacts'] }) }}><RefreshCw size={15} /></HButton><span>{records.data?.totalItems ?? '—'} résultat(s)</span>
      </div>
      {records.isFetching && <p role="status">Chargement des contacts…</p>}
      {records.error && <div role="alert" className="contact-error">{records.error.message}<HButton onClick={() => { void records.refetch() }}>Réessayer</HButton></div>}
      {records.data && (records.data.items.length ? kind === 'companies' ? <HDataTable data={records.data.items.filter((item): item is Company => 'name' in item)} columns={companyColumns} sorting={sorting} onSortingChange={(next) => { setSorting(next); setPage(1) }} /> : <HDataTable data={records.data.items.filter((item): item is Person => 'first_name' in item)} columns={personColumns} sorting={sorting} onSortingChange={(next) => { setSorting(next); setPage(1) }} /> : <div className="contact-empty"><h2>Aucun résultat</h2><p>{search ? 'Essayez une autre recherche.' : archived ? 'Aucune fiche archivée.' : 'Commencez par créer votre première fiche.'}</p></div>)}
      <div className="contact-pagination"><HButton disabled={page <= 1 || records.isFetching} onClick={() => setPage(page - 1)}>Précédent</HButton><span>Page {page} / {Math.max(records.data?.totalPages ?? 1, 1)}</span><HButton disabled={page >= (records.data?.totalPages ?? 1) || records.isFetching} onClick={() => setPage(page + 1)}>Suivant</HButton></div>
    </>}
  </>
}
export function PeoplePage() { return <ContactsPage kind="people" /> }
