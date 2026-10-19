import { useListPageSize } from '../../../shared/hooks/useListPageSize'
import { keepPreviousListData } from '../../../shared/search/keepPreviousListData'
import { useListTableSorting } from '../../../shared/search/useListTableSorting'
import { useEffect } from 'react'
import { normalizeSalesFilters } from '../searchFilters'
import { QuoteSummary } from '../components/QuoteSummary'
import { useSearchParams, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Building2, FileText, Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HListPagination } from '../../../shared/ui/HListPagination'
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
import { quoteStatusTones, quoteStatusLabels, type Quote } from '../schemas/quotes'
const orderLabels: Record<string, string> = { confirmed: 'Confirmée', in_progress: 'En cours', completed: 'Terminée' }
export function QuotesPage() {
  const listSorting = useListTableSorting('-created', {"kind": "kind", "quote_number": "quote_number", "title": "title", "Opportunité": "opportunity", "company_name": "company_name", "date": "quote_date", "amount": "subtotal", "status": "status", "customer_order_number": "customer_order_number"})
  const [params, setParams] = useSearchParams()
  const access = useSalesAccess()
  useEffect(() => { const canonical = normalizeSalesFilters(params); if (canonical.toString() !== params.toString()) setParams(canonical, { replace: true }) }, [params, setParams])
  const selected = normalizeSalesFilters(params), kind = selected.get('kind') || '', orders = kind === 'order', quotes = kind === 'quote'
  const title = orders ? 'Commandes clients' : quotes ? 'Devis' : 'Ventes', noun = orders ? 'commandes clients' : quotes ? 'devis' : 'pièces'
  const page = Math.max(1, Number(params.get('page')) || 1), opportunity = params.get('opportunity') || ''
  const { onMount: listRoot, perPage, control: pageSizeControl } = useListPageSize('list', true)
  const query = useQuery({ queryKey: ['sales', 'quotes', kind || 'quote,order', params.toString(), perPage], queryFn: () => salesService.list({ q: params.get('q') || '', product: params.get('product') || '', opportunity, company: params.get('company') || '', kind: kind || 'quote,order', state: selected.get('state') || 'active', status: selected.get('status') || '', order_status: selected.get('order_status') || '', customer_number: selected.get('customer_number') || '', sort: params.get('sort') || '-created', page, perPage: perPage }), enabled: access.canRead, retry: false, placeholderData: keepPreviousListData(['sales', 'quotes', kind || 'quote,order']) })
  const columns: ColumnDef<Quote>[] = [
    { header: 'Numéro', accessorKey: 'quote_number' }, { id: 'title', header: orders ? 'Commande' : quotes ? 'Devis' : 'Pièce', accessorKey: 'title' }, { header: 'Opportunité', cell: ({ row }) => `${row.original.opportunity_number} · ${row.original.opportunity_name}` }, { header: 'Société', accessorKey: 'company_name' }, { id: 'date', header: 'Date', cell: ({ row }) => displayDate(row.original.quote_date) }, { id: 'amount', header: 'Montant HT', cell: ({ row }) => formatAmount(row.original.subtotal, row.original.currency) }, { id: 'status', header: 'État', cell: ({ row }) => <HTag tone={row.original.archived_at ? 'navy' : quoteStatusTones[row.original.status]}>{row.original.archived_at ? 'Archivé · ' : ''}{row.original.status === 'accepted' ? orderLabels[row.original.order?.status || ''] || 'Commande client' : quoteStatusLabels[row.original.status]}</HTag> },
    { accessorKey: 'owner_name', header: 'Responsable', cell: ({ row }) => row.original.owner_name || '—' },
    { accessorKey: 'currency', header: 'Devise', cell: ({ row }) => row.original.currency || '—' },
    { id: 'valid_until', header: 'Validité', cell: ({ row }) => displayDate(row.original.valid_until) },
  ]
  if (!orders && !quotes) columns.unshift({ id: 'kind', header: 'Type', cell: ({ row }) => <HTag tone={row.original.status === 'accepted' ? 'green' : 'blue'}>{row.original.status === 'accepted' ? 'Commande client' : 'Devis'}</HTag> })
  if (!quotes) columns.push({ id: 'customer_order_number', header: 'N° commande client', cell: ({ row }) => row.original.status !== 'accepted' ? '—' : <HTag tone={!row.original.order?.customer_number || row.original.order.customer_number.toLowerCase() === 'attente commande' ? 'amber' : 'green'} color={!row.original.order?.customer_number || row.original.order.customer_number.toLowerCase() === 'attente commande' ? '#DC2626' : undefined}>{row.original.order?.customer_number || 'Attente Commande'}</HTag> })
  if (!access.canRead) return <HEmptyState icon={FileText} title={title} description={`Vous ne disposez pas de la permission de consulter les ${noun}.`} />
  const group = params.get('group')
  const groupKey = (item: Quote) => {
    if (group === 'status') return item.status === 'accepted' ? { key: `order-${item.order?.status}`, label: orderLabels[item.order?.status || ''] || 'Commande client' } : { key: item.status, label: quoteStatusLabels[item.status] }
    if (group === 'customer_number') return item.status !== 'accepted' ? { key: 'quote', label: 'Devis' } : { key: item.order?.customer_number?.toLowerCase() || 'attente commande', label: item.order?.customer_number || 'Attente Commande' }
    return { key: item.company, label: item.company_name }
  }
  const table = (items: Quote[]) => <HDataTable columnSettings={{ id: `sales.${kind || 'all'}`, required: ['quote_number'], defaultHidden: ['owner_name', 'currency', 'valid_until'] }} listSorting={listSorting} columnBorders columnAlignments={{ date: 'center', amount: 'right', status: 'center' }} data={items} columns={columns} getRowLink={(quote) => ({ href: `/sales/quotes/${quote.id}`, label: `Ouvrir ${quote.status === 'accepted' ? 'la commande' : 'le devis'} ${quote.quote_number}`, state: { quoteListQuery: params.toString() } })} />
  return <div ref={listRoot} className="contact-directory" aria-busy={query.isFetching}><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: title }]} /><HPageHeader title={title} description={orders ? 'Vos commandes client, rattachées aux affaires et à leur compte analytique.' : quotes ? 'Vos devis, rattachés aux opportunités et à leur compte analytique.' : 'Vos devis et commandes clients, rattachés aux affaires.'} actions={access.canWrite && access.canReadCrm && <HButton asChild variant="primary"><Link to={`/sales/quotes/new${opportunity ? `?opportunity=${opportunity}` : ''}`} state={{ quoteListQuery: params.toString() }}><Plus size={14} />Nouveau devis</Link></HButton>} />
    <HListPagination pageSize={pageSizeControl} page={page} totalPages={query.data?.totalPages} label={`Pagination des ${noun}`} busy={query.isFetching} onPageChange={(nextPage) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(nextPage)); return next })} />
    <QuoteSummary />
    {opportunity && <p className="contact-muted"><Link to={`/crm/opportunities/${opportunity}`}>Retour à l’opportunité</Link> · <Link to={orders ? "/sales/quotes?kind=order" : quotes ? "/sales/quotes?kind=quote" : "/sales/quotes"}>Tous les {noun}</Link></p>}
    {query.isPending && <HLoadingIndicator label={`Chargement des ${noun}`} />}{query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.data && <><p className="contact-muted">{query.data.totalItems} {noun}</p>{['company', 'status', 'customer_number'].includes(group || '') ? <GroupedResults groups={groupResults(query.data.items, groupKey)} icon={Building2} noun={noun} render={table} /> : table(query.data.items)}{query.data.totalItems === 0 && <HEmptyState icon={FileText} title={orders ? 'Aucune commande' : quotes ? 'Aucun devis' : 'Aucune pièce'} description={orders ? 'Les devis confirmés apparaîtront ici.' : 'Créez un devis en choisissant son opportunité de rattachement.'} />}</>}
  </div>
}
