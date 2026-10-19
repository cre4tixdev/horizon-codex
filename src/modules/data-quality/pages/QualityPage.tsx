import { useState, useSyncExternalStore, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { Building2, UsersRound, Package, Merge, X, SearchCheck, ListChecks, GitCompareArrows, ShieldCheck, RotateCw, CheckCircle2 } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HProgressSteps } from '../../../shared/ui/HProgressSteps'
import { HButton } from '../../../shared/ui/HButton'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { HTableViewport } from '../../../shared/ui/HTableViewport'
import { HTableSortButton } from '../../../shared/ui/HTableSortButton'
import { mergeKindSchema, type MergeIdentity, type MergeKind } from '../../../shared/merge/schema'
import { filterValue } from '../../../shared/search/filters'
import { qualityMode, qualitySort } from '../searchFilters'
import { qualityService } from '../services/QualityService'
import { SelectedMerge } from '../components/SelectedMerge'
const tabs = [{ value: 'companies', label: 'Sociétés', icon: Building2, panel: 'quality-results' }, { value: 'people', label: 'Personnes', icon: UsersRound, panel: 'quality-results' }, { value: 'products', label: 'Produits', icon: Package, panel: 'quality-results' }]
const recordHref = (kind: MergeKind, id: string) => kind === 'products' ? `/inventory/products/${id}` : `/contacts/${kind}/${id}`
export function QualityPage() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot), client = useQueryClient()
  const [params, setParams] = useSearchParams()
  const permitted = (kind: string) => session.status === 'authenticated' && session.user.erpProfile !== 'viewer' && ['read', 'write', 'merge'].every((action) => hasPermission(session.user, `${kind === 'products' ? 'inventory' : 'contacts'}.${action}`))
  const allowedTabs = tabs.filter((tab) => permitted(tab.value)), parsed = mergeKindSchema.safeParse(params.get('kind')), kind = parsed.success ? parsed.data : (allowedTabs[0]?.value || 'companies') as MergeKind
  const mode = filterValue(params, qualityMode), sort = filterValue(params, qualitySort), search = params.get('q') || '', page = Math.max(1, Number(params.get('page')) || 1), started = params.get('run') === '1' || Boolean(search)
  const [selection, setSelection] = useState<{ context: string; items: MergeIdentity[] }>({ context: kind, items: [] })
  const [pair, setPair] = useState<{ kind: MergeKind; source: MergeIdentity; target: MergeIdentity }>()
  const [completed, setCompleted] = useState<{ kind: MergeKind; id: string }>()
  const selected = selection.context === `${kind}:${mode}` ? selection.items : []
  const list = useQuery({ queryKey: ['data-quality', kind, mode, search, page, sort, started], queryFn: () => qualityService.list(kind, { mode, q: search, page, sort }), enabled: permitted(kind) && started, retry: false })
  useEffect(() => { if (list.data && page > list.data.totalPages) setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(list.data.totalPages)); return next }, { replace: true }) }, [list.data, page, setParams])
  const change = (values: Record<string, string>) => setParams((current) => { const next = new URLSearchParams(current); Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); next.delete('page'); return next })
  if (!allowedTabs.length) return <HEmptyState icon={ShieldCheck} title="Qualité des données" description="La consultation, la modification et le droit de fusion d’au moins un domaine sont nécessaires." />
  return <>
    <HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Paramètres', href: '/settings' }, { label: 'Qualité des données' }]} />
    <HPageHeader title="Fusion des doublons" description="Rapprochez les fiches déjà présentes dans Horizon, importées ou créées manuellement." />
    <HRecordTabs value={kind} onChange={(value) => { change({ kind: value }); setPair(undefined); setCompleted(undefined) }} label="Domaine de fusion" items={allowedTabs} />
    <section id="quality-results" className="contact-panel">
      <HSectionHeading title="Assistant de fusion" description="Les suggestions aident à repérer les doublons. Vous choisissez toujours les fiches et les valeurs à conserver." actions={<><HButton onClick={() => change({ mode: 'manual', run: '1' })}><ListChecks size={15} />Choisir des fiches</HButton><HButton variant="primary" onClick={() => { change({ mode: 'duplicates', run: '1' }); if (started && mode === 'duplicates') void list.refetch() }}><SearchCheck size={15} />Rechercher les doublons</HButton></>} />
      <HProgressSteps label="Étapes de fusion" steps={[{ id: 'select', label: 'Sélectionner', icon: ListChecks, state: pair ? 'done' : 'current' }, { id: 'compare', label: 'Comparer', icon: GitCompareArrows, state: pair ? 'current' : 'pending' }, { id: 'confirm', label: 'Confirmer', icon: Merge, state: 'pending' }]} />
      {completed && <p role="status"><CheckCircle2 size={14} /> Fusion enregistrée. <Link to={recordHref(completed.kind, completed.id)}>Ouvrir la fiche conservée</Link>.</p>}
      {started && <HSectionHeading title={mode === 'duplicates' ? 'Rapprochements à examiner' : 'Fiches disponibles'} count={list.data?.totalItems} description={mode === 'duplicates' ? 'Chaque rapprochement concerne deux fiches ; les groupes plus importants se traitent successivement, avec une nouvelle comparaison.' : `${selected.length}/2 fiches sélectionnées. La première sera conservée ; vous pourrez inverser dans la comparaison.`} actions={<><HListPagination placement="inline" page={page} totalPages={list.data?.totalPages} label="Pagination des rapprochements" busy={list.isFetching} onPageChange={(next) => setParams((current) => { const value = new URLSearchParams(current); value.set('page', String(next)); return value })} />{mode === 'manual' && <HButton disabled={selected.length !== 2 || list.isFetching} onClick={() => setPair({ kind, target: selected[0]!, source: selected[1]! })}><GitCompareArrows size={15} />Comparer la sélection</HButton>}</>} />}
      {mode === 'manual' && selected.length > 0 && <div className="contact-record-actions">{selected.map((item, index) => <HButton key={item.id} onClick={() => setSelection({ context: `${kind}:${mode}`, items: selected.filter((chosen) => chosen.id !== item.id) })} aria-label={`Retirer ${item.label} de la sélection`}>{index === 0 ? 'Conserver : ' : 'Autre fiche : '}{item.label}<X size={13} /></HButton>)}</div>}
      {!permitted(kind) ? <p role="alert" className="field-error">Vous n’êtes pas habilité à fusionner ce domaine.</p> : !started ? <HEmptyState icon={Merge} title="Choisissez votre parcours" description="Sélectionnez deux fiches ou lancez une recherche de doublons. Aucune analyse globale ne démarre à l’ouverture." /> : list.isPending ? <p role="status">Recherche des fiches…</p> : list.error ? <p role="alert" className="field-error">{list.error.message}<HButton onClick={() => void list.refetch()}><RotateCw size={14} />Réessayer</HButton></p> : !list.data?.items.length ? <HEmptyState icon={SearchCheck} title="Aucun résultat" description="Modifiez la recherche dans la barre du haut ou choisissez manuellement des fiches." /> : <HTableViewport className="settings-reference-table"><table className="reference-table"><thead><tr>{mode === 'manual' && <th>Sélection</th>}<th><HTableSortButton label="Fiche" direction={sort === 'name:desc' ? 'desc' : 'asc'} onClick={() => change({ sort: sort === 'name:desc' ? 'name:asc' : 'name:desc' })}>Fiche{mode === 'duplicates' ? ' à conserver' : ''}</HTableSortButton></th><th>{mode === 'duplicates' ? 'Autre fiche' : 'Informations'}</th>{mode === 'duplicates' && <><th>Motif du rapprochement</th><th>Actions</th></>}</tr></thead><tbody>{list.data.items.map((row) => <tr key={row.id}>
        {mode === 'manual' && <td className="settings-action-cell"><input type="checkbox" aria-label={`Sélectionner ${row.left.label}`} checked={selected.some((item) => item.id === row.left.id)} disabled={!selected.some((item) => item.id === row.left.id) && selected.length >= 2} onChange={(event) => setSelection({ context: `${kind}:${mode}`, items: event.target.checked ? [...selected, row.left] : selected.filter((item) => item.id !== row.left.id) })} /></td>}
        <td><Link to={recordHref(kind, row.left.id)}>{row.left.label}</Link>{mode === 'duplicates' && row.left.detail && <small className="contact-muted"> · {row.left.detail}</small>}</td>
        <td>{row.right ? <><Link to={recordHref(kind, row.right.id)}>{row.right.label}</Link>{row.right.detail && <small className="contact-muted"> · {row.right.detail}</small>}</> : row.left.detail || '—'}</td>
        {mode === 'duplicates' && <><td>{row.reasons.join(' · ')}{row.members > 2 && <small className="contact-muted"> · {row.members} fiches similaires</small>}</td><td className="settings-action-cell"><HButton size="icon" aria-label={`Comparer ${row.left.label} et ${row.right?.label}`} title="Comparer les fiches" onClick={() => { if (row.right) setPair({ kind, target: row.left, source: row.right }) }}><GitCompareArrows size={15} /></HButton></td></>}
      </tr>)}</tbody></table></HTableViewport>}
    </section>
    {pair && <SelectedMerge {...pair} onClose={() => setPair(undefined)} onMerged={async (id) => { setCompleted({ kind: pair.kind, id }); setPair(undefined); setSelection({ context: '', items: [] }); await Promise.all([client.invalidateQueries({ queryKey: ['data-quality'] }), client.invalidateQueries({ queryKey: ['merge-options'] }), client.invalidateQueries({ queryKey: ['contacts'] }), ...['sales', 'billing', 'purchasing', 'analysis', 'documents', 'ged', 'inventory'].map((module) => client.invalidateQueries({ queryKey: [module] })), client.invalidateQueries({ queryKey: ['inventory'] }), client.invalidateQueries({ queryKey: ['activity'] })]) }} />}
  </>
}
