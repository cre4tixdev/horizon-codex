import { sortResults } from '../../shared/search/listPresentation'
import type { Employee } from './schemas/employees'

const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true })
export function sortEmployeeResults<T extends Pick<Employee, 'last_name' | 'first_name' | 'professional_email' | 'job_title'>>(items: readonly T[], sort: string): T[] {
  const [field, direction] = sort.split(':')
  if (field !== 'name') return sortResults(items, sort, (item) => field === 'email' ? item.professional_email : item.job_title)
  return [...items].sort((left, right) => (collator.compare(left.last_name, right.last_name) || collator.compare(left.first_name, right.first_name)) * (direction === 'desc' ? -1 : 1))
}
