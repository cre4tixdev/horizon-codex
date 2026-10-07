import { ContactAvatar } from '../../contacts'
import type { Opportunity } from '../schemas/opportunities'
export function OpportunityResponsible({ record }: { record: Opportunity }) {
  const name = record.expand?.owner?.name || 'Responsable indisponible'
  return <span className="crm-responsible-avatar" title={`Responsable : ${name}`} aria-label={`Responsable : ${name}`}>{record.expand?.owner?.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?' }</span>
}
export function OpportunityCompanyLogo({ record }: { record: Opportunity }) {
  const company = record.expand?.company
  return <span className="crm-company-logo" title={company?.name || 'Société'} aria-hidden="true"><ContactAvatar kind="company" collectionId={company?.collectionId || ''} id={company?.id || record.company} filename={company?.logo || ''} /></span>
}
export function OpportunityCompany({ record }: { record: Opportunity }) {
  const company = record.expand?.company
  return <span className="crm-company-identity" title={company?.name || 'Société'}><OpportunityCompanyLogo record={record} /><span>{company?.name || 'Société'}</span></span>
}
