import { hasPermission } from '../../../core/auth/types/session'
import { stageTotals } from '../stageTotals'
import { useCollapsedStages } from '../hooks/useCollapsedStages'
import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { Plus, Columns3, List, ChevronLeft, ChevronRight, Target } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HButton } from '../../../shared/ui/HButton'
import { HTag } from '../../../shared/ui/HTag'
import { useCrmSettings, CrmStageDialog } from '../../settings'
import { useReferences } from '../../settings/hooks/useReferences'
import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { HBadge } from '../../../shared/ui/HBadge'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { useCrmAccess, useCrmReferences } from '../hooks/useCrm'
import { crmService } from '../services/CrmService'
import { formatAmount, statusLabels, type Opportunity, type StageChange } from '../schemas/opportunities'
import { OpportunityCompany, OpportunityResponsible } from '../components/OpportunityIdentity'
import { OpportunityKanban } from '../components/OpportunityKanban'
export function CrmPage() {
  const { canRead, canWrite, userId } = useCrmAccess()
  const [params, setParams] = useSearchParams()
  const { stages, owners } = useCrmReferences(canRead)
  const client = useQueryClient()
  const settings = useCrmSettings(canRead)
  const markets = useReferences('crm_market_types', canRead)
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const canConfigure = session.status === 'authenticated' && hasPermission(session.user, 'settings.references')
  const [editingStage, setEditingStage] = useState<string>()
  const listQuery = params.toString()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const requestedView = params.get('view')
  const view = requestedView === 'list' || requestedView === 'kanban' ? requestedView : settings.data?.default_view || 'kanban'
  const archived = params.get('state') === 'archived'
  const status = params.get('status') || ''
  const sort = params.get('sort') || '-created'
  const records = useQuery({ queryKey: ['crm', 'opportunities', listQuery], queryFn: () => crmService.list({ search: params.get('q') || '', archived, status, company: params.get('company') || '', owner: params.get('owner') || '', sort, page }), enabled: canRead, retry: false })
  const summary = useQuery({ queryKey: ['crm', 'summary', listQuery], queryFn: () => crmService.summary({ search: params.get('q') || '', archived, status, company: params.get('company') || '', owner: params.get('owner') || '', sort, page }), enabled: canRead && view === 'kanban', retry: false })
  const [dragBusy, setDragBusy] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, StageChange>>({})
  const moveLock = useRef(false)
  const { collapsed, toggleCollapsed, expandCollapsed } = useCollapsedStages(userId)
  const moving = useMutation({
    mutationFn: (change: StageChange) => crmService.move([change]),
    onMutate: (change) => setDrafts({ [change.id]: change }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['activity'] }),
    onSettled: async () => {
      try { await client.invalidateQueries({ queryKey: ['crm'] }) }
      finally { setDrafts({}); moveLock.current = false }
    },
  })
  const enrichedRecords = (records.data?.items || []).map((record) => { const owner = owners.data?.find((user) => user.id === record.owner) || record.expand?.owner; return owner ? { ...record, expand: { ...record.expand, owner } } : record })
  const rows = enrichedRecords.map((record) => drafts[record.id] ? { ...record, stage: drafts[record.id]!.stage, status: stages.data?.find((stage) => stage.id === drafts[record.id]!.stage)?.status || record.status } : record)
  const totals = stageTotals(summary.data || [], records.data?.items || [], drafts)
  const stagesForRows = (stages.data || []).filter((stage) => stage.active || rows.some((record) => record.stage === stage.id) || totals.some((total) => total.stage === stage.id))
  function move(id: string, stage: string) {
    const original = records.data?.items.find((record) => record.id === id)
    if (!canWrite || archived || moveLock.current || !original || !original.active || original.stage === stage) return
    moveLock.current = true
    moving.mutate({ id, stage, updated: original.updated })
  }
  function changeParam(key: string, value: string) { setParams((current) => { const next = new URLSearchParams(current); if (value) next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); return next }) }
  const sorting: SortingState = [{ id: sort.replace(/^-/, ''), desc: sort.startsWith('-') }]
  const columns: ColumnDef<Opportunity>[] = [
    { id: 'opportunity_number', header: 'Code', accessorKey: 'opportunity_number', size: 90 },
    { id: 'title', header: 'Opportunité', accessorKey: 'title', cell: ({ row }) => <strong className="crm-table-title">{row.original.title}</strong> },
    { id: 'company', header: 'Société', enableSorting: false, cell: ({ row }) => <OpportunityCompany record={row.original} /> },
    { id: 'stage', header: 'Étape', enableSorting: false, cell: ({ row }) => { const stage = stages.data?.find((item) => item.id === row.original.stage); return stage ? <HTag color={stage.color} tone={stage.tone}>{stage.label}</HTag> : '—' } },
    { id: 'market_types', header: 'Types de marché', enableSorting: false, cell: ({ row }) => <div className="crm-market-tags">{row.original.market_types.map((id) => { const market = markets.data?.find((item) => item.id === id); return <HTag key={id} color={market?.color} tone={market?.tone || 'blue'}>{market?.label || 'Référence indisponible'}</HTag> })}</div> },
    { id: 'estimated_value', header: 'Montant estimé', cell: ({ row }) => formatAmount(row.original.estimated_value, row.original.currency) },
    { id: 'probability', header: 'Probabilité', enableSorting: false, cell: ({ row }) => `${row.original.probability} %` },
    { id: 'expected_date', header: 'Échéance', cell: ({ row }) => row.original.expected_date ? new Date(row.original.expected_date.replace(' ', 'T')).toLocaleDateString('fr-FR') : '—' },
    { id: 'owner', header: 'Responsable', enableSorting: false, cell: ({ row }) => <div className="crm-responsible-cell"><OpportunityResponsible record={row.original} /><span>{row.original.expand?.owner?.name || '—'}</span></div> },
    { id: 'status', header: 'État', enableSorting: false, cell: ({ row }) => <HBadge tone={row.original.status === 'won' ? 'success' : 'neutral'}>{statusLabels[row.original.status]}</HBadge> },
  ]
  if (!canRead) return <HEmptyState icon={Target} title="CRM" description="Vous ne disposez pas de la permission de consulter les opportunités." />
  return <div className="crm-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'CRM' }]} />
    <HBreadcrumbActions><nav className="record-navigator" aria-label="Pagination des opportunités"><span className="record-navigator-count">Page {page} / {Math.max(records.data?.totalPages || 1, 1)}</span><HButton variant="ghost" size="icon" aria-label="Page précédente" disabled={page <= 1 || records.isFetching || moving.isPending || dragBusy} onClick={() => changeParam('page', String(page - 1))}><ChevronLeft size={14} /></HButton><HButton variant="ghost" size="icon" aria-label="Page suivante" disabled={page >= (records.data?.totalPages || 1) || records.isFetching || moving.isPending || dragBusy} onClick={() => changeParam('page', String(page + 1))}><ChevronRight size={14} /></HButton></nav></HBreadcrumbActions>
    <HPageHeader title="CRM" description="Vos opportunités commerciales, de la qualification à la conclusion." actions={canWrite && <><HButton asChild variant="primary"><Link to={`/crm/opportunities/new${params.get('company') ? `?company=${params.get('company')}` : ''}`} state={{ crmListQuery: listQuery }}><Plus size={14} />Nouvelle opportunité</Link></HButton></>} />
    <div className="crm-list-toolbar"><span>{records.data?.totalItems ?? 0} opportunité(s){records.data && records.data.totalItems > rows.length ? ` · ${rows.length} sur cette page` : ''}</span><div className="contact-view-switch" role="group" aria-label="Présentation des opportunités"><HButton aria-pressed={view === 'kanban'} disabled={dragBusy} onClick={() => changeParam('view', 'kanban')}><Columns3 size={14} />Kanban</HButton><HButton aria-pressed={view === 'list'} disabled={dragBusy} onClick={() => changeParam('view', 'list')}><List size={14} />Liste</HButton></div></div>
    {[records.error, stages.error, owners.error, summary.error, settings.error, markets.error].filter(Boolean).map((error, index) => <p key={index} className="field-error" role="alert">{error?.message}<HButton size="small" onClick={() => { void records.refetch(); void stages.refetch(); void owners.refetch(); void summary.refetch(); void settings.refetch(); void markets.refetch() }}>Réessayer</HButton></p>)}
    {moving.error && <p className="field-error" role="alert">Déplacement non enregistré. {moving.error.message} La vue a été actualisée ; vous pouvez réessayer le déplacement.</p>}
    {records.isPending && <p role="status">Consultation des opportunités…</p>}
    {records.data && view === 'list' && <HDataTable data={rows} columns={columns} sorting={sorting} onSortingChange={(update) => { const next = typeof update === 'function' ? update(sorting) : update; const selected = next[0]; changeParam('sort', selected ? `${selected.desc ? '-' : ''}${selected.id}` : '-created') }} getRowLink={(record) => ({ href: `/crm/opportunities/${record.id}`, label: `Ouvrir l’opportunité ${record.title}`, state: { crmListQuery: listQuery } })} />}
    {records.data && !settings.isPending && view === 'kanban' && <OpportunityKanban key={listQuery} rows={rows} markets={markets.data || []} stages={stagesForRows} totals={totals} summaryReady={Boolean(summary.data)} editable={canWrite && !archived && !moving.isPending} drafts={drafts} listQuery={listQuery} collapsed={collapsed} onToggleCollapsed={(id) => { if (!dragBusy) toggleCollapsed(id) }} onExpandCollapsed={expandCollapsed} onBusyChange={setDragBusy} busy={dragBusy} onMove={move} onConfigure={canConfigure ? setEditingStage : undefined} />}
    {editingStage && stages.data?.find((stage) => stage.id === editingStage) && <CrmStageDialog stage={stages.data.find((stage) => stage.id === editingStage)!} onClose={() => setEditingStage(undefined)} />}
    {records.data && !rows.length && view === 'list' && <HEmptyState icon={Target} title="Aucune opportunité" description="Créez une opportunité ou adaptez les critères de recherche." />}
  </div>
}
