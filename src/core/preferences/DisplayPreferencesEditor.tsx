import { HCombobox } from '../../shared/ui/HCombobox'
import { HInput } from '../../shared/ui/HInput'
import { useState, type SetStateAction } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { SlidersHorizontal, Undo2 } from 'lucide-react'
import { accountService } from '../auth/services/AccountService'
import { displayPreferencesKey } from './displayPreferencesContext'
import { displayPreferenceSchema, type DisplayPreference, type DisplayPreferenceRecord } from './displayPreferences'
import { HSectionHeading } from '../../shared/ui/HSectionHeading'
import { HSettingsTable } from '../../shared/ui/HSettingsTable'
import { HSaveButton } from '../../shared/ui/HSaveButton'
import { HButton } from '../../shared/ui/HButton'
import { HLoadingIndicator } from '../../shared/ui/HLoadingIndicator'

export function DisplayPreferencesEditor({ userId, active }: { userId: string; active: boolean }) {
  const query = useQuery({ queryKey: displayPreferencesKey(userId), queryFn: accountService.displayPreferences, enabled: active, retry: false, staleTime: 60_000 })
  return <div hidden={!active}>{query.isPending ? <HLoadingIndicator label="Chargement de l’affichage" /> : query.error ? <p className="field-error" role="alert">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p> : query.data && <Editor baseline={query.data} userId={userId} />}</div>
}
function Editor({ baseline, userId }: { baseline: DisplayPreferenceRecord; userId: string }) {
  const [draft, setDraft] = useState({ base: baseline, preference: baseline.preference }), client = useQueryClient()
  const preference = draft.preference
  const setPreference = (value: SetStateAction<DisplayPreference>) => setDraft((current) => ({ ...current, preference: typeof value === 'function' ? value(current.preference) : value }))
  const dirty = JSON.stringify(preference) !== JSON.stringify(draft.base.preference)
  if (!dirty && draft.base.revision !== baseline.revision) setDraft({ base: baseline, preference: baseline.preference })
  const valid = displayPreferenceSchema.safeParse(preference).success
  const save = useMutation({ mutationFn: () => accountService.saveDisplayPreferences({ revision: draft.base.revision, preference }), onSuccess: (data) => { setDraft({ base: data, preference: data.preference }); client.setQueryData(displayPreferencesKey(userId), data) } })
  return <section className="contact-panel account-preferences"><HSectionHeading title="Affichage et confort" icon={SlidersHorizontal} description="Ces réglages personnels vous suivent sur tous vos navigateurs." actions={<><HButton variant="ghost" size="small" disabled={!dirty || save.isPending} onClick={() => { setDraft({ base: baseline, preference: baseline.preference }); save.reset() }}><Undo2 size={14} />Annuler</HButton><HSaveButton disabled={!valid} hasChanges={dirty} pending={save.isPending} onClick={() => save.mutate()} /></>} />
    <HSettingsTable><table className="reference-table account-comfort-table"><thead><tr><th>Confort d’affichage</th><th>Mon choix</th></tr></thead><tbody>
      <tr><td><strong>Thème</strong><p className="contact-muted">Le bouton de la barre supérieure enregistre également votre choix.</p></td><td><HCombobox label="Thème" value={preference.theme} required clearable={false} showCodes={false} disabled={save.isPending} options={[{ value: 'default', label: 'Par défaut de cet appareil' }, { value: 'light', label: 'Clair' }, { value: 'dark', label: 'Sombre' }]} onChange={(theme) => setPreference((current) => ({ ...current, theme: displayPreferenceSchema.shape.theme.parse(theme) }))} /></td></tr>
      <tr><td><strong>Densité</strong><p className="contact-muted">Hauteur des lignes et des champs, pour votre compte uniquement.</p></td><td><HCombobox label="Densité" value={preference.density} required clearable={false} showCodes={false} disabled={save.isPending} options={[{ value: 'default', label: 'Réglage de l’entreprise' }, { value: 'compact', label: 'Compacte' }, { value: 'comfortable', label: 'Confortable' }]} onChange={(density) => setPreference((current) => ({ ...current, density: displayPreferenceSchema.shape.density.parse(density) }))} /></td></tr>
      {([{ key: 'searchWidth', label: 'Largeur de la recherche', min: 400, max: 1200 }, { key: 'sidebarWidth', label: 'Largeur du menu', min: 180, max: 360 }] as const).map(({ key, label, min, max }) => <tr key={key}><td><strong>{label}</strong><p className="contact-muted">{min} à {max} px ; vide pour suivre le réglage de l’entreprise.</p></td><td><HInput aria-label={label} type="number" min={min} max={max} step={1} placeholder="Réglage de l’entreprise" disabled={save.isPending} value={preference[key] ?? ''} aria-invalid={preference[key] !== null && (preference[key] < min || preference[key] > max || !Number.isInteger(preference[key]))} onChange={(event) => { const value = event.target.value; setPreference((current) => ({ ...current, [key]: value === '' ? null : Number(value) })) }} /></td></tr>)}
    </tbody></table></HSettingsTable>
    <HSectionHeading title="Compteurs des cartes et boutons" />
    <HSettingsTable><table className="reference-table"><thead><tr><th>Affichage</th><th className="settings-actions-cell">Activé</th></tr></thead><tbody>{[
      { key: 'showCounters' as const, label: 'Afficher les compteurs', description: 'Dans les smart boutons et les cartes de synthèse cliquables.' },
      { key: 'highlightNonZero' as const, label: 'Colorer les compteurs non nuls des smart boutons', description: 'Sur les smart boutons uniquement : accent Horizon pour les valeurs positives ou négatives. Zéro reste discret ; les cartes conservent leurs couleurs habituelles.' },
    ].map(({ key, label, description }) => <tr key={key}><td><strong>{label}</strong><p className="contact-muted">{description}</p></td><td className="settings-actions-cell"><input type="checkbox" aria-label={label} checked={preference[key]} disabled={save.isPending || key === 'highlightNonZero' && !preference.showCounters} onChange={(event) => setPreference((current) => ({ ...current, [key]: event.target.checked }))} /></td></tr>)}</tbody></table></HSettingsTable>
    <p className="contact-muted">Les indicateurs principaux du dashboard et les montants de synthèse restent affichés. Les filtres et raccourcis restent accessibles lorsque leurs compteurs sont masqués.</p>
    {dirty && draft.base.revision !== baseline.revision && <p role="status" className="contact-muted">Un réglage a changé ailleurs. Votre brouillon est conservé ; rechargez les préférences avant de poursuivre.</p>}
    {save.error && <p role="alert" className="field-error">{save.error.message}<HButton onClick={() => { setDraft({ base: baseline, preference: baseline.preference }); save.reset(); void client.invalidateQueries({ queryKey: displayPreferencesKey(userId) }) }}>Recharger les préférences</HButton></p>}
  </section>
}
