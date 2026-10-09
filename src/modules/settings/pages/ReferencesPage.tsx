import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { SettingsEditButton } from '../components/SettingsEditButton'
import { useState, useSyncExternalStore } from 'react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { Navigate, useSearchParams } from 'react-router'
import { HButton } from '../../../shared/ui/HButton'
import { catalogNames, catalogLabels } from '../schemas/references'
import type { CatalogName, Reference } from '../types/references'
import { useReferences } from '../hooks/useReferences'
import { ReferenceEditor } from '../components/ReferenceEditor'
export function ReferencesPage() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const editable = session.status === 'authenticated' && hasPermission(session.user, 'settings.references')
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('catalog')
  const catalog: CatalogName = catalogNames.find((name) => name === requested) ?? 'settings_countries'
  const [editor, setEditor] = useState<Reference | 'new'>()
  const query = useReferences(catalog)
  if (catalog === 'crm_tender_statuses' || catalog === 'crm_tender_tags') return <Navigate to={`/settings/crm?tab=${catalog === 'crm_tender_statuses' ? 'ao-stages' : 'ao-tags'}`} replace />
  if (catalog === 'crm_appointment_kinds') return <Navigate replace to="/settings/crm?tab=appointment-tags" />
  if (catalog === 'settings_identity_tags') return <Navigate replace to="/settings/users?tab=tags" />
  if (catalog.startsWith('crm_')) return <Navigate replace to={`/settings/crm?tab=${catalog === 'crm_stages' ? 'stages' : 'markets'}`} />
  return <><div className="settings-reference-heading"><h2>Référentiels</h2><p>Pays, langues, devises et unités partagés dans Horizon.</p></div><div className="settings-reference-toolbar">{catalogNames.filter((name) => !name.startsWith('crm_') && name !== 'settings_identity_tags').map((name) => <HButton key={name} aria-pressed={catalog === name} variant={catalog === name ? 'primary' : 'ghost'} onClick={() => { setSearchParams({ catalog: name }, { replace: true }); setEditor(undefined) }}>{catalogLabels[name]}</HButton>)}{editable && <HButton onClick={() => setEditor('new')}>Ajouter une valeur</HButton>}</div>{!editable && <p className="contact-muted">Consultation des référentiels. Contactez votre administrateur pour les modifier.</p>}{query.isPending && <p role="status">Chargement…</p>}{query.error && <p role="alert">{query.error.message} <HButton onClick={() => { void query.refetch() }}>Réessayer</HButton></p>}{editor && <ReferenceEditor key={`${catalog}-${editor === 'new' ? 'new' : editor.id}`} catalog={catalog} {...(editor === 'new' ? {} : { record: editor })} onClose={() => setEditor(undefined)} />}<HSettingsTable count={query.data?.length}><table className="reference-table"><thead><tr><th>Code</th><th>Libellé</th><th className="settings-state-cell">État</th><th>Ordre</th>{editable && <th className="settings-action-cell">Actions</th>}</tr></thead><tbody>{query.data?.map((item) => <tr key={item.id}><td>{item.code}</td><td>{item.label}</td><td className="settings-state-cell">{item.active ? 'Actif' : 'Inactif'}</td><td>{item.sort_order}</td>{editable && <td className="settings-action-cell"><SettingsEditButton label={item.code} onClick={() => setEditor(item)} /></td>}</tr>)}</tbody></table></HSettingsTable></>
}
