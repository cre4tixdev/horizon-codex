import { useSearchParams, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Package, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { formatUnitAmount as formatAmount } from '../../../shared/formatters/money'
import { catalogService } from '../services/CatalogService'
import { useCatalogAccess } from '../hooks/useCatalogAccess'
import { type Product } from '../schemas/catalog'
import '../catalog.css'
export function ProductsPage() {
  const [params, setParams] = useSearchParams(), access = useCatalogAccess()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const query = useQuery({ queryKey: ['inventory', 'products', params.toString()], queryFn: () => catalogService.list({ q: params.get('q') || '', state: params.get('state') || 'active', category: params.get('category') || '', sort: params.get('sort') || 'name', page }), enabled: access.canRead, retry: false })
  const columns: ColumnDef<Product>[] = [
    { header: 'Produit', cell: ({ row }) => <div className="catalog-list-identity">{row.original.image_url ? <img src={row.original.image_url} alt="" /> : <span><Package size={17} /></span>}<strong>{row.original.name}</strong></div> },
    { header: 'Référence', accessorKey: 'sku' }, { header: 'Marque', accessorKey: 'manufacturer' }, { header: 'Famille', accessorKey: 'category_label' },
    { header: 'Coût / u.', cell: ({ row }) => formatAmount(row.original.pricing.unit_cost, row.original.sale_currency) },
    { header: 'PUV HT', cell: ({ row }) => row.original.pricing.unit_price === null ? <span title={row.original.pricing.warning}>Tarif à vérifier</span> : formatAmount(row.original.pricing.unit_price, row.original.sale_currency) },
    { header: 'Unité', accessorKey: 'unit_code' },
  ]
  if (!access.canRead) return <HEmptyState icon={Package} title="Catalogue" description="Vous ne disposez pas de la permission de consulter les produits." />
  const table = (items: Product[]) => <HDataTable data={items} columns={columns} getRowLink={(item) => ({ href: `/inventory/products/${item.id}`, label: `Ouvrir ${item.name}`, state: { productListQuery: params.toString() } })} />
  const groups = query.data && params.get('group') === 'category' ? groupResults(query.data.items, (item) => ({ key: item.category, label: item.category_label })) : undefined
  return <div className="contact-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Catalogue' }]} /><HPageHeader title="Produits" description="Catalogue, prix de vente et fournisseurs." actions={access.canWrite && <HButton asChild variant="primary"><Link to="/inventory/products/new" state={{ productListQuery: params.toString() }}><Plus size={14} />Nouveau produit</Link></HButton>} />
    <HBreadcrumbActions><nav className="record-navigator" aria-label="Pagination des produits"><span className="record-navigator-count">Page {page} / {Math.max(1, query.data?.totalPages || 1)}</span><HButton variant="ghost" size="icon" aria-label="Page précédente" disabled={page <= 1 || query.isFetching} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(page - 1)); return next })}><ChevronLeft size={15} /></HButton><HButton variant="ghost" size="icon" aria-label="Page suivante" disabled={!query.data || page >= query.data.totalPages || query.isFetching} onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(page + 1)); return next })}><ChevronRight size={15} /></HButton></nav></HBreadcrumbActions>
    {query.isPending && <HLoadingIndicator label="Chargement des produits" />}{query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.data && <><p className="contact-muted">{query.data.totalItems} produit{query.data.totalItems > 1 ? 's' : ''}</p>{groups ? <GroupedResults groups={groups} icon={Package} noun="produits" render={table} /> : table(query.data.items)}{!query.data.totalItems && <HEmptyState icon={Package} title="Aucun produit" description="Créez votre premier produit ou adaptez les critères de recherche." />}</>}
  </div>
}
