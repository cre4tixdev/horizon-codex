import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HInput } from '../../../shared/ui/HInput'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { catalogService } from '../services/CatalogService'
export function KitSettings() {
  const query = useQuery({ queryKey: ['inventory', 'kit-settings'], queryFn: catalogService.kitSettings, retry: false })
  if (query.error) return <p role="alert" className="field-error">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>
  return query.data ? <KitSettingsForm key={query.data.updated} record={query.data} /> : <HLoadingIndicator label="Chargement des paramètres des kits" />
}
function KitSettingsForm({ record }: { record: { prefix: string; updated: string } }) {
  const [prefix, setPrefix] = useState(record.prefix), client = useQueryClient()
  const save = useMutation({ mutationFn: () => catalogService.saveKitSettings({ prefix, updated: record.updated }), onSuccess: (saved) => client.setQueryData(['inventory', 'kit-settings'], saved) })
  return <form className="contact-panel" onSubmit={(event) => { event.preventDefault(); save.mutate() }}><HSectionHeading title="Kits" description="Préfixe proposé pour les nouvelles références. Les références existantes ne sont pas renommées." actions={<HSaveButton hasChanges={prefix !== record.prefix} pending={save.isPending}>Enregistrer</HSaveButton>} /><div className="contact-fields"><label>Préfixe des kits<HInput aria-label="Préfixe des kits" required maxLength={20} pattern="[A-Z0-9][A-Z0-9_-]{0,19}" value={prefix} onChange={(event) => setPrefix(event.target.value.toUpperCase())} /></label></div><p className="contact-muted">Exemple : {prefix}SALLE-REUNION</p>{save.error && <p role="alert" className="field-error">{save.error.message}</p>}</form>
}
