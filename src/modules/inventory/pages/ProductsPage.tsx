import { useSearchParams, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Package, Plus, LayoutGrid, List, Monitor, Cable, Wrench } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { HSummaryCards } from '../../../shared/ui/HSummaryCards'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { GroupedResults } from '../../../shared/search/GroupedResults'
import { groupResults } from '../../../shared/search/listPresentation'
import { formatUnitAmount as formatAmount } from '../../../shared/formatters/money'
import { catalogService } from '../services/CatalogService'
import { useCatalogAccess } from '../hooks/useCatalogAccess'
import { ProductCards } from '../components/ProductCards'
import { type Product } from '../schemas/catalog'
import '../catalog.css'
const quantities = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 })
const categoryPresentation: Record<string, { icon: typeof Package; tone: 'blue' | 'amber' | 'violet' }> = {
  equipment: { icon: Monitor, tone: 'blue' },
  supplies: { icon: Cable, tone: 'amber' },
  services: { icon: Wrench, tone: 'violet' },
}
export function ProductsPage() {
  const [params, setParams] = useSearchParams(), access = useCatalogAccess()
  const view = params.get('view') === 'cards' ? 'cards' : 'list'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const query = useQuery({ queryKey: ['inventory', 'products', params.toString()], queryFn: () => catalogService.list({ q: params.get('q') || '', state: params.get('state') || 'active', category: params.get('category') || '', sort: params.get('sort') || 'name', page }), enabled: access.canRead, retry: false })
  const columns: ColumnDef<Product>[] = [
    { header: 'Produit', cell: ({ row }) => <div className="catalog-list-identity">{row.original.image_url ? <img src={row.original.image_url} alt="" /> : <span><Package size={17} /></span>}<strong>{row.original.name}</strong></div> },
    { header: 'Référence', accessorKey: 'sku' }, { header: 'Marque', accessorKey: 'manufacturer' }, { header: 'Famille', accessorKey: 'category_label' },
    { header: 'Coût / u.', cell: ({ row }) => formatAmount(row.original.pricing.unit_cost, row.original.sale_currency) },
    { header: 'PUV HT', cell: ({ row }) => row.original.pricing.unit_price === null ? <span title={row.original.pricing.warning}>Tarif à vérifier</span> : formatAmount(row.original.pricing.unit_price, row.original.sale_currency) },
    { id: 'stock', header: 'Qté en stock', cell: ({ row }) => <span title={row.original.stock_policy === 'none' ? 'Sans gestion de stock' : 'Stock physique, tous les emplacements actifs'}>{row.original.physical_quantity === null ? '—' : `${quantities.format(row.original.physical_quantity)} ${row.original.unit_code}`}</span> },
    { id: 'available', header: 'Qté disponible', cell: ({ row }) => <span title={row.original.stock_policy === 'none' ? 'Sans gestion de stock' : 'Stock disponible après réservations, tous les emplacements actifs'}>{row.original.available_quantity === null ? '—' : `${quantities.format(row.original.available_quantity)} ${row.original.unit_code}`}</span> },
  ]
  if (!access.canRead) return <HEmptyState icon={Package} title="Catalogue" description="Vous ne disposez pas de la permission de consulter les produits." />
  const table = (items: Product[]) => <HDataTable columnAlignments={{ stock: 'right', available: 'right' }} data={items} columns={columns} getRowLink={(item) => ({ href: `/inventory/products/${item.id}`, label: `Ouvrir ${item.name}`, state: { productListQuery: params.toString() } })} />
  const results = (items: Product[]) => view === 'cards' ? <ProductCards items={items} listQuery={params.toString()} /> : table(items)
  const groups = query.data && ['category', 'manufacturer'].includes(params.get('group') || '') ? groupResults(query.data.items, (item) => params.get('group') === 'manufacturer' ? { key: item.manufacturer || 'none', label: item.manufacturer || 'Sans marque' } : { key: item.category, label: item.category_label }) : undefined
  return <div className="contact-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Catalogue' }]} /><HPageHeader title="Produits" description="Catalogue, prix de vente et fournisseurs." actions={access.canWrite && <HButton asChild variant="primary"><Link to="/inventory/products/new" state={{ productListQuery: params.toString() }}><Plus size={14} />Nouveau produit</Link></HButton>} />
    <HListPagination page={page} totalPages={query.data?.totalPages} label="Pagination des produits" busy={query.isFetching} onPageChange={(nextPage) => setParams((current) => { const next = new URLSearchParams(current); next.set('page', String(nextPage)); return next })} />
    {query.data && <HSummaryCards label="Catégories de produits" items={query.data.categories.map((category) => {
      const next = new URLSearchParams(params); next.set('category', category.id); next.set('view', view); next.delete('page')
      return { label: category.label, ...(categoryPresentation[category.code] || { icon: Package, tone: 'blue' as const }), count: category.count, detail: params.get('state') === 'archived' ? 'Archivés' : 'Actifs', accessibleLabel: `Filtrer les produits : ${category.label}`, href: `/inventory?${next}` }
    })} error={undefined} onRetry={() => { void query.refetch() }} />}
    {query.isPending && <HLoadingIndicator label="Chargement des produits" />}{query.error && <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.data && <><div className="contact-toolbar"><span className="contact-result-count">{query.data.totalItems} produit{query.data.totalItems > 1 ? 's' : ''}</span><div className="contact-view-switch" role="group" aria-label="Présentation des produits">{[{ value: 'cards', label: 'Vue cartes', icon: LayoutGrid }, { value: 'list', label: 'Vue liste', icon: List }].map(({ value, label, icon: Icon }) => <HButton key={value} aria-label={label} aria-pressed={view === value} size="small" variant="ghost" onClick={() => setParams((current) => { const next = new URLSearchParams(current); next.set('view', value); return next }, { replace: true })}><Icon size={15} /><span>{value === 'cards' ? 'Cartes' : 'Liste'}</span></HButton>)}</div></div>{groups ? <GroupedResults groups={groups} icon={Package} noun="produits" render={results} /> : results(query.data.items)}{!query.data.totalItems && <HEmptyState icon={Package} title="Aucun produit" description="Créez votre premier produit ou adaptez les critères de recherche." />}</>}
  </div>
}
