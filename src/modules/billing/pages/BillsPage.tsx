import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router'
import { Wallet, Plus, FilePenLine, FileCheck, Clock3, Building2 } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { HSummaryCards } from '../../../shared/ui/HSummaryCards'
import { HTag } from '../../../shared/ui/HTag'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { formatAmount } from '../../../shared/formatters/money'
import { displayDate } from '../../../shared/time/zonedDate'
import { billingService } from '../services/BillingService'
import { useBillingAccess } from '../hooks/useBillingAccess'
import { billLabels, kindSchema, states, type Bill } from '../schemas/billing'
export function BillsPage() {
  const route = useParams(), [params, setParams] = useSearchParams(), access = useBillingAccess(), credits = !route.kind, kind = credits ? params.get('direction') === 'supplier' ? 'supplier_credit' : 'customer_credit' : kindSchema.parse(route.kind), page = Math.max(1, Number(params.get('page')) || 1)
  const query = useQuery({ queryKey: ['billing', 'list', kind, params.toString()], queryFn: () => billingService.list({ kind, page, ...Object.fromEntries(params) }), enabled: access.canRead, retry: false })
  if (!access.canRead) return <HEmptyState icon={Wallet} title="Facturation" description="Vous ne disposez pas de l’accès à la facturation." />
  const table = (items: Bill[]) => <HDataTable columnBorders columnAlignments={{ TTC: 'right', Solde: 'right', État: 'center' }} data={items} columns={[{ header: 'Numéro', cell: ({ row }) => row.original.number || 'Brouillon' }, { header: 'Tiers', accessorKey: 'company_name' }, { header: 'Référence / objet', cell: ({ row }) => row.original.supplier_invoice_number || row.original.title }, { header: 'Date', cell: ({ row }) => displayDate(row.original.invoice_date) }, { header: 'Échéance', cell: ({ row }) => displayDate(row.original.due_date) }, { header: 'TTC', cell: ({ row }) => formatAmount(row.original.total, row.original.currency) }, { header: 'Solde', cell: ({ row }) => formatAmount(row.original.balance, row.original.currency) }, { header: 'État', cell: ({ row }) => <HTag tone={row.original.status === 'validated' ? 'green' : row.original.status === 'draft' ? 'violet' : 'navy'}>{states[row.original.status]}{row.original.overdue ? ' · En retard' : ''}</HTag> }]} getRowLink={(item) => ({ href: `/billing/${item.kind}/${item.id}`, label: `Ouvrir ${item.number || item.title}`, state: { billingListPath: credits ? '/billing/credits' : `/billing/${kind}`, billingListQuery: params.toString() } })} />
  return <div className="contact-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Facturation', href: kind.startsWith('supplier') ? '/billing?direction=supplier' : '/billing' }, { label: credits ? 'Avoirs' : billLabels[kind] }]} /><HPageHeader title={credits ? 'Avoirs' : billLabels[kind]} actions={access.canWrite && !kind.endsWith('_credit') && <HButton variant="primary" asChild><Link to={`/billing/${kind}/new`}><Plus size={14} />{kind === 'customer' ? 'Nouvelle facture client' : 'Enregistrer une facture fournisseur'}</Link></HButton>} />
    {credits && <HRecordTabs label="Direction des avoirs" idPrefix="credit-direction" value={kind.startsWith('supplier') ? 'supplier' : 'customer'} items={[{ value: 'customer', label: 'Clients', icon: Wallet, panel: 'credit-customer' }, { value: 'supplier', label: 'Fournisseurs', icon: Wallet, panel: 'credit-supplier' }]} onChange={(direction) => setParams((current) => { const next = new URLSearchParams(current); next.set('direction', direction); next.delete('page'); return next })} />}
    <HListPagination page={page} totalPages={query.data?.totalPages} busy={query.isFetching} label="Pagination des factures" onPageChange={(value) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(value)); return next })} />
    <HSummaryCards label="Synthèse des factures" error={undefined} onRetry={() => void query.refetch()} items={[{ key: 'draft', icon: FilePenLine }, { key: 'validated', icon: FileCheck }, { key: 'unpaid', icon: Wallet }, { key: 'overdue', icon: Clock3 }].map(({ key, icon }) => { const next = new URLSearchParams(params); next.set('status', key); next.delete('page'); return { label: states[key as keyof typeof states], icon, tone: key === 'overdue' ? 'amber' : key === 'validated' ? 'green' : 'violet', count: query.data?.summary[key], detail: ['unpaid', 'overdue'].includes(key) ? 'Soldes ouverts, archives incluses' : 'Pièces non archivées', href: `${credits ? '/billing/credits' : `/billing/${kind}`}?${next}` } })} />
    {query.isPending && <HLoadingIndicator label="Chargement des factures" />}{query.error && <p className="field-error" role="alert">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.data && <>{params.get('group') && params.get('group') !== 'none' ? <GroupedResults icon={Building2} noun="pièces" groups={groupResults(query.data.items, (record) => ({ key: params.get('group') === 'status' ? record.status : record.company, label: params.get('group') === 'status' ? states[record.status] : record.company_name }))} render={table} /> : table(query.data.items)}<p className="contact-muted">{query.data.totalItems} pièce(s)</p></>}
  </div>
}
