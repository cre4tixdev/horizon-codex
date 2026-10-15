import { useListTableSorting } from '../../../shared/search/useListTableSorting'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router'
import { Boxes, ShoppingCart, PackageMinus } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HButton } from '../../../shared/ui/HButton'
import { HTag } from '../../../shared/ui/HTag'
import { HRegisterTable } from '../../../shared/ui/HRegisterTable'
import { internalAssetsService } from '../services/InternalAssetsService'
import { internalAssetStates } from '../schemas/internalAssets'
import { useStockAccess } from '../hooks/useStockAccess'
export function InternalAssetsPage() {
  const listSorting = useListTableSorting('-created', {"number": "number", "name": "name", "brand": "brand", "reference": "reference", "Lot / Série": "trace", "État": "status", "assigned_name": "assigned_name", "warehouse_name": "warehouse_name", "location_name": "location_name"})
  const [params] = useSearchParams(), navigate = useNavigate(), access = useStockAccess()
  const query = useQuery({ queryKey: ['inventory', 'assets', access.accessKey, params.toString()], queryFn: () => internalAssetsService.list({ q: params.get('q') || '', status: params.get('status') || '', sort: params.get('sort') || '', warehouse: params.get('warehouse') || '', product: params.get('product') || '', page: Number(params.get('page')) || 1 }), enabled: access.canRead, retry: false })
  if (!access.canRead) return <p className="contact-muted">Accès au stock nécessaire.</p>
  return <div className="contact-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Stock', href: '/inventory/dashboard' }, { label: 'Parc interne' }]} /><HPageHeader title="Parc interne" description="Matériel CVS, affectations et provenance. Ce matériel est distinct du stock vendable." actions={<>{access.canPurchase && <HButton onClick={() => navigate('/purchasing/orders/new?purpose=internal')}><ShoppingCart size={14} />Acheter du matériel</HButton>}{access.canWrite && <HButton onClick={() => navigate('/inventory/operations/new?kind=OUT&purpose=internal')}><PackageMinus size={14} />Affecter du stock</HButton>}</>} /><HRegisterTable listSorting={listSorting} data={query.data} pending={query.isPending} busy={query.isFetching} error={query.error} onRetry={() => void query.refetch()} icon={Boxes} rowLink={(asset) => ({ href: `/inventory/assets/${asset.id}`, label: `Ouvrir ${asset.number}`, state: { assetListQuery: params.toString() } })} grouping={params.get('group') === 'status' ? (asset) => ({ key: asset.status, label: internalAssetStates[asset.status] }) : params.get('group') === 'warehouse' ? (asset) => ({ key: asset.warehouse, label: asset.warehouse_name }) : undefined} columns={[
    { header: 'Numéro', accessorKey: 'number', size: 150 }, { header: 'Matériel', accessorKey: 'name', size: 240 }, { header: 'Marque', accessorKey: 'brand', size: 115 }, { header: 'Référence', accessorKey: 'reference', size: 130 }, { header: 'Lot / Série', cell: ({ row }) => row.original.serial_number || row.original.lot_number || '—', size: 135 }, { header: 'État', cell: ({ row }) => <HTag tone={row.original.status === 'assigned' ? 'blue' : row.original.status === 'repair' ? 'amber' : row.original.active ? 'green' : 'navy'}>{internalAssetStates[row.original.status]}</HTag>, size: 120 }, { header: 'Affectation', accessorKey: 'assigned_name', size: 155 }, { header: 'Entrepôt', accessorKey: 'warehouse_name', size: 135 }, { header: 'Emplacement', accessorKey: 'location_name', size: 130 },
  ]} /></div>
}
