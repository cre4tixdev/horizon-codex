import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router'
import { Landmark, ShoppingCart } from 'lucide-react'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HButton } from '../../../shared/ui/HButton'
import { HTag } from '../../../shared/ui/HTag'
import { HRegisterTable } from '../../../shared/ui/HRegisterTable'
import { formatAmount } from '../../../shared/formatters/money'
import { fixedAssetsService } from '../services/FixedAssetsService'
import { useFixedAssetsAccess } from '../hooks/useFixedAssetsAccess'
import { fixedAssetStates } from '../schemas/fixedAssets'
export function FixedAssetsPage() {
  const [params] = useSearchParams(), navigate = useNavigate(), access = useFixedAssetsAccess()
  const query = useQuery({ queryKey: ['accounting', 'assets', access.accessKey, params.toString()], queryFn: () => fixedAssetsService.list({ q: params.get('q') || '', status: params.get('status') || '', sort: params.get('sort') || '', page: Number(params.get('page')) || 1 }), enabled: access.canRead, retry: false })
  if (!access.canRead) return <p className="contact-muted">Accès aux immobilisations nécessaire.</p>
  return <div className="contact-directory"><HPageBreadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Immobilisations' }]} /><HPageHeader title="Immobilisations" description="Qualification des achats immobilisables et liaison au parc interne. La comptabilité et les amortissements restent suivis dans Sage." actions={access.canPurchase && <HButton onClick={() => navigate('/purchasing/orders/new?purpose=asset')}><ShoppingCart size={14} />Acheter une immobilisation</HButton>} /><HRegisterTable data={query.data} pending={query.isPending} busy={query.isFetching} error={query.error} onRetry={() => void query.refetch()} icon={Landmark} alignments={{ cost: 'right' }} rowLink={(asset) => ({ href: `/accounting/assets/${asset.id}`, label: `Ouvrir ${asset.number}`, state: { assetListQuery: params.toString() } })} grouping={params.get('group') === 'status' ? (asset) => ({ key: asset.status, label: fixedAssetStates[asset.status] }) : undefined} columns={[
    { header: 'Numéro du parc', accessorKey: 'number', size: 150 }, { header: 'Immobilisation', accessorKey: 'name', size: 230 }, { header: 'Référence', accessorKey: 'reference', size: 130 }, { header: 'Série', accessorKey: 'serial_number', size: 140 }, { header: 'Qualification', cell: ({ row }) => <HTag tone={row.original.status === 'draft' ? 'violet' : row.original.status === 'registered' ? 'green' : 'navy'}>{fixedAssetStates[row.original.status]}</HTag>, size: 125 }, { id: 'cost', header: 'Acquisition HT', cell: ({ row }) => formatAmount(row.original.acquisition_cost, row.original.currency), size: 140 }, { header: 'Mise en service', accessorKey: 'in_service_date', size: 125 }, { header: 'Référence comptable', accessorKey: 'accounting_reference', size: 155 },
  ]} /></div>
}
