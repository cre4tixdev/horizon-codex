import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, Truck } from 'lucide-react'
import { HRecordLinks, type RecordLink } from '../../../shared/ui/HRecordLinks'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { useSalesAccess } from '../../sales/hooks/useSalesAccess'
import { useStockAccess } from '../../inventory/hooks/useStockAccess'
import { billingService } from '../services/BillingService'
import type { Bill } from '../schemas/billing'
export function BillSourceLinks({ record }: { record: Bill }) {
  const sales = useSalesAccess(), stock = useStockAccess(), [section, setSection] = useState<'orders' | 'deliveries' | ''>(''), query = useQuery({ queryKey: ['billing', 'related-records', record.kind, record.id, record.updated], queryFn: () => billingService.related(record.kind, record.id), retry: false })
  const items: RecordLink[] = ([['orders', 'Commandes clients', ShoppingBag, sales.canRead], ['deliveries', 'Bons de livraison', Truck, stock.canRead]] as const).filter(([, , , allowed]) => allowed).map(([key, label, icon]) => {
    const rows = query.data?.[key]
    return { id: key, label, icon, count: rows?.length, description: `Consulter les ${label.toLowerCase()} associés`, ...(rows?.length === 1 ? { href: rows[0]!.href } : rows?.length ? { onSelect: () => setSection(key) } : {}) }
  })
  return <>{query.error && <p role="alert" className="field-error">{query.error.message}</p>}<HBreadcrumbActions placement="related"><HRecordLinks label="Pièces associées à la facture" items={items} busy={query.isFetching} /></HBreadcrumbActions>{section && <HDialog open description="Sélectionnez une pièce pour ouvrir sa fiche." title={section === 'orders' ? 'Commandes clients associées' : 'Bons de livraison associés'} onOpenChange={(open) => { if (!open) setSection('') }}><HDataTable columnBorders data={query.data?.[section] || []} columns={[{ header: 'Numéro', accessorKey: 'label' }, { header: 'Référence / état', accessorKey: 'reference' }]} getRowLink={(row) => ({ href: row.href, label: `Ouvrir ${row.label}` })} /></HDialog>}</>
}
