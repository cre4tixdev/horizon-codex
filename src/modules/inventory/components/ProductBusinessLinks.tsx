import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { FileText, ShoppingCart, Store, Truck, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HRecordLinks } from '../../../shared/ui/HRecordLinks'
import { HDialog } from '../../../shared/ui/HDialog'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HTag } from '../../../shared/ui/HTag'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { formatAmount } from '../../../shared/formatters/money'
import { catalogService } from '../services/CatalogService'
import { useCatalogAccess } from '../hooks/useCatalogAccess'
import type { ProductQuote } from '../schemas/catalog'

const states: Record<string, string> = { draft: 'Brouillon', validated: 'Validé', sent: 'Envoyé', accepted: 'Accepté', rejected: 'Refusé', cancelled: 'Annulé' }
const columns: ColumnDef<ProductQuote>[] = [
  { header: 'Devis', accessorKey: 'quote_number' },
  { header: 'Date', cell: ({ row }) => row.original.quote_date.slice(0, 10).split('-').reverse().join('/') || '—' },
  { header: 'Client', cell: ({ row }) => row.original.company_name || '—' },
  { header: 'Code analytique', cell: ({ row }) => row.original.opportunity ? <Link className="catalog-history-link" to={`/crm/opportunities/${row.original.opportunity}`}>{row.original.analytic_code}<small>{row.original.analytic_label}</small></Link> : '—' },
  { header: 'Quantité', cell: ({ row }) => <>{row.original.quantity.toLocaleString('fr-FR')} {row.original.unit}{row.original.option_quantity > 0 && <small className="catalog-option-quantity">+ {row.original.option_quantity.toLocaleString('fr-FR')} en option</small>}</> },
  { header: 'Lignes HT', cell: ({ row }) => formatAmount(row.original.subtotal, row.original.currency) },
  { header: 'État', cell: ({ row }) => <HTag tone={row.original.status === 'accepted' ? 'green' : ['cancelled', 'rejected'].includes(row.original.status) ? 'navy' : 'blue'}>{states[row.original.status] || row.original.status}</HTag> },
]

export function ProductBusinessLinks({ id, name, inline, busy }: { id: string; name: string; inline: boolean; busy: boolean }) {
  const access = useCatalogAccess(), [open, setOpen] = useState(false), [page, setPage] = useState(1)
  const history = useQuery({ queryKey: ['inventory', 'product-quotes', id, page], queryFn: () => catalogService.productQuotes(id, page), enabled: access.canReadSales, retry: false })
  const links = <HRecordLinks label="Documents et stock du produit" busy={busy} items={[
    { id: 'quotes', label: 'Devis', icon: FileText, count: history.data?.totalItems, description: history.error ? history.error.message : access.canReadSales ? 'Historique des devis contenant ce produit, y compris options et devis annulés' : 'Accès Ventes nécessaire', onSelect: () => { setPage(1); setOpen(true); void history.refetch() } },
    { id: 'purchases', label: 'Achats', icon: ShoppingCart, description: 'Historique des commandes fournisseur · à venir' },
    { id: 'sales', label: 'Ventes', icon: Store, description: 'Historique des commandes client · à venir' },
    { id: 'deliveries', label: 'Livraisons', icon: Truck, description: 'Historique des livraisons · à venir' },
    { id: 'stock', label: 'Stock', icon: Package, description: 'Stock physique, réservé, disponible et entrant par entrepôt · à venir' },
  ]} />
  return <>{inline ? <div className="catalog-inline-links">{links}</div> : <HBreadcrumbActions placement="related">{links}</HBreadcrumbActions>}{history.error && <p role="alert" className="field-error">{history.error.message}<HButton size="small" onClick={() => { void history.refetch() }}>Réessayer</HButton></p>}
    {open && <HDialog open title={`Devis · ${name}`} description="Montants des lignes de ce produit avant remise globale, hors options. Les brouillons et devis annulés restent visibles ; ces quantités ne représentent pas des ventes réalisées." className="catalog-product-history" onOpenChange={setOpen}>
      <div className="catalog-product-history-body">{history.isPending ? <HLoadingIndicator label="Chargement des devis" /> : history.data?.items.length ? <HDataTable data={history.data.items} columns={columns} getRowLink={(item) => ({ href: `/sales/quotes/${item.id}`, label: `Ouvrir le devis ${item.quote_number}` })} /> : !history.error ? <HEmptyState icon={FileText} title="Aucun devis" description="Ce produit n’apparaît dans aucun devis enregistré." /> : null}
        {history.error && <p role="alert" className="field-error">{history.error.message}</p>}
        {history.data && <div className="catalog-history-pagination"><small>{history.data.totalItems} devis</small>{history.data.totalPages > 1 && <><HButton variant="ghost" size="icon" aria-label="Page précédente des devis" disabled={page <= 1 || history.isFetching} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></HButton><span>{page} / {history.data.totalPages}</span><HButton variant="ghost" size="icon" aria-label="Page suivante des devis" disabled={page >= history.data.totalPages || history.isFetching} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></HButton></>}</div>}
      </div>
    </HDialog>}
  </>
}
