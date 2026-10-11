import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HInput } from '../../../shared/ui/HInput'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { purchasingService } from '../services/PurchasingService'
import { usePurchasingAccess } from '../hooks/usePurchasingAccess'
import type { PurchaseSettings } from '../schemas/purchasing'
export function PurchasingSettingsPage() {
  const access = usePurchasingAccess(), query = useQuery({ queryKey: ['purchasing', 'settings'], queryFn: () => purchasingService.settings(), enabled: access.canConfigure && access.canRead, retry: false })
  if (!access.canConfigure || !access.canRead) return <p>Accès aux paramètres Achats nécessaire.</p>
  return query.data ? <Editor key={query.data.updated} initial={query.data} /> : query.error ? <p role="alert" className="field-error">{query.error.message}</p> : <HLoadingIndicator label="Chargement des paramètres achats" />
}
function Editor({ initial }: { initial: PurchaseSettings }) {
  const client = useQueryClient(), [values, setValues] = useState(initial), save = useMutation({ mutationFn: () => purchasingService.saveSettings(values), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['purchasing'] }) } })
  return <section className="settings-section"><HSectionHeading title="Valeurs par défaut" description="Ces valeurs concernent les nouvelles pièces ; les commandes validées conservent leurs données." actions={<HSaveButton form="purchase-settings" hasChanges={JSON.stringify(values) !== JSON.stringify(initial)} pending={save.isPending}>Enregistrer</HSaveButton>} /><form id="purchase-settings" className="contact-fields" onSubmit={(e) => { e.preventDefault(); save.mutate() }}><label><HFieldLabel required>TVA des achats (%)</HFieldLabel><HInput required type="number" min={0} max={100} step="any" value={values.default_tax_rate} onChange={(e) => setValues({ ...values, default_tax_rate: e.target.valueAsNumber })} /></label><label><HFieldLabel required>Délai souhaité par défaut (jours)</HFieldLabel><HInput required type="number" min={0} max={365} step={1} value={values.default_lead_days} onChange={(e) => setValues({ ...values, default_lead_days: e.target.valueAsNumber })} /></label></form>{save.error && <p role="alert" className="field-error">{save.error.message}</p>}</section>
}
