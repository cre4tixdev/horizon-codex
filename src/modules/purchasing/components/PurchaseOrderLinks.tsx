import { StockOperationLinks } from '../../inventory/components/StockOperationLinks'
import { ClipboardList, ReceiptText } from 'lucide-react'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HRecordLinks } from '../../../shared/ui/HRecordLinks'
import type { Purchase } from '../schemas/purchasing'

export function PurchaseOrderLinks({ order, busy, inline = false }: { order: Purchase; busy: boolean; inline?: boolean }) {
  const links = <HRecordLinks label="Pièces liées à la commande fournisseur" busy={busy} items={[
    { id: 'requests', label: 'Demandes', icon: ClipboardList, count: order.source_requests_count, href: `/purchasing/requests?order=${order.id}`, description: 'Consulter les demandes d’achat liées' },
    { id: 'invoices', label: 'Fact. fournisseurs', icon: ReceiptText, description: 'Factures fournisseurs : à venir' },
  ]} />
  return inline ? <div className="h-record-inline-links"><StockOperationLinks purchaseOrder={order.id} inline />{links}</div> : <><StockOperationLinks purchaseOrder={order.id} /><HBreadcrumbActions placement="related">{links}</HBreadcrumbActions></>
}
