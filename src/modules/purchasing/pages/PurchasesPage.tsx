import { HAffairTags } from '../../../shared/ui/HAffairTags'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useSearchParams } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'
import { Building2, ChevronLeft, ChevronRight, Plus, ShoppingCart, ShoppingCartPlus, FilePenLine, FileCheck, Mail, PackageCheck, ClipboardCheck, Clock3 } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HButton } from '../../../shared/ui/HButton'
import { HSummaryCards } from '../../../shared/ui/HSummaryCards'
import { HTag } from '../../../shared/ui/HTag'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { formatAmount } from '../../../shared/formatters/money'
import { displayDate } from '../../../shared/time/zonedDate'
import { purchasingService } from '../services/PurchasingService'
import { usePurchasingAccess } from '../hooks/usePurchasingAccess'
import { purchaseLabels, purchaseTones, type Purchase, type PurchaseListOptions } from '../schemas/purchasing'
export function PurchasesPage() {
  const { kind: routeKind } = useParams(), kind = routeKind === 'orders' ? 'orders' : 'requests', access = usePurchasingAccess(), [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const filters: PurchaseListOptions = { q: params.get('q') || '', status: params.get('status') || '', supplier: params.get('supplier') || '', opportunity: params.get('opportunity') || '', product: params.get('product') || '', source_order: params.get('source_order') || '', source_line: params.get('source_line') || '', request_line: params.get('request_line') || '', request: params.get('request') || '', order: params.get('order') || '', sort: params.get('sort') || '-created', group: params.get('group') || '', page }
  const query = useQuery({ queryKey: ['purchasing', kind, params.toString()], queryFn: () => purchasingService.list(kind, filters), enabled: access.canRead, retry: false })
  const columns: ColumnDef<Purchase>[] = [
    { header: 'Numéro', accessorKey: 'number' }, { header: kind === 'requests' ? 'Demande d’achat' : 'Commande fournisseur', accessorKey: 'title' }, { header: 'Fournisseur', accessorKey: 'supplier_name' }, { header: 'Affaires', cell: ({ row }) => <HAffairTags items={row.original.lines.flatMap((line) => line.allocations)} /> }, { header: kind === 'orders' ? 'Émission' : 'Date', cell: ({ row }) => displayDate(row.original.document_date) }, { header: kind === 'orders' ? 'Réception souhaitée' : 'Date souhaitée', cell: ({ row }) => displayDate(row.original.needed_date) }, { header: 'Montant HT', cell: ({ row }) => formatAmount(kind === 'orders' ? row.original.subtotal : row.original.lines.reduce((total, line) => total + line.line_total, 0), row.original.currency) }, { header: 'État', cell: ({ row }) => <HTag tone={row.original.archived_at ? 'navy' : purchaseTones[row.original.status]}>{row.original.archived_at ? 'Archivée' : purchaseLabels[row.original.status]}</HTag> },
  ]
  if (!access.canRead) return <HEmptyState icon={kind === 'requests' ? ShoppingCartPlus : ShoppingCart} title="Achats" description="Vous ne disposez pas de l’accès aux achats." />
  const table = (items: Purchase[]) => <HDataTable columnBorders columnAlignments={{ Émission: 'center', Date: 'center', 'Réception souhaitée': 'center', 'Date souhaitée': 'center', 'Montant HT': 'right', État: 'center' }} data={items} columns={columns} getRowLink={(item) => ({ href: `/purchasing/${kind}/${item.id}`, label: `Ouvrir ${item.number}`, state: { purchaseListQuery: params.toString() } })} />
  return <div className="contact-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Achats', href: '/purchasing' }, { label: kind === 'orders' ? 'Commandes fournisseurs' : 'Demandes d’achat' }]} />
    <HPageHeader title={kind === 'orders' ? 'Commandes fournisseurs' : 'Demandes d’achat'} description={kind === 'orders' ? 'Vos commandes par fournisseur et par affaire.' : 'Vos besoins d’approvisionnement, manuels ou issus des commandes client.'} actions={access.canWrite && <HButton asChild variant="primary"><Link to={`/purchasing/${kind}/new${filters.opportunity ? `?opportunity=${filters.opportunity}` : ''}`}><Plus size={14} />{kind === 'orders' ? 'Nouvelle commande' : 'Nouvelle demande'}</Link></HButton>} />
    <HBreadcrumbActions><nav className="record-navigator" aria-label="Pagination des achats"><span>Page {page} / {query.data?.totalPages || 1}</span><HButton variant="ghost" size="icon" aria-label="Page précédente" disabled={page <= 1 || query.isFetching} onClick={() => setParams((p) => { p.set('page', String(page - 1)); return p })}><ChevronLeft size={14} /></HButton><HButton variant="ghost" size="icon" aria-label="Page suivante" disabled={!query.data || page >= query.data.totalPages || query.isFetching} onClick={() => setParams((p) => { p.set('page', String(page + 1)); return p })}><ChevronRight size={14} /></HButton></nav></HBreadcrumbActions>
    <HSummaryCards label={kind === 'orders' ? 'Synthèse des commandes fournisseurs' : 'Synthèse des demandes d’achat'} items={(kind === 'orders' ? [
      { key: 'draft', icon: FilePenLine }, { key: 'validated', icon: FileCheck }, { key: 'sent', icon: Mail }, { key: 'received', icon: PackageCheck },
    ] as const : [
      { key: 'draft', icon: FilePenLine }, { key: 'validated', icon: FileCheck }, { key: 'partially_ordered', icon: Clock3 }, { key: 'ordered', icon: ClipboardCheck },
    ] as const).map(({ key, icon }) => {
      const next = new URLSearchParams(params); next.set('status', key); next.delete('page')
      const label = purchaseLabels[key] || key
      return { label, icon, tone: purchaseTones[key], count: query.data ? query.data.summary[key] || 0 : undefined, detail: 'Non archivées', accessibleLabel: `Filtrer les achats : ${label}`, href: `/purchasing/${kind}?${next}` }
    })} error={undefined} onRetry={() => { void query.refetch() }} />
    {query.isPending && <HLoadingIndicator label="Chargement des achats" />}{query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.data && <><p className="contact-muted">{query.data.totalItems} {kind === 'orders' ? 'commande(s)' : 'demande(s)'}</p>{filters.group === 'supplier_name' ? <GroupedResults groups={groupResults(query.data.items, (item) => ({ key: item.supplier_name, label: item.supplier_name || 'Plusieurs fournisseurs' }))} icon={Building2} noun={kind === 'orders' ? 'commandes' : 'demandes'} render={table} /> : table(query.data.items)}{!query.data.totalItems && <HEmptyState icon={kind === 'requests' ? ShoppingCartPlus : ShoppingCart} title="Aucune pièce d’achat" description={kind === 'orders' ? 'Créez une commande fournisseur ou validez une demande d’achat.' : 'Créez une demande manuelle ou préparez les besoins depuis une commande client.'} />}</>}
  </div>
}
