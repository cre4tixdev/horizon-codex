import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { HCombobox, type ComboboxOption } from '../../../shared/ui/HCombobox'
import { HButton } from '../../../shared/ui/HButton'
import { libraryService } from '../services/LibraryService'
import { useLibraryAccess } from '../hooks/useLibrary'
export function LibraryReaders({ value, onChange, initial = [], disabled = false }: { value: string[]; onChange: (value: string[]) => void; initial?: ComboboxOption[]; disabled?: boolean }) {
  const [search, setSearch] = useState(''), [chosen, setChosen] = useState<ComboboxOption[]>(initial), access = useLibraryAccess()
  const users = useQuery({ queryKey: ['ged', 'users', access.key, search], queryFn: () => libraryService.search('users', search), retry: false })
  return <div><HCombobox label="Ajouter un utilisateur autorisé" value="" showCodes={false} options={(users.data || []).filter((u) => !value.includes(u.value))} onSearchChange={setSearch} onChange={(id) => { const item = users.data?.find((u) => u.value === id); if (item) { setChosen((v) => [...v, item]); onChange([...value, id]) } }} disabled={disabled} />
    {users.error && <p role="alert" className="field-error">{users.error.message}</p>}
    <div className="ged-reader-list">{value.map((id) => <span key={id} className="contact-role-pill">{chosen.find((u) => u.value === id)?.label || users.data?.find((u) => u.value === id)?.label || 'Utilisateur autorisé'}<HButton variant="ghost" size="icon" disabled={disabled} aria-label={`Retirer ${chosen.find((u) => u.value === id)?.label || 'cet utilisateur'}`} onClick={() => onChange(value.filter((v) => v !== id))}><X size={12} /></HButton></span>)}</div><small className="contact-muted">L’auteur conserve l’accès. Les restrictions du dossier et des fiches liées restent applicables.</small>
  </div>
}
