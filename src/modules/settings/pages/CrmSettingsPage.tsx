import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { TagColorDialog } from '../components/TagColorDialog'
import { hasPermission } from '../../../core/auth/types/session'
import { SettingsEditButton } from '../components/SettingsEditButton'
import { useState, useSyncExternalStore } from 'react'
import { useSearchParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Columns3, History, List, Plus, Target } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HTag } from '../../../shared/ui/HTag'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { useCrmSettings } from '../hooks/useCrmSettings'
import { useReferences } from '../hooks/useReferences'
import { crmSettingsService } from '../services/CrmSettingsService'
import { ReferenceEditor } from '../components/ReferenceEditor'
import type { CrmSettings } from '../schemas/crmSettings'
import type { CatalogName, Reference } from '../types/references'

export function CrmSettingsPage() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const editable = session.status === 'authenticated' && hasPermission(session.user, 'settings.references')
  const allowed = editable || session.status === 'authenticated' && session.user.role.permissions.includes('crm.read')
  const [params, setParams] = useSearchParams()
  const requestedTab = params.get('tab') === 'ao-tags' ? 'appointment-tags' : params.get('tab') || ''
  const tab = ['stages', 'markets', 'ao-stages', 'appointment-tags'].includes(requestedTab) ? requestedTab : 'presentation'
  const settings = useCrmSettings(allowed)
  if (!allowed) return <HEmptyState icon={Target} title="Paramètres CRM" description="Vous ne disposez pas de la permission de consulter ces paramètres." />
  return <div className="settings-crm"><HSectionHeading title="CRM" description="Personnalisez la présentation et les classifications de vos opportunités." icon={Target} />
    <HRecordTabs label="Paramètres CRM" idPrefix="settings-crm-tab" value={tab} onChange={(next) => setParams({ tab: next })} items={[{ value: 'presentation', label: 'Présentation', panel: 'settings-crm-presentation' }, { value: 'stages', label: 'Étapes', panel: 'settings-crm-stages' }, { value: 'markets', label: 'Types de marché', panel: 'settings-crm-markets' }, { value: 'ao-stages', label: 'Préparation AO', panel: 'settings-crm-ao-stages' }, { value: 'appointment-tags', label: 'Tags rendez-vous', panel: 'settings-crm-appointment-tags' }]} />
    {!editable && <p className="contact-muted">Consultation uniquement. La permission d’administration des référentiels est nécessaire pour modifier ces réglages.</p>}
    {tab === 'presentation' && <section id="settings-crm-presentation" role="tabpanel" aria-labelledby="settings-crm-tab-presentation" className="contact-panel">{settings.data && <Presentation key={settings.data.default_view} record={settings.data} editable={editable} />}{settings.isPending && <p role="status">Chargement des réglages…</p>}{settings.error && <p role="alert">{settings.error.message}<HButton onClick={() => void settings.refetch()}>Réessayer</HButton></p>}</section>}
    {tab === 'appointment-tags' && <AppointmentTags editable={editable} />}
    {tab !== 'presentation' && tab !== 'appointment-tags' && <CrmCatalog key={tab} catalog={tab === 'stages' ? 'crm_stages' : tab === 'ao-stages' ? 'crm_tender_statuses' : 'crm_market_types'} editable={editable} />}
  </div>
}
function Presentation({ record, editable }: { record: CrmSettings; editable: boolean }) {
  const [view, setView] = useState(record.default_view)
  const client = useQueryClient()
  const save = useMutation({ mutationFn: () => crmSettingsService.save(record.id, view), onSuccess: (saved) => client.setQueryData(['settings', 'crm'], saved) })
  return <form onSubmit={(event) => { event.preventDefault(); if (view !== record.default_view && !save.isPending) save.mutate() }}><HSectionHeading title="Vue de départ" description="La vue utilisée à l’ouverture du CRM. Vous pouvez ensuite basculer entre Kanban et Liste." /><fieldset className="crm-default-view" disabled={!editable || save.isPending}><legend className="sr-only">Vue de départ</legend>{(['kanban', 'list', 'last'] as const).map((choice) => <label key={choice} data-selected={view === choice}><input type="radio" name="crm-default-view" checked={view === choice} onChange={() => setView(choice)} />{choice === 'kanban' ? <Columns3 size={20} /> : choice === 'list' ? <List size={20} /> : <History size={20} />}<span><strong>{choice === 'kanban' ? 'Kanban' : choice === 'list' ? 'Liste' : 'Dernier état'}</strong><small>{choice === 'kanban' ? 'Suivi visuel par étape' : choice === 'list' ? 'Comparaison en liste' : 'Dernière vue utilisée'}</small></span></label>)}</fieldset>{save.error && <p role="alert" className="field-error">{save.error.message}</p>}{editable && <HSaveButton hasChanges={view !== record.default_view} pending={save.isPending}>Enregistrer</HSaveButton>}</form>
}
function CrmCatalog({ catalog, editable }: { catalog: CatalogName; editable: boolean }) {
  const query = useReferences(catalog)
  const [editor, setEditor] = useState<Reference | 'new'>()
  const stages = catalog === 'crm_stages'
  const panel = stages ? 'stages' : catalog === 'crm_tender_statuses' ? 'ao-stages' : 'markets'
  return <section id={`settings-crm-${panel}`} role="tabpanel" aria-labelledby={`settings-crm-tab-${panel}`} className="contact-panel"><div className="settings-crm-heading"><HSectionHeading title={stages ? 'Étapes commerciales' : panel === 'ao-stages' ? 'Préparation de la réponse AO' : 'Types de marché'} description={stages ? 'Six étapes fixes : personnalisez les noms, couleurs et ordre des colonnes.' : panel === 'ao-stages' ? 'Colonnes configurables, indépendantes des six étapes commerciales.' : 'Des tags colorés cumulables sur un même dossier.'} />{editable && !stages && <HButton onClick={() => setEditor('new')}><Plus size={14} />{panel === 'ao-stages' ? 'Ajouter une étape' : 'Ajouter un type'}</HButton>}</div>
    {editor && <ReferenceEditor key={editor === 'new' ? 'new' : editor.id} catalog={catalog} {...(editor === 'new' ? {} : { record: editor })} onClose={() => setEditor(undefined)} />}
    {query.isPending && <p role="status">Chargement…</p>}{query.error && <p role="alert">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    <HSettingsTable count={query.data?.filter((item) => !stages || item.active).length} noun={panel === 'markets' ? 'type' : 'étape'}><table className="reference-table"><thead><tr><th>Code</th><th>Libellé</th><th>Aperçu</th><th>Ordre</th><th className="settings-state-cell">État</th>{editable && <th className="settings-action-cell">Actions</th>}</tr></thead><tbody>{query.data?.filter((item) => !stages || item.active).map((item) => <tr key={item.id}><td>{item.code}</td><td>{item.label}</td><td><HTag color={item.color} tone={item.tone || 'blue'}>{item.label}</HTag></td><td>{item.sort_order}</td><td className="settings-state-cell">{item.active ? 'Actif' : 'Inactif'}</td>{editable && <td className="settings-action-cell"><SettingsEditButton label={item.code} onClick={() => setEditor(item)} /></td>}</tr>)}</tbody></table></HSettingsTable>
  </section>
}

function AppointmentTags({ editable }: { editable: boolean }) {
  const query = useReferences('crm_appointment_kinds')
  const [editor, setEditor] = useState<Reference>()
  return <section className="contact-panel" id="settings-crm-appointment-tags" role="tabpanel" aria-labelledby="settings-crm-tab-appointment-tags">
    <HSectionHeading title="Tags des rendez-vous AO" description="Couleurs des visites et soutenances dans les fiches AO." />
    {query.isPending && <p role="status">Chargement…</p>}{query.error && <p role="alert">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    <HSettingsTable count={query.data?.length} noun="tag"><table className="reference-table"><thead><tr><th>Type</th><th>Aperçu</th>{editable && <th className="settings-action-cell">Actions</th>}</tr></thead><tbody>{query.data?.map((tag) => <tr key={tag.id}><td>{tag.label}</td><td><HTag tone={tag.tone || 'blue'} color={tag.color}>{tag.label}</HTag></td>{editable && <td className="settings-action-cell"><SettingsEditButton label={tag.label} onClick={() => setEditor(tag)} /></td>}</tr>)}</tbody></table></HSettingsTable>
    {editor && <TagColorDialog catalog="crm_appointment_kinds" record={editor} onClose={() => setEditor(undefined)} />}
  </section>
}
