import { useQuery } from '@tanstack/react-query'
import { PackageCheck, Truck, ArrowLeftRight } from 'lucide-react'
import { HRecordLinks } from '../../../shared/ui/HRecordLinks'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { operationsService } from '../services/OperationsService'
import { useStockAccess } from '../hooks/useStockAccess'
export function StockOperationLinks({ purchaseOrder = '', salesQuote = '', product = '', inline = false }: { purchaseOrder?: string; salesQuote?: string; product?: string; inline?: boolean }) {
  const access = useStockAccess(), query = { ...(purchaseOrder ? { kind: 'IN' } : {}), purchase_order: purchaseOrder, sales_quote: salesQuote, product }
  const records = useQuery({ queryKey: ['inventory', 'operation-links', query], queryFn: () => operationsService.list(query), enabled: access.canRead, retry: false })
  if (!access.canRead) return null
  const params = new URLSearchParams(); if (purchaseOrder) { params.set('purchase_order', purchaseOrder); params.set('kind', 'IN') }; if (salesQuote) params.set('sales_quote', salesQuote); if (product) params.set('product', product)
  const links = <HRecordLinks label="Opérations de stock liées" items={[{ id: 'stock-operations', label: purchaseOrder ? 'Réceptions' : salesQuote ? 'Livraisons' : 'Mouvements', icon: purchaseOrder ? PackageCheck : salesQuote ? Truck : ArrowLeftRight, count: records.data?.totalItems, href: `/inventory/operations?${params}`, description: records.error?.message || 'Consulter les opérations liées à cette pièce' }]} />
  return inline ? links : <HBreadcrumbActions placement="related">{links}</HBreadcrumbActions>
}
