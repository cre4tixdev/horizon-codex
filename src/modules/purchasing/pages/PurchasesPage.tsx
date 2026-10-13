import { HAffairTags } from '../../../shared/ui/HAffairTags'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Building2, Plus, ShoppingCart, ShoppingCartPlus, FilePenLine, FileCheck, Mail, PackageCheck, ClipboardCheck, Clock3 } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HButton } from '../../../shared/ui/HButton'
import { HSummaryCards } from '../../../shared/ui/HSummaryCards'
import { HTag } from '../../../shared/ui/HTag'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { formatAmount } from '../../../shared/formatters/money'
import { displayDate } from '../../../shared/time/zonedDate'
import { purchasingService } from '../services/PurchasingService'
import { usePurchasingAccess } from '../hooks/usePurchasingAccess'
import { purchaseLabels, purchaseTones, type PurchaseListItem, type PurchaseKind, type PurchaseListOptions } from '../schemas/purchasing'
export function PurchasesPage() {
  const { kind: routeKind } = useParams(), kind: PurchaseKind = routeKind === 'orders' ? 'orders' : 'requests', overview = !routeKind, access = usePurchasingAccess(), [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const filters: PurchaseListOptions = { q: params.get('q') || '', status: params.get('status') || '', supplier: params.get('supplier') || '', opportunity: params.get('opportunity') || '', product: params.get('product') || '', source_order: params.get('source_order') || '', source_line: params.get('source_line') || '', request_line: params.get('request_line') || '', request: params.get('request') || '', order: params.get('order') || '', sort: params.get('sort') || '-created', group: params.get('group') || '', page }
  const query = useQuery({ queryKey: ['purchasing', overview ? 'overview' : kind, params.toString()], queryFn: () => overview ? purchasingService.overview(filters) : purchasingService.list(kind, filters).then((data) => ({ ...data, items: data.items.map((item) => ({ ...item, kind })) })), enabled: access.canRead, retry: false })
  const columns: ColumnDef<PurchaseListItem>[] = [
    ...(overview ? [{ id: 'kind', header: 'Pièce', cell: ({ row }: { row: { original: PurchaseListItem } }) => <HTag tone={row.original.kind === 'requests' ? 'violet' : 'blue'}>{row.original.kind === 'requests' ? 'DA' : 'BC'}</HTag> }] : []),
    { header: 'Numéro', accessorKey: 'number' }, { header: overview ? 'Pièce d’achat' : kind === 'requests' ? 'Demande d’achat' : 'Commande fournisseur', accessorKey: 'title' }, { header: 'Fournisseur', accessorKey: 'supplier_name' }, { header: 'Affaires', cell: ({ row }) => <HAffairTags items={row.original.lines.flatMap((line) => line.allocations)} /> }, { header: kind === 'orders' ? 'Émission' : 'Date', cell: ({ row }) => displayDate(row.original.document_date) }, { header: kind === 'orders' ? 'Réception souhaitée' : 'Date souhaitée', cell: ({ row }) => displayDate(row.original.needed_date) }, { header: 'Montant HT', cell: ({ row }) => formatAmount(row.original.kind === 'orders' ? row.original.subtotal : row.original.lines.reduce((total, line) => total + line.line_total, 0), row.original.currency) }, { header: 'État', cell: ({ row }) => <HTag tone={row.original.archived_at ? 'navy' : purchaseTones[row.original.status]}>{row.original.archived_at ? 'Archivée' : purchaseLabels[row.original.status]}</HTag> },
  ]
  if (!access.canRead) return <HEmptyState icon={kind === 'requests' ? ShoppingCartPlus : ShoppingCart} title="Achats" description="Vous ne disposez pas de l’accès aux achats." />
  const table = (items: PurchaseListItem[]) => <HDataTable columnBorders columnAlignments={{ kind: 'center', Émission: 'center', Date: 'center', 'Réception souhaitée': 'center', 'Date souhaitée': 'center', 'Montant HT': 'right', État: 'center' }} data={items} columns={columns} getRowLink={(item) => ({ href: `/purchasing/${item.kind}/${item.id}`, label: `Ouvrir ${item.number}`, state: { purchaseListQuery: params.toString(), purchaseListPath: overview ? '/purchasing' : `/purchasing/${kind}` } })} />
  return <div className="contact-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Achats', ...(overview ? {} : { href: '/purchasing' }) }, ...(!overview ? [{ label: kind === 'orders' ? 'Commandes fournisseurs' : 'Demandes d’achat' }] : [])]} />
    <HPageHeader title={overview ? 'Achats' : kind === 'orders' ? 'Commandes fournisseurs' : 'Demandes d’achat'} description={overview ? 'Demandes d’achat et bons de commande fournisseurs, réunis dans l’ordre de création.' : kind === 'orders' ? 'Vos commandes par fournisseur et par affaire.' : 'Vos besoins d’approvisionnement, manuels ou issus des commandes client.'} actions={access.canWrite && <>{kind === 'requests' && <HButton asChild><Link to={`/purchasing/requests/new${filters.opportunity ? `?opportunity=${filters.opportunity}` : ''}`} state={{ purchaseListQuery: params.toString(), purchaseListPath: overview ? '/purchasing' : `/purchasing/${kind}` }}><Plus size={14} />Nouvelle demande</Link></HButton>}<HButton asChild variant="primary"><Link to={`/purchasing/orders/new${filters.opportunity ? `?opportunity=${filters.opportunity}` : ''}`} state={{ purchaseListQuery: params.toString(), purchaseListPath: overview ? '/purchasing' : `/purchasing/${kind}` }}><Plus size={14} />Nouvelle commande</Link></HButton></>} />
    <HListPagination page={page} totalPages={query.data?.totalPages} label="Pagination des achats" busy={query.isFetching} onPageChange={(nextPage) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(nextPage)); return next })} />
    <HSummaryCards label={overview ? 'Synthèse des achats' : kind === 'orders' ? 'Synthèse des commandes fournisseurs' : 'Synthèse des demandes d’achat'} items={(overview ? [
      { key: 'requests', icon: ShoppingCartPlus }, { key: 'draft', icon: FilePenLine }, { key: 'validated', icon: FileCheck }, { key: 'orders', icon: ShoppingCart },
    ] as const : kind === 'orders' ? [
      { key: 'draft', icon: FilePenLine }, { key: 'validated', icon: FileCheck }, { key: 'sent', icon: Mail }, { key: 'received', icon: PackageCheck },
    ] as const : [
      { key: 'pending', icon: ClipboardCheck }, { key: 'draft', icon: FilePenLine }, { key: 'validated', icon: FileCheck }, { key: 'partially_ordered', icon: Clock3 },
    ] as const).map(({ key, icon }) => {
      const next = new URLSearchParams(params); next.set('status', key); next.delete('page')
      const label = key === 'requests' ? 'DA en attente' : key === 'orders' ? 'Bons de commande' : key === 'pending' ? 'En attente' : purchaseLabels[key] || key
      const summary = query.data?.summary
      const count = summary ? key === 'pending' ? ['draft', 'validated', 'partially_ordered'].reduce((total, state) => total + (summary[state] || 0), 0) : summary[key] || 0 : undefined
      return { label, icon, tone: key === 'requests' ? 'violet' : key === 'orders' ? 'green' : key === 'pending' ? 'amber' : purchaseTones[key], count, detail: 'Non archivées', accessibleLabel: `Filtrer les achats : ${label}`, href: `${overview ? '/purchasing' : `/purchasing/${kind}`}?${next}` }
    })} error={undefined} onRetry={() => { void query.refetch() }} />
    {query.isPending && <HLoadingIndicator label="Chargement des achats" />}{query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.data && <><p className="contact-muted">{query.data.totalItems} {overview ? 'pièce(s)' : kind === 'orders' ? 'commande(s)' : 'demande(s)'}</p>{filters.group === 'supplier_name' ? <GroupedResults groups={groupResults(query.data.items, (item) => ({ key: item.supplier_name, label: item.supplier_name || 'Plusieurs fournisseurs' }))} icon={Building2} noun={overview ? 'pièces' : kind === 'orders' ? 'commandes' : 'demandes'} render={table} /> : table(query.data.items)}{!query.data.totalItems && <HEmptyState icon={kind === 'requests' ? ShoppingCartPlus : ShoppingCart} title="Aucune pièce d’achat" description={kind === 'orders' ? 'Créez une commande fournisseur ou validez une demande d’achat.' : 'Créez une demande manuelle ou préparez les besoins depuis une commande client.'} />}</>}
  </div>
}
