import { useQuery } from '@tanstack/react-query'
import { FileText, Store, Truck, Package } from 'lucide-react'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HRecordLinks } from '../../../shared/ui/HRecordLinks'
import { PurchaseLinks } from '../../purchasing/components/PurchaseLinks'
import { catalogService } from '../services/CatalogService'
import { salesService } from '../../sales/services/SalesService'
import { operationsService } from '../services/OperationsService'
import { stockService } from '../services/StockService'
import { useCatalogAccess } from '../hooks/useCatalogAccess'
export function ProductBusinessLinks({ id, name, inline, busy }: { id: string; name: string; inline: boolean; busy: boolean }) {
  const access = useCatalogAccess()
  const history = useQuery({ queryKey: ['inventory', 'product-quotes', id, 1], queryFn: () => catalogService.productQuotes(id, 1), enabled: access.canReadSales, retry: false })
  const sales = useQuery({ queryKey: ['sales', 'product-orders', id], queryFn: () => salesService.list({ product: id, status: 'accepted', q: '', opportunity: '', company: '', sort: 'quote_number', page: 1 }), enabled: access.canReadSales, retry: false })
  const stock = useQuery({ queryKey: ['inventory', 'product-stock', id], queryFn: () => stockService.list({ q: '', product: id, location: '', sort: '', group: '', page: 1 }), enabled: access.canRead, retry: false })
  const deliveries = useQuery({ queryKey: ['inventory', 'product-deliveries', id], queryFn: () => operationsService.list({ product: id, kind: 'OUT' }), enabled: access.canRead, retry: false })
  const links = <HRecordLinks label="Documents et stock du produit" busy={busy} items={[
    { id: 'quotes', label: 'Devis', icon: FileText, count: history.data?.totalItems, href: `/sales/quotes?product=${id}`, description: history.error?.message || 'Consulter les devis contenant ce produit' },
    { id: 'sales', label: 'Ventes', icon: Store, count: sales.data?.totalItems, href: `/sales/quotes?product=${id}&status=accepted`, description: sales.error?.message || `Commandes client contenant ${name}` },
    { id: 'deliveries', label: 'Livraisons', icon: Truck, count: deliveries.data?.totalItems, href: `/inventory/operations?product=${id}&kind=OUT`, description: deliveries.error?.message || 'Consulter les livraisons du produit' },
    { id: 'stock', label: 'Stock', icon: Package, count: stock.data?.items.reduce((sum, item) => sum + item.physical, 0), href: `/inventory/stock?product=${id}`, description: stock.error?.message || 'Stock physique, réservé et disponible par emplacement' },
  ]} />
  return <>{inline ? <div className="catalog-inline-links">{links}<PurchaseLinks product={id} inline busy={busy} /></div> : <><HBreadcrumbActions placement="related">{links}</HBreadcrumbActions><PurchaseLinks product={id} busy={busy} /></>}{[history.error, sales.error, stock.error, deliveries.error].filter(Boolean).map((error, index) => <p key={index} role="alert" className="field-error">{error!.message}</p>)}</>
}
