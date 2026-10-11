import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, ShoppingCartPlus } from 'lucide-react'
import { HRecordLinks } from '../../../shared/ui/HRecordLinks'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { purchasingService } from '../services/PurchasingService'
import { usePurchasingAccess } from '../hooks/usePurchasingAccess'
export function PurchaseLinks({ sourceOrder = '', product = '', opportunity = '', inline = false, busy = false }: { sourceOrder?: string; product?: string; opportunity?: string; inline?: boolean; busy?: boolean }) {
  const access = usePurchasingAccess(), filters = { q: '', status: '', supplier: '', opportunity, product, source_order: sourceOrder, source_line: '', sort: '-created', group: '', page: 1 }
  const requests = useQuery({ queryKey: ['purchasing', 'links', 'requests', filters], queryFn: () => purchasingService.list('requests', filters), enabled: access.canRead, retry: false })
  const orders = useQuery({ queryKey: ['purchasing', 'links', 'orders', filters], queryFn: () => purchasingService.list('orders', filters), enabled: access.canRead, retry: false })
  if (!access.canRead) return null
  const params = new URLSearchParams(); if (sourceOrder) params.set('source_order', sourceOrder); if (product) params.set('product', product); if (opportunity) params.set('opportunity', opportunity)
  const links = <HRecordLinks label="Achats liés" busy={busy} items={[{ id: 'purchase-requests', label: 'Demandes', icon: ShoppingCartPlus, count: requests.data?.totalItems, href: `/purchasing/requests?${params}`, description: requests.error?.message || 'Consulter les demandes d’achat liées' }, { id: 'purchase-orders', label: 'Achats', icon: ShoppingCart, count: orders.data?.totalItems, href: `/purchasing/orders?${params}`, description: orders.error?.message || 'Consulter les commandes fournisseur liées' }]} />
  return inline ? links : <HBreadcrumbActions placement="related">{links}</HBreadcrumbActions>
}
