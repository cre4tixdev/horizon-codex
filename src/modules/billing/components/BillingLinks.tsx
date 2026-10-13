import { useQuery } from '@tanstack/react-query'
import { ReceiptText } from 'lucide-react'
import { HRecordLinks } from '../../../shared/ui/HRecordLinks'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { useBillingAccess } from '../hooks/useBillingAccess'
import { billingService } from '../services/BillingService'
export function BillingLinks({ kind, sourceOrder, inline = false }: { kind: 'customer' | 'supplier'; sourceOrder: string; inline?: boolean }) {
  const access = useBillingAccess()
  const query = useQuery({ queryKey: ['billing', 'related', kind, sourceOrder], queryFn: () => billingService.list({ kind, source_order: sourceOrder }), enabled: access.canRead, retry: false })
  if (!access.canRead) return null
  const links = <HRecordLinks label="Factures liées à la commande" busy={query.isFetching} items={[{ id: 'invoices', label: kind === 'customer' ? 'Factures clients' : 'Fact. fournisseurs', icon: ReceiptText, count: query.data?.totalItems, href: `/billing/${kind}?source_order=${sourceOrder}`, description: 'Consulter les factures liées' }]} />
  return <>{query.error && <p role="alert" className="field-error">{query.error.message}</p>}{inline ? <div className="h-record-inline-links">{links}</div> : <HBreadcrumbActions placement="related">{links}</HBreadcrumbActions>}</>
}
