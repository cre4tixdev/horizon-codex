import { HBreadcrumbActions } from '../../../shared/ui/HBreadcrumbActions'
import { HRecordLinks } from '../../../shared/ui/HRecordLinks'
import { companyShortcuts } from '../companyShortcuts'
import type { Company } from '../types/contacts'

export function CompanyBusinessLinks({ company, person = false, busy = false }: { company: Company; person?: boolean; busy?: boolean }) {
  const roles = company.expand?.contacts_company_roles_via_company?.filter((role) => role.active).map((role) => role.role) ?? []
  return <HBreadcrumbActions placement="related"><HRecordLinks items={companyShortcuts(roles)} busy={busy} label={person ? 'Objets métier de la société associée' : 'Objets métier de la société'} /></HBreadcrumbActions>
}
