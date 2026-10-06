import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { HButton } from '../../../shared/ui/HButton'
import { contactsService } from '../services/ContactsService'
import { ContactIdentity } from './ContactIdentity'
export function CompanyPeople({ company, editable }: { company: string; editable: boolean }) {
  const [page, setPage] = useState(1)
  const [archived, setArchived] = useState(false)
  const archiveQuery = useQuery({ queryKey: ['contacts', 'company-people', company, 1, true], queryFn: () => contactsService.people({ company, search: '', page: 1, archived: true }), retry: false })
  const archivedCount = archiveQuery.data?.totalItems ?? 0
  const showingArchived = archived && archivedCount > 0
  const query = useQuery({ queryKey: ['contacts', 'company-people', company, page, showingArchived], queryFn: () => contactsService.people({ company, search: '', page, archived: showingArchived }), retry: false })
  return <section className="contact-related company-people-directory" aria-busy={query.isFetching}>
    <div className="contact-section-heading">
      <h2>Contacts associés {query.data && <small>({query.data.totalItems})</small>}</h2>
      <div className="company-people-actions">
        {archivedCount > 0 && <div className="company-people-filters" role="group" aria-label="État des contacts associés">
          <HButton variant="ghost" size="small" aria-pressed={!showingArchived} onClick={() => { setArchived(false); setPage(1) }}>Actifs</HButton>
          <HButton variant="ghost" size="small" aria-pressed={showingArchived} onClick={() => { setArchived(true); setPage(1) }}>Archivés <span className="company-people-filter-count">{archivedCount}</span></HButton>
        </div>}
        {editable && <HButton asChild size="small"><Link to={`/contacts/people/new?company=${encodeURIComponent(company)}`}>Ajouter un contact</Link></HButton>}
      </div>
    </div>
    {archiveQuery.error && archiveQuery.error !== query.error && <p role="alert" className="field-error">Impossible de vérifier les contacts archivés. <HButton size="small" onClick={() => { void archiveQuery.refetch() }}>Réessayer</HButton></p>}
    {query.error && <p role="alert">{query.error.message}<HButton onClick={() => { void query.refetch() }}>Réessayer</HButton></p>}<div className="company-people-grid">{query.isPending && <div className="company-people-loading" role="status" aria-label="Chargement des contacts associés"><span aria-hidden="true" /><span aria-hidden="true" /></div>}{query.data?.items.map((person) => <article className="company-person" key={person.id}><Link to={`/contacts/people/${person.id}`}><ContactIdentity kind="person" collectionId={person.collectionId} id={person.id} filename={person.avatar} name={[person.first_name, person.last_name].filter(Boolean).join(' ')} /></Link><p>{person.job_title || 'Fonction non renseignée'}</p>{person.email && <a href={`mailto:${person.email}`}>{person.email}</a>}{(person.phone || person.mobile) && <p>{person.phone || person.mobile}</p>}</article>)}</div>{query.data?.totalItems === 0 && <p className="contact-muted">Aucun contact {showingArchived ? 'archivé' : 'actif'} associé.</p>}{query.data && query.data.totalPages > 1 && <div className="contact-form-actions"><HButton disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</HButton><span>Page {page} / {query.data.totalPages}</span><HButton disabled={page >= query.data.totalPages} onClick={() => setPage(page + 1)}>Suivant</HButton></div>}</section>
}
