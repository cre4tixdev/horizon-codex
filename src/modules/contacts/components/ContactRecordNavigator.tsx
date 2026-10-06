import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HButton } from '../../../shared/ui/HButton'
import { HDialog } from '../../../shared/ui/HDialog'
import { contactsService } from '../services/ContactsService'
import { directoryContext, directoryOptions } from '../navigationContext'
import type { ContactKind } from '../types/contacts'

export function ContactRecordNavigator({ kind, id, active, dirty, busy, onChanging }: { kind: ContactKind; id: string; active: boolean; dirty: boolean; busy: boolean; onChanging: (changing: boolean) => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const context = directoryContext(location.state, kind)
  const options = directoryOptions(context, kind, active)
  const client = useQueryClient()
  const navigation = useQuery({ queryKey: ['contacts', 'navigation', kind, id, options], queryFn: () => contactsService.navigation(kind, id, options), staleTime: 10_000, retry: false })
  const [pending, setPending] = useState('')
  const [changing, setChanging] = useState(false)
  const [transitionError, setTransitionError] = useState('')
  const transition = useRef<object | null>(null)
  useEffect(() => () => { transition.current = null }, [])
  const state = context ? { contactDirectory: context } : undefined
  const title = kind === 'companies' ? 'société' : 'contact'
  async function openRecord(target: string) {
    if (transition.current) return
    const token = {}
    transition.current = token
    setPending(''); setTransitionError(''); setChanging(true); onChanging(true)
    try {
      // Keep the current editor mounted until all data needed by the next editor is ready.
      await Promise.all([
        client.fetchQuery({ queryKey: ['contacts', kind, target], queryFn: async () => kind === 'companies' ? contactsService.company(target) : contactsService.person(target), staleTime: 10_000, retry: false }),
        ...(kind === 'companies' ? [
          client.prefetchQuery({ queryKey: ['contacts', 'company-people-count', target], queryFn: () => contactsService.companyPeopleCount(target), staleTime: 10_000, retry: false }),
          client.fetchQuery({ queryKey: ['contacts', 'addresses', target], queryFn: () => contactsService.addresses(target), staleTime: 10_000, retry: false }),
          client.fetchQuery({ queryKey: ['contacts', 'accounts', target], queryFn: () => contactsService.accounts(target), staleTime: 10_000, retry: false }),
        ] : []),
        client.fetchQuery({ queryKey: ['contacts', 'navigation', kind, target, options], queryFn: () => contactsService.navigation(kind, target, options), staleTime: 10_000, retry: false }),
      ])
      if (transition.current === token) navigate(`/contacts/${kind}/${target}`, { state })
    } catch (error) {
      if (transition.current === token) setTransitionError(error instanceof Error ? error.message : 'La fiche n’a pas pu être chargée. Réessayez.')
    } finally {
      if (transition.current === token) { transition.current = null; setChanging(false); onChanging(false) }
    }
  }
  return <HBreadcrumbActions><nav className="record-navigator" aria-label={`Navigation des fiches ${kind === 'companies' ? 'sociétés' : 'contacts'}`} aria-busy={navigation.isFetching || changing}>
    <span className="record-navigator-count" aria-live="polite" title={context ? 'Position dans les résultats du répertoire' : 'Position dans le répertoire'}>{navigation.data ? navigation.data.position ? `${navigation.data.position} / ${navigation.data.total}` : `Hors filtre · ${navigation.data.total}` : '— / —'}</span>
    {navigation.error && <HButton size="icon" variant="ghost" title={navigation.error.message} aria-label="Réessayer la navigation des fiches" onClick={() => { void navigation.refetch() }}><RefreshCw size={13} /></HButton>}
    {([{ id: navigation.data?.previous, label: `${title === 'société' ? 'Société précédente' : 'Contact précédent'}`, Icon: ChevronLeft }, { id: navigation.data?.next, label: `${title === 'société' ? 'Société suivante' : 'Contact suivant'}`, Icon: ChevronRight }]).map((item) => item.id && !busy && !navigation.isFetching && !changing ? <HButton key={item.label} asChild size="icon" variant="ghost"><Link to={`/contacts/${kind}/${item.id}`} state={state} aria-label={item.label} title={item.label} onClick={(event) => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) { event.preventDefault(); if (dirty) setPending(item.id!); else void openRecord(item.id!) } }}><item.Icon size={15} /></Link></HButton> : <HButton key={item.label} size="icon" variant="ghost" disabled aria-label={item.label}><item.Icon size={15} /></HButton>)}
  </nav><HDialog open={Boolean(pending)} onOpenChange={(open) => { if (!open) setPending('') }} title="Quitter sans enregistrer ?" description="Cette fiche contient des modifications non enregistrées. Elles seront perdues si vous changez de fiche."><div className="archive-confirmation-actions"><HButton onClick={() => setPending('')}>Rester sur la fiche</HButton><HButton variant="primary" onClick={() => { void openRecord(pending) }}>Quitter sans enregistrer</HButton></div></HDialog><HDialog open={Boolean(transitionError)} onOpenChange={(open) => { if (!open) setTransitionError('') }} title="Impossible d’ouvrir la fiche" description={transitionError}><div className="archive-confirmation-actions"><HButton onClick={() => setTransitionError('')}>Rester sur la fiche</HButton></div></HDialog></HBreadcrumbActions>
}
