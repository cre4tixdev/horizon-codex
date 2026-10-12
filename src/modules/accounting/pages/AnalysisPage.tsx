import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router'
import { ChartBar, ChevronLeft, ChevronRight, Building2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HButton } from '../../../shared/ui/HButton'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HTag } from '../../../shared/ui/HTag'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { formatAmount } from '../../../shared/formatters/money'
import { useAnalysisAccess } from '../hooks/useAnalysisAccess'
import { analysisService } from '../services/AnalysisService'
import { AffairAnalysis } from '../components/AffairAnalysis'
import type { Analysis } from '../schemas/analysis'
export function AnalysisPage() {
  const access = useAnalysisAccess(), { id } = useParams(), [params, setParams] = useSearchParams()
  const filters = { q: params.get('q') || '', status: params.get('status') || '', page: params.get('page') || '1', sort: params.get('sort') || 'code', group: params.get('group') || 'none' }
  const query = useQuery({ queryKey: ['analysis', access.accessKey, 'list', filters], queryFn: () => analysisService.list(filters), enabled: access.canRead && !id, retry: false })
  if (!access.canRead) return <HEmptyState icon={ChartBar} title="Analyse des affaires" description="Vous ne disposez pas du droit de consulter les analyses." />
  if (id) return <div className="contact-record"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Analyse des affaires', href: '/analysis' }, { label: 'Analyse' }]} /><HPageHeader title="Analyse de l’affaire" /><AffairAnalysis opportunity={id} /></div>
  const financial = query.data?.items.some((item) => item.capabilities.financial)
  const columns: ColumnDef<Analysis>[] = [
    { id: 'affair', header: 'Affaire', cell: ({ row }) => <Link to={`/analysis/${row.original.root.opportunity}`}><HTag tone="navy">{row.original.root.code}</HTag> {row.original.root.label}</Link> },
    { id: 'client', header: 'Client', accessorFn: (item) => item.root.client },
    { id: 'orders', header: 'Commandes', accessorFn: (item) => item.accounts.filter((account) => account.quote && account.confirmed).length },
    { id: 'delivery', header: 'Lignes livrées', cell: ({ row }) => `${row.original.totals.delivered_lines} / ${row.original.totals.item_lines}` },
    ...(financial ? [{ id: 'revenue', header: 'Commandé HT', cell: ({ row }) => formatAmount(row.original.totals.financial!.revenue, row.original.currency) }, { id: 'margin', header: 'Marge prévue HT', cell: ({ row }) => formatAmount(row.original.totals.financial!.planned_margin, row.original.currency) }] satisfies ColumnDef<Analysis>[] : []),
  ]
  const table = (items: Analysis[]) => <HDataTable data={items} columns={columns} columnBorders columnAlignments={{ orders: 'center', delivery: 'center', revenue: 'right', margin: 'right' }} />
  return <section className="affair-analysis-list"><HPageHeader title="Analyse des affaires" description="Affaires et commandes consolidées selon vos droits d’accès." />
    {query.error ? <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p> : !query.data ? <HLoadingIndicator label="Chargement des affaires" /> : <>{filters.group === 'client' ? <GroupedResults icon={Building2} noun="affaire(s)" groups={groupResults(query.data.items, (item) => ({ key: item.root.client, label: item.root.client }))} render={table} /> : table(query.data.items)}{!query.data.items.length && <p className="contact-muted">Aucune affaire dans ce périmètre.</p>}<nav className="record-navigator" aria-label="Pages des analyses"><span>{query.data.totalItems} affaires · Page {query.data.page} / {query.data.totalPages}</span>{([-1, 1] as const).map((delta) => <HButton key={delta} size="icon" variant="ghost" aria-label={delta < 0 ? 'Page précédente' : 'Page suivante'} disabled={delta < 0 ? query.data!.page <= 1 : query.data!.page >= query.data!.totalPages} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(query.data!.page + delta)); return next })}>{delta < 0 ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}</HButton>)}</nav></>}
  </section>
}
