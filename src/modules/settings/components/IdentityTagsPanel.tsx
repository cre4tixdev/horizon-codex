import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { TagColorDialog } from './TagColorDialog'
import { useState, useSyncExternalStore } from 'react'
import { useSearchParams } from 'react-router'
import { ShieldCheck, Network } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HButton } from '../../../shared/ui/HButton'
import { HTag } from '../../../shared/ui/HTag'
import { useReferences } from '../hooks/useReferences'
import { SettingsEditButton } from '../components/SettingsEditButton'
import type { Reference } from '../types/references'

export function IdentityTagsPanel() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const allowed = session.status === 'authenticated' && hasPermission(session.user, 'settings.references')
  const query = useReferences('settings_identity_tags', allowed)
  const [editor, setEditor] = useState<Reference>()
  const [params] = useSearchParams()
  const search = (params.get('q') || '').toLocaleLowerCase('fr')
  const tags = query.data?.filter((tag) => tag.label.toLocaleLowerCase('fr').includes(search)) || []
  if (!allowed) return <HEmptyState icon={ShieldCheck} title="Tags utilisateurs" description="Le paramétrage est réservé à Admin et Superuser." />
  return <section>
    {query.error && <p role="alert">{query.error.message} <HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {query.isPending && <p role="status">Chargement des couleurs…</p>}
    {query.data && [{ title: 'Profils ERP', icon: ShieldCheck, codes: ['admin', 'superuser', 'user', 'viewer'] }, { title: 'Responsabilités', icon: Network, codes: ['direction', 'manager', 'collaborator'] }].filter((group) => tags.some((tag) => group.codes.includes(tag.code))).map((group) => <section className="contact-panel" key={group.title}><HSectionHeading icon={group.icon} title={group.title} /><HSettingsTable count={tags.filter((tag) => group.codes.includes(tag.code)).length} noun="tag"><table className="reference-table"><thead><tr><th>Tag</th><th>Aperçu</th><th className="settings-action-cell">Actions</th></tr></thead><tbody>{tags.filter((tag) => group.codes.includes(tag.code)).map((tag) => <tr key={tag.id}><td>{tag.label}</td><td><HTag tone={tag.tone || 'blue'} color={tag.color}>{tag.label}</HTag></td><td className="settings-action-cell"><SettingsEditButton label={tag.label} onClick={() => setEditor(tag)} /></td></tr>)}</tbody></table></HSettingsTable></section>)}
    {query.data && tags.length === 0 && <p className="contact-muted">Aucun tag correspondant.</p>}
    {editor && <TagColorDialog catalog="settings_identity_tags" record={editor} onClose={() => setEditor(undefined)} />}
  </section>
}
