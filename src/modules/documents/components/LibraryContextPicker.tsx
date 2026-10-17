import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import { useLibraryAccess, useLibraryContext } from '../hooks/useLibrary'
import { libraryService } from '../services/LibraryService'
export function LibraryContextPicker({ space, value, onChange }: { space: 'affairs' | 'customers' | 'suppliers'; value: string; onChange: (id: string) => void }) {
  const access = useLibraryAccess(), [search, setSearch] = useState(''), settled = useDebouncedValue(search)
  const entity = space === 'affairs' ? 'crm_opportunities' : 'contacts_companies', label = space === 'affairs' ? 'Affaire' : space === 'customers' ? 'Client' : 'Fournisseur'
  const selected = useLibraryContext(entity, value)
  const results = useQuery({ queryKey: ['ged', 'context-search', access.key, entity, settled], queryFn: ({ signal }) => libraryService.search(entity, settled, signal), enabled: access.canRead, staleTime: 60_000, retry: false })
  const options = [...(selected.data ? [{ value: selected.data.id, label: selected.data.label }] : []), ...(results.data || []).filter((r) => r.value !== selected.data?.id)]
  return <section className="contact-panel ged-context"><HSectionHeading title={label} description="Choisissez le dossier métier à consulter. Seuls ses documents seront chargés." /><div><HCombobox label={`${label} documentaire`} value={value} options={options} required showCodes={false} emptyLabel={`Rechercher ${space === 'affairs' ? 'une affaire' : 'un ' + label.toLowerCase()}…`} onSearchChange={setSearch} onChange={onChange} /><small className="contact-muted">Les 20 premiers résultats accessibles sont proposés. Tapez un nom ou un numéro pour affiner.</small>{results.isFetching && <small role="status" className="contact-muted">Recherche…</small>}{(selected.error || results.error) && <p className="field-error" role="alert">{selected.error?.message || results.error?.message}</p>}</div></section>
}
