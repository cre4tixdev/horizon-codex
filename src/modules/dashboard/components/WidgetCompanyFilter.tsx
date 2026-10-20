import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { useState, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { contactsService } from '../../contacts/services/ContactsService'
import type { WidgetDataSpec } from '../schemas/widgetData'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
export function CompanyFilter({ data, onChange }: { data: WidgetDataSpec; onChange: (data: WidgetDataSpec) => void }) {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const allowed = session.status === 'authenticated' && hasPermission(session.user, 'contacts.read')
  const [search, setSearch] = useState(''), q = useDebouncedValue(search, 250)
  const query = useQuery({ queryKey: ['dashboard', 'company-picker', session.status === 'authenticated' ? session.user.id : '', q], queryFn: () => contactsService.companies({ search: q, archived: false, page: 1, perPage: 20 }), enabled: allowed && q.trim().length >= 2, staleTime: 60_000, retry: false })
  const options = [{ value: '', label: 'Toutes les sociétés' }, ...(data.company ? [{ value: data.company, label: data.companyLabel || 'Société sélectionnée' }] : []), ...(query.data?.items || []).filter((company) => company.id !== data.company).map((company) => ({ value: company.id, label: company.name }))]
  return <><HCombobox label="Société du widget" disabled={!allowed} value={data.company} options={options} showCodes={false} emptyLabel="Toutes les sociétés" onSearchChange={setSearch} onChange={(company) => onChange({ ...data, company, companyLabel: options.find((item) => item.value === company)?.label || '' })} />{query.error && <small className="field-error" role="alert">{query.error.message}</small>}<small className="contact-muted">{allowed ? 'Saisissez au moins deux caractères pour rechercher.' : 'Accès Contacts nécessaire pour choisir une société.'}</small></>
}
