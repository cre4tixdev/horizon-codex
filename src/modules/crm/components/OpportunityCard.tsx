import { HTag } from '../../../shared/ui/HTag'
import type { Reference } from '../../settings/types/references'
import { Link } from 'react-router'
import { OpportunityCompanyLogo, OpportunityResponsible } from './OpportunityIdentity'
import { formatAmount, type Opportunity } from '../schemas/opportunities'
export function OpportunityCard({ record, pending, listQuery, markets }: { record: Opportunity; pending: boolean; listQuery: string; markets: Reference[] }) {
  return <article data-opportunity-id={record.id} className={`crm-opportunity-card${pending ? ' crm-opportunity-card--pending' : ''}`}>
    <div className="crm-card-body"><div className="crm-card-content">
      <div className="crm-card-heading"><small>#{record.opportunity_number}</small><span aria-hidden="true">–</span><span className="crm-card-company" title={record.expand?.company?.name}>{record.expand?.company?.name || 'Société'}</span></div>
      <Link className="crm-card-title" to={`/crm/opportunities/${record.id}`} state={{ crmListQuery: listQuery }} title={record.title}>{record.title}</Link>
      <strong className="crm-card-amount">{formatAmount(record.estimated_value, record.currency)}</strong>
    </div><div className="crm-card-identities"><OpportunityResponsible record={record} /><OpportunityCompanyLogo record={record} /></div></div>
    <div className="crm-card-footer"><div className="crm-card-markets" title={record.market_types.map((id) => markets.find((market) => market.id === id)?.label || 'Référence indisponible').join(', ')}>{record.market_types.slice(0, 2).map((id) => { const market = markets.find((item) => item.id === id); return <HTag key={id} color={market?.color} tone={market?.tone || 'blue'}>{market?.label || 'Référence indisponible'}</HTag> })}{record.market_types.length > 2 && <span className="crm-card-market-more">+{record.market_types.length - 2}</span>}</div><span className="crm-card-probability" title="Probabilité de gain">{record.probability} %</span></div>
  </article>
}
