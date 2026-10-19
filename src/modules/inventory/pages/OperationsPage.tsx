import { keepPreviousListData } from '../../../shared/search/keepPreviousListData'
import { useListPageSize } from '../../../shared/hooks/useListPageSize'
import { operationState } from '../operationPresentation'
import { useListTableSorting } from '../../../shared/search/useListTableSorting'
import { operationView, changeOperationView } from '../operationView'
import { HViewSwitch } from '../../../shared/ui/HViewSwitch'
import { useEffect } from 'react'
import { normalizeOperationFilters, operationGroup } from '../searchOperationFilters'
import { DeliveryReadiness } from '../components/DeliveryReadiness'
import { useLocation, useSearchParams, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, CalendarDays, List, ClipboardList, LayoutDashboard } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HButton } from '../../../shared/ui/HButton'
import { HAffairTags } from '../../../shared/ui/HAffairTags'
import { HTag } from '../../../shared/ui/HTag'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { HMonthCalendar } from '../../../shared/ui/HMonthCalendar'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { displayDate } from '../../../shared/time/zonedDate'
import '../stock-operations.css'
import { OperationTiles } from '../components/OperationTiles'
import { operationTiles } from '../operationPresentation'
import { operationsService } from '../services/OperationsService'
import { useStockAccess } from '../hooks/useStockAccess'
import { operationLabels, type Operation, type OperationsQuery } from '../schemas/operations'
export function OperationsPage() {
  const listSorting = useListTableSorting('-created', {"number": "number", "provenance": "provenance", "Opération": "operation", "Titre / Destination": "title", "warehouse_name": "warehouse_name", "affairs": "affairs", "Planifié le": "planned_date", "Date": "document_date", "readiness": "readiness", "state": "status", "from_name": "from_name", "to_name": "to_name", "source_document": "source_document", "title": "title"})
  const { pathname } = useLocation(), inventories = pathname.endsWith('inventories'), [params, setParams] = useSearchParams(), access = useStockAccess(), calendar = inventories && params.get('view') === 'calendar'
  useEffect(() => { const next = normalizeOperationFilters(params); if (next.toString() !== params.toString()) setParams(next, { replace: true }) }, [params, setParams])
  const listMode = inventories || operationView(params) === 'list'
  const selected = listMode ? normalizeOperationFilters(params) : new URLSearchParams()
  const { onMount: listRoot, perPage, control: pageSizeControl } = useListPageSize('list', listMode && !calendar)
  const options: OperationsQuery = Object.fromEntries(['q', 'variant', 'state', 'status', 'warehouse', 'opportunity', 'product', 'purchase_order', 'sales_quote', 'group', 'sort'].map((key) => [key, selected.get(key) || '']))
  options.perPage = perPage; options.kind = inventories ? 'INV' : selected.get('kind') || ''; options.page = listMode ? Math.max(1, Number(params.get('page')) || 1) : 1; options.calendar = String(calendar); options.timeline = String(!inventories && !listMode)
  const query = useQuery({ queryKey: ['inventory', 'operations', options], queryFn: () => operationsService.list(options), enabled: access.canRead, retry: false, placeholderData: keepPreviousListData(['inventory', 'operations']), refetchInterval: 30000 })
  const selectedTile = operationTiles.find((tile) => tile.kind === options.kind && tile.variant === (options.variant || ''))
  const title = inventories ? 'Inventaires' : selectedTile?.label || 'Opérations de stock'
  const columns: ColumnDef<Operation>[] = inventories ? [{ header: 'Numéro', accessorKey: 'number', cell: ({ row }) => row.original.display_number || row.original.number || 'Brouillon', size: 145 }, ...(options.kind === 'IN' ? [{ id: 'provenance', header: 'Provenance', size: 210, cell: ({ row }: { row: { original: Operation } }) => row.original.supplier_name || row.original.reason || 'Entrée manuelle' }] : [{ header: 'Opération', cell: ({ row }: { row: { original: Operation } }) => row.original.internal_use ? 'Affectation interne' : row.original.scrap ? 'Mise au rebut' : row.original.dropship ? 'Livraison directe' : operationLabels[row.original.kind], size: 150 }]), { header: 'Titre / Destination', cell: ({ row }) => row.original.title || row.original.destination || '—', size: 240 }, { header: 'Entrepôt', accessorKey: 'warehouse_name', size: 130 }, { id: 'affairs', header: 'Affaires', size: 220, cell: ({ row }) => <HAffairTags items={row.original.affair_tags} /> }, { header: inventories ? 'Planifié le' : 'Date', cell: ({ row }) => displayDate(inventories ? row.original.planned_date : row.original.document_date), size: 100 }, ...(options.kind === 'OUT' ? [{ id: 'readiness', header: 'Prêt à livrer', size: 115, cell: ({ row }: { row: { original: Operation } }) => row.original.readiness ? <DeliveryReadiness ready={row.original.readiness.ready} required={row.original.readiness.required} unit={row.original.readiness.unit} delivered={row.original.status === 'done'} /> : '—' }] : []), { id: 'state', header: 'État', size: 120, cell: ({ row }) => { const state = operationState(row.original); return <HTag tone={state.tone}>{state.label}</HTag> } }] : [
    { header: 'Numéro', accessorKey: 'number', cell: ({ row }) => row.original.display_number || row.original.number || 'Brouillon', size: 145 },
    { header: 'Date', cell: ({ row }) => displayDate(row.original.document_date), size: 100 },
    { id: 'source_document', header: 'Document d’origine', size: 180, cell: ({ row }) => row.original.source_documents.length ? <span>{row.original.source_documents.map((document, index) => <span key={`${document.href}:${document.number}`}>{index > 0 && ' · '}{document.href ? <Link to={document.href}>{document.number}</Link> : document.number}</span>)}</span> : '—' },
    { header: 'De', accessorKey: 'from_name', size: 210 },
    { header: 'Vers', accessorKey: 'to_name', size: 210 },
    ...(options.kind === 'IN' ? [] : [{ header: 'Opération', cell: ({ row }: { row: { original: Operation } }) => row.original.internal_use ? 'Affectation interne' : row.original.scrap ? 'Mise au rebut' : row.original.dropship ? 'Livraison directe' : operationLabels[row.original.kind], size: 150 }]),
    { header: 'Titre', accessorKey: 'title', size: 220 },
    { id: 'affairs', header: 'Affaires', size: 220, cell: ({ row }) => <HAffairTags items={row.original.affair_tags} /> },
    ...(options.kind === 'OUT' ? [{ id: 'readiness', header: 'Prêt à livrer', size: 115, cell: ({ row }: { row: { original: Operation } }) => row.original.readiness ? <DeliveryReadiness ready={row.original.readiness.ready} required={row.original.readiness.required} unit={row.original.readiness.unit} delivered={row.original.status === 'done'} /> : '—' }] : []),
    { id: 'state', header: 'État', size: 120, cell: ({ row }) => { const state = operationState(row.original); return <HTag tone={state.tone}>{state.label}</HTag> } },
  ]
  const table = (items: Operation[]) => <HDataTable columnSettings={{ id: inventories ? 'inventory.inventories' : `inventory.operations.${options.kind || 'all'}`, defaultHidden: ['reason', 'updated'] }} listSorting={listSorting} columnClasses={{ number: 'h-table-cell-nowrap', Date: 'h-table-cell-nowrap', updated: 'h-table-cell-nowrap' }} resizable columnBorders columns={[...columns, { id: 'reason', header: 'Motif', cell: ({ row }) => row.original.reason || '—' }, { id: 'updated', header: 'Modifiée le', cell: ({ row }) => displayDate(row.original.updated) }]} data={items} columnAlignments={{ state: 'center', readiness: 'center' }} getRowLink={(item) => ({ href: `/inventory/operations/${item.id}`, label: `Ouvrir ${item.display_number || item.number || 'Brouillon'}`, state: { stockListQuery: params.toString(), inventories } })} />
  return <div ref={listRoot} className="contact-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Stock', href: '/inventory/dashboard' }, { label: title }]} /><HPageHeader title={title} description={inventories ? 'Planifiez les comptages annuels ou tournants et contrôlez les écarts.' : selectedTile ? selectedTile.description : 'Réceptions, livraisons et transferts : organisez les mouvements de vos entrepôts.'} actions={access.canWrite && (inventories || selectedTile) && <HButton asChild variant="primary"><Link to={`/inventory/operations/new?kind=${inventories ? 'INV' : options.kind || 'IN'}${options.variant ? `&variant=${options.variant}` : ''}`}><Plus size={14} />{inventories ? 'Nouvel inventaire' : `Créer · ${selectedTile?.label}`}</Link></HButton>} />
    {listMode && <HListPagination pageSize={calendar ? undefined : pageSizeControl} page={options.page} totalPages={query.data?.totalPages} label={inventories ? "Pagination des inventaires" : "Pagination des opérations"} busy={query.isFetching} onPageChange={(nextPage) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(nextPage)); return next })} />}
    {!inventories && <div className="h-list-presentation-toolbar"><span>{listMode ? `${query.data?.totalItems ?? '—'} opérations` : 'Vue d’ensemble'}</span><HViewSwitch label="Présentation des opérations" value={listMode ? 'list' : 'dashboard'} items={[{ value: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard }, { value: 'list', label: 'Liste', icon: List }]} onChange={(view) => setParams((current) => changeOperationView(current, view))} /></div>}
    {!inventories && !listMode && access.canRead && !query.error && <><HSectionHeading title="Choisir une opération" description="Ouvrez l’historique ou créez un mouvement depuis son type." /><OperationTiles forecast={query.data?.forecast} summary={query.data?.summary} canCreate={access.canWrite} /></>}
    {inventories && <div className="stock-view-actions"><HButton size="small" variant={!calendar ? 'primary' : 'ghost'} onClick={() => setParams((p) => { p.delete('view'); return p })}><List size={14} />Liste</HButton><HButton size="small" variant={calendar ? 'primary' : 'ghost'} onClick={() => setParams((p) => { p.set('view', 'calendar'); return p })}><CalendarDays size={14} />Calendrier</HButton></div>}
    {!access.canRead ? <p className="contact-muted">Accès au stock nécessaire.</p> : query.isPending ? <HLoadingIndicator label="Chargement des opérations" /> : query.error ? <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p> : query.data && listMode && <>{calendar ? <HMonthCalendar label="Inventaires planifiés" events={query.data.items.filter((item) => item.planned_date && item.status !== 'cancelled').map((item) => ({ id: item.id, date: item.planned_date, label: item.number, detail: `${item.title || 'Inventaire'} · ${item.warehouse_name}`, href: `/inventory/operations/${item.id}` }))} /> : options.group ? <GroupedResults icon={ClipboardList} noun="opérations" groups={groupResults(query.data.items, (item) => operationGroup(item, options.group || ''))} render={table} /> : table(query.data.items)}<p className="stock-table-footer contact-muted">{query.data.totalItems} {inventories ? 'inventaires' : 'opérations'}</p></>}
  </div>
}
