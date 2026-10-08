import { useQuery } from '@tanstack/react-query'
import { FileText, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { salesService, useSalesAccess } from '../../sales'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HRecordLinks } from '../../../shared/ui/HRecordLinks'
import { HButton } from '../../../shared/ui/HButton'
import { formatAmount } from '../../../shared/formatters/money'
export function OpportunityBusinessLinks({ id, active, dirty, busy }: { id: string; active: boolean; dirty: boolean; busy: boolean }) {
  const access = useSalesAccess()
  const query = useQuery({ queryKey: ['sales', 'related', id], queryFn: () => salesService.related(id), enabled: access.canRead, retry: false, refetchOnMount: 'always' })
  if (!access.canRead) return null
  return <>
    <HBreadcrumbActions placement="related"><HRecordLinks busy={busy || dirty} label="Documents de l’opportunité" items={[{ id: 'quotes', label: 'Devis', icon: FileText, count: query.data?.quoteCount, href: query.data?.singleQuoteId ? `/sales/quotes/${query.data.singleQuoteId}` : `/sales/quotes?opportunity=${id}`, description: 'Tous les devis de cette opportunité, y compris les devis annulés' }]} />{active && access.canWrite && (dirty || busy ? <HButton size="small" disabled title="Enregistrez la fiche avant de créer un devis"><Plus size={13} />Nouveau devis</HButton> : <HButton asChild size="small"><Link to={`/sales/quotes/new?opportunity=${id}`}><Plus size={13} />Nouveau devis</Link></HButton>)}</HBreadcrumbActions>
    {query.data && <div className="crm-sales-revenue"><span>Revenu prévisionnel HT</span><strong>{query.data.revenue.length ? query.data.revenue.map((item) => formatAmount(item.amount, item.currency)).join(' · ') : '0,00 €'}</strong></div>}
    {query.error && <p role="alert" className="field-error">{query.error.message}<HButton size="small" onClick={() => void query.refetch()}>Réessayer</HButton></p>}
  </>
}
