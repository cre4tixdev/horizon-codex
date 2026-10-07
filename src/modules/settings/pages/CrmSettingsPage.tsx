import { hasPermission } from '../../../core/auth/types/session'
import { SettingsEditButton } from '../components/SettingsEditButton'
import { useState, useSyncExternalStore } from 'react'
import { useSearchParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Columns3, List, Plus, Target } from 'lucide-react'
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
  const tab = ['stages', 'markets'].includes(params.get('tab') || '') ? params.get('tab')! : 'presentation'
  const settings = useCrmSettings(allowed)
  if (!allowed) return <HEmptyState icon={Target} title="Paramètres CRM" description="Vous ne disposez pas de la permission de consulter ces paramètres." />
  return <div className="settings-crm"><HSectionHeading title="CRM" description="Personnalisez la présentation et les classifications de vos opportunités." icon={Target} />
    <HRecordTabs label="Paramètres CRM" idPrefix="settings-crm-tab" value={tab} onChange={(next) => setParams({ tab: next })} items={[{ value: 'presentation', label: 'Présentation', panel: 'settings-crm-presentation' }, { value: 'stages', label: 'Étapes', panel: 'settings-crm-stages' }, { value: 'markets', label: 'Types de marché', panel: 'settings-crm-markets' }]} />
    {!editable && <p className="contact-muted">Consultation uniquement. La permission d’administration des référentiels est nécessaire pour modifier ces réglages.</p>}
    {tab === 'presentation' && <section id="settings-crm-presentation" role="tabpanel" aria-labelledby="settings-crm-tab-presentation" className="contact-panel">{settings.data && <Presentation key={settings.data.default_view} record={settings.data} editable={editable} />}{settings.isPending && <p role="status">Chargement des réglages…</p>}{settings.error && <p role="alert">{settings.error.message}<HButton onClick={() => void settings.refetch()}>Réessayer</HButton></p>}</section>}
    {tab !== 'presentation' && <CrmCatalog key={tab} catalog={tab === 'stages' ? 'crm_stages' : 'crm_market_types'} editable={editable} />}
  </div>
}
function Presentation({ record, editable }: { record: CrmSettings; editable: boolean }) {
  const [view, setView] = useState(record.default_view)
  const client = useQueryClient()
  const save = useMutation({ mutationFn: () => crmSettingsService.save(record.id, view), onSuccess: (saved) => client.setQueryData(['settings', 'crm'], saved) })
  return <form onSubmit={(event) => { event.preventDefault(); if (view !== record.default_view && !save.isPending) save.mutate() }}><HSectionHeading title="Vue de départ" description="La vue utilisée à l’ouverture du CRM. Vous pouvez ensuite basculer entre Kanban et Liste." /><fieldset className="crm-default-view" disabled={!editable || save.isPending}><legend className="sr-only">Vue de départ</legend>{(['kanban', 'list'] as const).map((choice) => <label key={choice} data-selected={view === choice}><input type="radio" name="crm-default-view" checked={view === choice} onChange={() => setView(choice)} />{choice === 'kanban' ? <Columns3 size={20} /> : <List size={20} />}<span><strong>{choice === 'kanban' ? 'Kanban' : 'Liste'}</strong><small>{choice === 'kanban' ? 'Suivi visuel par étape' : 'Lecture et comparaison des affaires'}</small></span></label>)}</fieldset>{save.error && <p role="alert" className="field-error">{save.error.message}</p>}{editable && <HSaveButton hasChanges={view !== record.default_view} pending={save.isPending}>Enregistrer</HSaveButton>}</form>
}
function CrmCatalog({ catalog, editable }: { catalog: CatalogName; editable: boolean }) {
  const query = useReferences(catalog)
  const [editor, setEditor] = useState<Reference | 'new'>()
  const stages = catalog === 'crm_stages'
  return <section id={`settings-crm-${stages ? 'stages' : 'markets'}`} role="tabpanel" aria-labelledby={`settings-crm-tab-${stages ? 'stages' : 'markets'}`} className="contact-panel"><div className="settings-crm-heading"><HSectionHeading title={stages ? 'Étapes commerciales' : 'Types de marché'} description={stages ? 'Six étapes fixes : personnalisez les noms, couleurs et ordre des colonnes.' : 'Des tags colorés cumulables sur une même opportunité.'} />{editable && !stages && <HButton onClick={() => setEditor('new')}><Plus size={14} />{stages ? 'Ajouter une étape' : 'Ajouter un type'}</HButton>}</div>
    {editor && <ReferenceEditor key={editor === 'new' ? 'new' : editor.id} catalog={catalog} {...(editor === 'new' ? {} : { record: editor })} onClose={() => setEditor(undefined)} />}
    {query.isPending && <p role="status">Chargement…</p>}{query.error && <p role="alert">{query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    <div className="settings-reference-table"><table className="reference-table"><thead><tr><th>Code</th><th>Libellé</th><th>Aperçu</th><th>Ordre</th><th>État</th>{editable && <th className="settings-action-cell"><span className="sr-only">Configurer</span></th>}</tr></thead><tbody>{query.data?.filter((item) => !stages || item.active).map((item) => <tr key={item.id}><td>{item.code}</td><td>{item.label}</td><td><HTag color={item.color} tone={item.tone || 'blue'}>{item.label}</HTag></td><td>{item.sort_order}</td><td>{item.active ? 'Actif' : 'Inactif'}</td>{editable && <td className="settings-action-cell"><SettingsEditButton label={item.code} onClick={() => setEditor(item)} /></td>}</tr>)}</tbody></table></div>
  </section>
}
