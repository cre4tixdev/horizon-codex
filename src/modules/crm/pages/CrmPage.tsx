import { useCrmRealtime } from '../hooks/useCrmRealtime'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { BusinessCalendar } from '../../calendar'
import { tenderService } from '../services/TenderService'
import { displayDate } from '../../../shared/time/zonedDate'
import { hasPermission } from '../../../core/auth/types/session'
import { stageTotals } from '../stageTotals'
import { useCollapsedStages } from '../hooks/useCollapsedStages'
import { usePreferredView } from '../hooks/usePreferredView'
import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { Plus, Columns3, List, ChevronLeft, ChevronRight, Target, CalendarDays, Building2 } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HTag } from '../../../shared/ui/HTag'
import { useCrmSettings, CrmStageDialog } from '../../settings'
import { useReferences } from '../../settings/hooks/useReferences'
import { useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { useCrmAccess, useCrmReferences } from '../hooks/useCrm'
import { crmService } from '../services/CrmService'
import { formatAmount, crmRecordHref, type Opportunity, type StageChange } from '../schemas/opportunities'
import { OpportunityCompany, OpportunityResponsible } from '../components/OpportunityIdentity'
import { OpportunityKanban } from '../components/OpportunityKanban'
export function CrmPage() {
  const { canRead, canWrite, userId } = useCrmAccess()
  const realtimeError = useCrmRealtime(canRead)
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
  const { preferredView, rememberView } = usePreferredView(userId)
  const defaultView = settings.data?.default_view === 'last' ? preferredView || 'kanban' : settings.data?.default_view || 'kanban'
  const view = requestedView === 'calendar' || requestedView === 'list' || requestedView === 'kanban' ? requestedView : defaultView
  const ao = params.get('area') === 'ao'
  const aoStages = useReferences('crm_tender_statuses', canRead && ao)
  const aoTags = useReferences('crm_tender_tags', canRead && ao)
  const type = ao ? 'tender' : params.get('type') || ''
  const archived = params.get('state') === 'archived'
  const status = params.get('status') || ''
  const sort = params.get('sort') || '-created'
  const records = useQuery({ queryKey: ['crm', 'opportunities', listQuery], queryFn: () => (ao ? tenderService : crmService).list({ search: params.get('q') || '', archived, status, company: params.get('company') || '', owner: params.get('owner') || '', sort, page, type, preparationStatus: params.get('preparation') || '', tag: params.get('tag') || '' }), enabled: canRead, retry: false })
  const summary = useQuery({ queryKey: ['crm', 'summary', listQuery], queryFn: () => (ao ? tenderService : crmService).summary({ search: params.get('q') || '', archived, status, company: params.get('company') || '', owner: params.get('owner') || '', sort, page, type, preparation: ao, preparationStatus: params.get('preparation') || '', tag: params.get('tag') || '' }), enabled: canRead && view === 'kanban', retry: false })
  const [dragBusy, setDragBusy] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, StageChange>>({})
  const moveLock = useRef(false)
  const { collapsed, toggleCollapsed, expandCollapsed } = useCollapsedStages(`${userId}${ao ? '.ao' : ''}`)
  const moving = useMutation({
    mutationFn: (change: StageChange) => { const item = records.data?.items.find((row) => row.id === change.id); return ao && item?.tender ? tenderService.move(item.tender.id, change.stage, item.tender.updated) : crmService.move([change]) },
    onMutate: (change) => setDrafts({ [change.id]: change }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['activity'] }),
    onSettled: async () => {
      try { await client.invalidateQueries({ queryKey: ['crm'] }) }
      finally { setDrafts({}); moveLock.current = false }
    },
  })
  const enrichedRecords = (records.data?.items || []).map((record) => { const owner = owners.data?.find((user) => user.id === record.owner) || record.expand?.owner; return owner ? { ...record, expand: { ...record.expand, owner } } : record })
  const kanbanStages = ao ? (aoStages.data || []).map((stage) => ({ ...stage, tone: stage.tone || 'blue' as const, status: 'open' as const })) : stages.data || []
  const rows = enrichedRecords.map((record) => drafts[record.id] ? { ...record, stage: drafts[record.id]!.stage, status: stages.data?.find((stage) => stage.id === drafts[record.id]!.stage)?.status || record.status } : record)
  const boardRows = ao ? rows.map((item) => ({ ...item, stage: drafts[item.id]?.stage || item.tender?.status || '', market_types: [...item.market_types, ...(item.tender?.tags || [])] })) : rows
  const totals = stageTotals(summary.data || [], ao ? (records.data?.items || []).map((item) => ({ ...item, stage: item.tender?.status || '' })) : records.data?.items || [], drafts)
  const stagesForRows = kanbanStages.filter((stage) => stage.active || boardRows.some((record) => record.stage === stage.id) || totals.some((total) => total.stage === stage.id))
  function move(id: string, stage: string) {
    const original = records.data?.items.find((record) => record.id === id)
    if (!canWrite || archived || moveLock.current || !original || !original.active || (ao ? original.tender?.status : original.stage) === stage) return
    moveLock.current = true
    moving.mutate({ id, stage, updated: original.updated })
  }
  function changeParam(key: string, value: string) { if (key === 'view' && (value === 'kanban' || value === 'list')) rememberView(value); setParams((current) => { const next = new URLSearchParams(current); if (value) next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); return next }) }
  const sorting: SortingState = [{ id: sort.replace(/^-/, ''), desc: sort.startsWith('-') }]
  const columns: ColumnDef<Opportunity>[] = [
    { id: 'opportunity_number', header: 'Code', accessorKey: 'opportunity_number', size: 90 },
    { id: 'type', header: 'Type', enableSorting: false, cell: ({ row }) => <HTag tone={row.original.type === 'tender' ? 'violet' : 'blue'}>{row.original.type === 'tender' ? 'AO' : 'Directe'}</HTag> },
    { id: 'title', header: 'Opportunité', accessorKey: 'title', cell: ({ row }) => <strong className="crm-table-title">{row.original.title}</strong> },
    { id: 'company', header: 'Société', enableSorting: false, cell: ({ row }) => <OpportunityCompany record={row.original} /> },
    { id: 'stage', header: 'Étape', enableSorting: false, cell: ({ row }) => { const stage = stages.data?.find((item) => item.id === row.original.stage); return stage ? <HTag color={stage.color} tone={stage.tone}>{stage.label}</HTag> : '—' } },
    { id: 'market_types', header: 'Types de marché', enableSorting: false, cell: ({ row }) => <div className="crm-market-tags">{row.original.market_types.map((id) => { const market = markets.data?.find((item) => item.id === id); return <HTag key={id} color={market?.color} tone={market?.tone || 'blue'}>{market?.label || 'Référence indisponible'}</HTag> })}</div> },
    { id: 'estimated_value', header: 'Montant estimé', accessorKey: 'estimated_value', cell: ({ row }) => formatAmount(row.original.estimated_value, row.original.currency) },
    { id: 'probability', header: 'Probabilité', enableSorting: false, cell: ({ row }) => `${row.original.probability} %` },
    { id: 'expected_date', header: 'Échéance', cell: ({ row }) => row.original.expected_date ? new Date(row.original.expected_date.replace(' ', 'T')).toLocaleDateString('fr-FR') : '—' },
    { id: 'owner', header: 'Responsable', enableSorting: false, cell: ({ row }) => <div className="crm-responsible-cell"><OpportunityResponsible record={row.original} /><span>{row.original.expand?.owner?.name || '—'}</span></div> },
  ]
  if (ao) columns.splice(0, columns.length,
    { id: 'reference', header: 'Référence AO', accessorFn: (item) => item.tender?.reference || '—', size: 110 },
    { id: 'company', header: 'Société', enableSorting: false, cell: ({ row }) => <OpportunityCompany record={row.original} /> },
    { id: 'title', header: 'Appel d’offres', accessorKey: 'title', cell: ({ row }) => <strong className="crm-table-title">{row.original.title}</strong> },
    { id: 'tags', header: 'Tags', enableSorting: false, cell: ({ row }) => <div className="crm-market-tags">{[...row.original.market_types, ...(row.original.tender?.tags || [])].map((id) => { const tag = [...(markets.data || []), ...(aoTags.data || [])].find((item) => item.id === id); return <HTag key={id} color={tag?.color} tone={tag?.tone || 'blue'}>{tag?.label || 'Référence indisponible'}</HTag> })}</div> },
    { id: 'publication_date', header: 'Publication', accessorFn: (item) => item.tender?.publication_date, cell: ({ row }) => row.original.tender?.publication_date ? new Date(row.original.tender.publication_date).toLocaleDateString('fr-FR', { timeZone: 'UTC' }) : '—' },
    { id: 'visits', header: 'Visites', enableSorting: false, cell: ({ row }) => <span title={row.original.tender?.visit_required ? 'Visite obligatoire' : 'Visite facultative'}>{row.original.visit_count} date(s){row.original.tender?.visit_required ? ' · obligatoire' : ''}</span> },
    { id: 'preparation', header: 'Préparation', enableSorting: false, cell: ({ row }) => { const stage = aoStages.data?.find((item) => item.id === row.original.tender?.status); return canWrite && !archived && row.original.tender ? <div className="tender-stage-cell h-tone" data-tone={stage?.tone || 'blue'} style={stage?.color ? { '--tag-color': stage.color } as React.CSSProperties : undefined}><HCombobox label={`Préparation de ${row.original.title}`} value={stage?.id || ''} showCodes={false} required clearable={false} disabled={moving.isPending} options={(aoStages.data || []).filter((item) => item.active || item.id === stage?.id).map((item) => ({ value: item.id, label: item.label, disabled: !item.active }))} onChange={(value) => move(row.original.id, value)} /></div> : stage ? <HTag color={stage.color} tone={stage.tone || 'blue'}>{stage.label}</HTag> : '—' } },
    { id: 'submission_deadline', header: 'Remise', accessorFn: (item) => item.tender?.submission_deadline, cell: ({ row }) => row.original.tender?.submission_deadline ? displayDate(row.original.tender.submission_deadline, row.original.tender.timezone) : '—' },
    { id: 'estimated_value', header: 'Montant estimé', accessorKey: 'estimated_value', cell: ({ row }) => formatAmount(row.original.estimated_value, row.original.currency) },
    { id: 'documents', header: 'Documents', enableSorting: false, cell: ({ row }) => row.original.document_count || '—' },
    { id: 'owner', header: 'Responsable', enableSorting: false, cell: ({ row }) => <div className="crm-responsible-cell"><OpportunityResponsible record={row.original} /><span>{row.original.expand?.owner?.name || '—'}</span></div> },
  )
  const renderTable = (items: Opportunity[]) => <HDataTable data={items} columns={columns} sorting={sorting} onSortingChange={(update) => { const next = typeof update === 'function' ? update(sorting) : update; const selected = next[0]; changeParam('sort', selected ? `${selected.desc ? '-' : ''}${selected.id}` : '-created') }} getRowLink={(record) => ({ href: crmRecordHref(record), label: `Ouvrir l’opportunité ${record.title}`, state: { crmListQuery: listQuery } })} />
  if (!canRead) return <HEmptyState icon={Target} title="CRM" description="Vous ne disposez pas de la permission de consulter les opportunités." />
  return <div className="crm-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, ...(ao ? [{ label: 'CRM', href: '/crm' }, { label: 'Appels d’offres' }] : [{ label: 'CRM' }])]} />
    <HBreadcrumbActions><nav className="record-navigator" aria-label="Pagination des opportunités"><span className="record-navigator-count">Page {page} / {Math.max(records.data?.totalPages || 1, 1)}</span><HButton variant="ghost" size="icon" aria-label="Page précédente" disabled={page <= 1 || records.isFetching || moving.isPending || dragBusy} onClick={() => changeParam('page', String(page - 1))}><ChevronLeft size={14} /></HButton><HButton variant="ghost" size="icon" aria-label="Page suivante" disabled={page >= (records.data?.totalPages || 1) || records.isFetching || moving.isPending || dragBusy} onClick={() => changeParam('page', String(page + 1))}><ChevronRight size={14} /></HButton></nav></HBreadcrumbActions>
    <HPageHeader title={ao ? 'Appels d’offres' : 'CRM'} description={ao ? "Vos consultations, réponses et échéances d’appels d’offres." : "Vos opportunités commerciales, de la qualification à la conclusion."} actions={canWrite && <><HButton asChild variant="primary"><Link to={`/crm/${ao ? 'tenders' : 'opportunities'}/new?${new URLSearchParams({ ...(params.get('company') ? { company: params.get('company')! } : {}), ...(ao ? { type: 'tender' } : {}) })}`}  state={{ crmListQuery: listQuery }}><Plus size={14} /> {ao ? 'Nouvel appel d’offres' : 'Nouvelle opportunité'}</Link></HButton></>} />
    <div className="crm-list-toolbar"><span>{records.data?.totalItems ?? 0} {ao ? 'appel(s) d’offres' : 'opportunité(s)'}{records.data && records.data.totalItems > rows.length ? ` · ${rows.length} sur cette page` : ''}</span><div className="contact-view-switch" role="group" aria-label="Présentation des opportunités"><HButton aria-pressed={view === 'kanban'} disabled={dragBusy} onClick={() => changeParam('view', 'kanban')}><Columns3 size={14} />Kanban</HButton><HButton aria-pressed={view === 'list'} disabled={dragBusy} onClick={() => changeParam('view', 'list')}><List size={14} />Liste</HButton>{ao && <HButton aria-pressed={view === 'calendar'} onClick={() => changeParam('view', 'calendar')}><CalendarDays size={14} />Planning</HButton>}</div></div>
    {realtimeError && <p className="field-error" role="alert">{realtimeError}</p>}
    {[records.error, stages.error, owners.error, summary.error, settings.error, markets.error, aoStages.error, aoTags.error].filter(Boolean).map((error, index) => <p key={index} className="field-error" role="alert">{error?.message}<HButton size="small" onClick={() => { void records.refetch(); void stages.refetch(); void owners.refetch(); void summary.refetch(); void settings.refetch(); void markets.refetch(); void aoStages.refetch(); void aoTags.refetch() }}>Réessayer</HButton></p>)}
    {moving.error && <p className="field-error" role="alert">Déplacement non enregistré. {moving.error.message} La vue a été actualisée ; vous pouvez réessayer le déplacement.</p>}
    {records.isPending && <HLoadingIndicator label="Chargement des dossiers CRM" />}
    {records.data && view === 'list' && (params.get('group') === 'company' ? <GroupedResults groups={groupResults(rows, (item) => ({ key: item.company, label: item.expand?.company?.name || 'Société' }))} icon={Building2} noun="opportunité(s)" render={renderTable} /> : renderTable(rows))}
    {ao && view === 'calendar' && <BusinessCalendar layout="timeline" scope="tenders" search={params.get('q') || ''} archived={archived} status={status} company={params.get('company') || ''} owner={params.get('owner') || ''} preparationStatus={params.get('preparation') || ''} tag={params.get('tag') || ''} />}
    {records.data && !settings.isPending && view === 'kanban' && <OpportunityKanban emptyMessage={ao ? "Aucun appel d’offres" : "Aucune opportunité"} key={listQuery} rows={boardRows} markets={[...(markets.data || []), ...(aoTags.data || [])]} stages={stagesForRows} totals={totals} summaryReady={Boolean(summary.data)} editable={canWrite && !archived && !moving.isPending} drafts={drafts} listQuery={listQuery} collapsed={collapsed} onToggleCollapsed={(id) => { if (!dragBusy) toggleCollapsed(id) }} onExpandCollapsed={expandCollapsed} onBusyChange={setDragBusy} busy={dragBusy} onMove={move} onConfigure={canConfigure ? setEditingStage : undefined} />}
    {editingStage && kanbanStages.find((stage) => stage.id === editingStage) && <CrmStageDialog catalog={ao ? 'crm_tender_statuses' : 'crm_stages'} stage={(ao ? aoStages.data : stages.data)!.find((stage) => stage.id === editingStage)!} onClose={() => setEditingStage(undefined)} />}
    {records.data && !rows.length && view === 'list' && <HEmptyState icon={Target} title={ao ? "Aucun appel d’offres" : "Aucune opportunité"} description="Créez un dossier ou adaptez les critères de recherche." />}
  </div>
}
