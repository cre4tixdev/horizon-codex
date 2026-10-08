import { useSearchParams, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Building2, ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HTag } from '../../../shared/ui/HTag'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { formatAmount } from '../../../shared/formatters/money'
import { displayDate } from '../../../shared/time/zonedDate'
import { salesService } from '../services/SalesService'
import { useSalesAccess } from '../hooks/useSalesAccess'
import { quoteStatusLabels, type Quote } from '../schemas/quotes'
export function QuotesPage() {
  const [params, setParams] = useSearchParams()
  const access = useSalesAccess()
  const page = Math.max(1, Number(params.get('page')) || 1), opportunity = params.get('opportunity') || ''
  const query = useQuery({ queryKey: ['sales', 'quotes', params.toString()], queryFn: () => salesService.list({ q: params.get('q') || '', opportunity, company: params.get('company') || '', status: params.get('status') || '', sort: params.get('sort') || '-created', page }), enabled: access.canRead, retry: false })
  const columns: ColumnDef<Quote>[] = [
    { header: 'Numéro', accessorKey: 'quote_number' }, { header: 'Devis', accessorKey: 'title' }, { header: 'Opportunité', cell: ({ row }) => `${row.original.opportunity_number} · ${row.original.opportunity_name}` }, { header: 'Société', accessorKey: 'company_name' }, { header: 'Date', cell: ({ row }) => displayDate(row.original.quote_date) }, { header: 'Montant HT', cell: ({ row }) => formatAmount(row.original.subtotal, row.original.currency) }, { header: 'État', cell: ({ row }) => <HTag tone={row.original.status === 'cancelled' || row.original.status === 'rejected' ? 'navy' : row.original.status === 'accepted' ? 'green' : 'blue'}>{quoteStatusLabels[row.original.status]}</HTag> },
  ]
  if (!access.canRead) return <HEmptyState icon={FileText} title="Devis" description="Vous ne disposez pas de la permission de consulter les devis." />
  const table = (items: Quote[]) => <HDataTable data={items} columns={columns} getRowLink={(quote) => ({ href: `/sales/quotes/${quote.id}`, label: `Ouvrir le devis ${quote.quote_number}`, state: { quoteListQuery: params.toString() } })} />
  return <div className="contact-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Devis' }]} /><HPageHeader title="Devis" description="Vos devis, rattachés aux opportunités et à leur compte analytique." actions={access.canWrite && access.canReadCrm && <HButton asChild variant="primary"><Link to={`/sales/quotes/new${opportunity ? `?opportunity=${opportunity}` : ''}`} state={{ quoteListQuery: params.toString() }}><Plus size={14} />Nouveau devis</Link></HButton>} />
    <HBreadcrumbActions><nav className="record-navigator" aria-label="Pagination des devis" aria-busy={query.isFetching}><span className="record-navigator-count" aria-live="polite">Page {page} / {Math.max(1, query.data?.totalPages || 1)}</span><HButton variant="ghost" size="icon" aria-label="Page précédente" title="Page précédente" disabled={page <= 1 || query.isFetching} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(page - 1)); return next })}><ChevronLeft size={15} /></HButton><HButton variant="ghost" size="icon" aria-label="Page suivante" title="Page suivante" disabled={!query.data || page >= query.data.totalPages || query.isFetching} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(page + 1)); return next })}><ChevronRight size={15} /></HButton></nav></HBreadcrumbActions>
    {opportunity && <p className="contact-muted"><Link to={`/crm/opportunities/${opportunity}`}>Retour à l’opportunité</Link> · <Link to="/sales/quotes">Tous les devis</Link></p>}
    {query.isPending && <HLoadingIndicator label="Chargement des devis" />}{query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.data && <><p className="contact-muted">{query.data.totalItems} devis</p>{params.get('group') === 'company' ? <GroupedResults groups={groupResults(query.data.items, (item) => ({ key: item.company, label: item.company_name }))} icon={Building2} noun="devis" render={table} /> : table(query.data.items)}{query.data.totalItems === 0 && <HEmptyState icon={FileText} title="Aucun devis" description="Créez un devis en choisissant son opportunité de rattachement." />}</>}
  </div>
}
