import '../activity.css'
import { useSyncExternalStore } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Activity, ArrowUpRight, AtSign, UserRound, UsersRound, RefreshCw } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { activityService } from '../../../core/activity/services/ActivityService'
import type { WorkspaceActivityItem } from '../../../core/activity/types/activity'
import { ActivityItem } from '../../../shared/activity/ActivityPanel'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HButton } from '../../../shared/ui/HButton'
import { HBadge } from '../../../shared/ui/HBadge'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { useRecordWorkspace } from '../../../shared/records/recordContext'
import { activityCategories, activityModules } from '../searchFilters'
const resources: Record<string, string> = { contacts_companies: 'company', contacts_people: 'person', crm_opportunities: 'opportunity', sales_quotes: 'quote', purchasing_requests: 'purchase-request', purchasing_orders: 'purchase-order', inventory_products: 'product', inventory_operations: 'stock-operation', billing_invoices: 'billing-customer', billing_supplier_invoices: 'billing-supplier', billing_credit_notes: 'billing-customer_credit', billing_supplier_credit_notes: 'billing-supplier_credit' }
const views = [{ value: 'team', label: 'Équipe', icon: UsersRound }, { value: 'own', label: 'Mon activité', icon: UserRound }, { value: 'mentions', label: 'Mes mentions', icon: AtSign }]
export function ActivityPage() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot), [params, setParams] = useSearchParams(), open = useRecordWorkspace()
  const canRead = session.status === 'authenticated' && Object.keys(activityModules).some((module) => session.user.role.permissions.includes(`${module}.read`))
  const view = views.some((v) => v.value === params.get('view')) ? params.get('view')! : 'team'
  const feed = useQuery({ queryKey: ['activity', 'workspace', session.status === 'authenticated' ? session.user.id : '', params.toString()], queryFn: () => activityService.feed(Object.fromEntries(params)), enabled: canRead, retry: false, refetchInterval: 30_000 })
  const changePage = (page: number) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(page)); return next })
  const timeline = (items: WorkspaceActivityItem[]) => <ol className="activity-timeline" aria-label="Événements d’activité">{items.map((item) => <ActivityItem key={item.id} item={item} source={item.source} task={item.task || undefined} editable={false} taskBusy={false} context={<div className="workspace-activity-source"><HBadge>{activityModules[item.module]}</HBadge><Link to={`${item.href}#activity`} onClick={(event) => {
    const resource = resources[item.source.entity]
    if (!resource || !open || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault(); const anchor = event.currentTarget
    void open({ resource, id: item.source.id, returnFocus: () => anchor.focus() })
  }} title={`Ouvrir ${item.sourceLabel}`}>{item.sourceLabel}<ArrowUpRight size={13} aria-hidden="true" /></Link></div>} />)}</ol>
  const group = params.get('group') || ''
  const groups = groupResults(feed.data?.items || [], (item) => group === 'module' ? { key: item.module, label: activityModules[item.module] || item.module } : group === 'type' ? { key: item.category, label: activityCategories[item.category] || item.category } : { key: item.day, label: new Date(`${item.day}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }).map((g) => ({ ...g, total: feed.data?.groups[g.key] || g.total }))
  if (group === 'day') groups.sort((a, b) => a.key.localeCompare(b.key) * (params.get('sort') === 'created' ? 1 : -1))
  return <div className="contact-directory workspace-activity"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Activité' }]} /><HPageHeader title="Activité" description="Les échanges et les événements de vos fiches Horizon." actions={canRead && <HButton variant="ghost" disabled={feed.isFetching} onClick={() => void feed.refetch()}><RefreshCw size={14} />Actualiser</HButton>} />
    {!canRead ? <HEmptyState icon={Activity} title="Activité non accessible" description="Aucun module métier consultable." /> : <><HRecordTabs label="Vues de l’activité" idPrefix="workspace-activity" value={view} items={views.map((v) => ({ ...v, panel: 'workspace-activity-results' }))} onChange={(value) => setParams((current) => { const next = new URLSearchParams(current); next.set('view', value); next.delete('page'); return next })} />
      <section id="workspace-activity-results" role="tabpanel" aria-labelledby={`workspace-activity-${view}`}>
        <div className="contact-toolbar"><span className="contact-result-count" role="status">{feed.data ? `${feed.data.totalItems} événement${feed.data.totalItems === 1 ? '' : 's'}` : 'Activité'} · {view === 'own' ? 'Vos publications et les tâches qui vous sont assignées' : view === 'mentions' ? 'Les publications dans lesquelles vous êtes mentionné' : 'Les fiches auxquelles vous avez accès'}</span></div>
        {feed.isPending && <HLoadingIndicator label="Chargement de l’activité…" />}
        {feed.error && <HEmptyState icon={Activity} title="Activité indisponible" description={feed.error.message}><HButton onClick={() => void feed.refetch()}>Réessayer</HButton></HEmptyState>}
        {feed.data && <><HListPagination page={feed.data.page} totalPages={feed.data.totalPages} busy={feed.isFetching} label="Pagination de l’activité" onPageChange={changePage} />{feed.data.items.length ? group ? <GroupedResults groups={groups} icon={Activity} noun="événements" render={timeline} /> : timeline(feed.data.items) : <HEmptyState icon={Activity} title="Aucune activité pour cette sélection" description="Modifiez les critères dans la barre de recherche pour élargir les résultats." />}</>}
      </section></>}
  </div>
}
