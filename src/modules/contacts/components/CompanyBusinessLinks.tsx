import { useQuery } from '@tanstack/react-query'
import { crmService } from '../../crm'
import { useCrmAccess } from '../../crm/hooks/useCrm'
import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HRecordLinks } from '../../../shared/ui/HRecordLinks'
import { companyShortcuts } from '../companyShortcuts'
import type { Company } from '../types/contacts'

export function CompanyBusinessLinks({ company, person = false, busy = false }: { company: Company; person?: boolean; busy?: boolean }) {
  const roles = company.expand?.contacts_company_roles_via_company?.filter((role) => role.active).map((role) => role.role) ?? []
  const { canRead } = useCrmAccess()
  const opportunities = useQuery({ queryKey: ['crm', 'company-opportunities', company.id], queryFn: () => crmService.list({ search: '', page: 1, archived: false, status: 'open', company: company.id, owner: '', sort: '-created' }), enabled: canRead && roles.includes('customer'), retry: false })
  const items = companyShortcuts(roles).map((item) => item.id === 'opportunities' && canRead ? { ...item, count: opportunities.data?.totalItems, href: `/crm?company=${company.id}&status=open`, description: opportunities.error ? 'Compteur CRM indisponible' : 'Opportunités ouvertes de cette société' } : item)
  return <HBreadcrumbActions placement="related"><HRecordLinks items={items} busy={busy} label={person ? 'Objets métier de la société associée' : 'Objets métier de la société'} /></HBreadcrumbActions>
}
