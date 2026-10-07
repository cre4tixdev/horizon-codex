import { useState, useSyncExternalStore } from 'react'
import { useSearchParams } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Network } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HButton } from '../../../shared/ui/HButton'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HTag } from '../../../shared/ui/HTag'
import { HTonePicker } from '../../../shared/ui/HTonePicker'
import { useReferences } from '../hooks/useReferences'
import { referencesService } from '../services/ReferencesService'
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
    {query.data && [{ title: 'Profils ERP', icon: ShieldCheck, codes: ['admin', 'superuser', 'user', 'viewer'] }, { title: 'Responsabilités', icon: Network, codes: ['direction', 'manager', 'collaborator'] }].filter((group) => tags.some((tag) => group.codes.includes(tag.code))).map((group) => <section className="contact-panel" key={group.title}><HSectionHeading icon={group.icon} title={group.title} /><div className="settings-reference-table"><table className="reference-table"><thead><tr><th>Tag</th><th>Aperçu</th><th className="settings-action-cell"><span className="sr-only">Configurer</span></th></tr></thead><tbody>{tags.filter((tag) => group.codes.includes(tag.code)).map((tag) => <tr key={tag.id}><td>{tag.label}</td><td><HTag tone={tag.tone || 'blue'} color={tag.color}>{tag.label}</HTag></td><td className="settings-action-cell"><SettingsEditButton label={tag.label} onClick={() => setEditor(tag)} /></td></tr>)}</tbody></table></div></section>)}
    {query.data && tags.length === 0 && <p className="contact-muted">Aucun tag correspondant.</p>}
    {editor && <TagColorDialog record={editor} onClose={() => setEditor(undefined)} />}
  </section>
}

function TagColorDialog({ record, onClose }: { record: Reference; onClose: () => void }) {
  const [tone, setTone] = useState(record.tone || 'blue')
  const [color, setColor] = useState(record.color || '')
  const client = useQueryClient()
  const dirty = tone !== (record.tone || 'blue') || color !== (record.color || '')
  const save = useMutation({ mutationFn: () => referencesService.save('settings_identity_tags', { ...record, tone, color }, record.id), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['references', 'settings_identity_tags'] }); onClose() } })
  return <HDialog open onOpenChange={(open) => { if (!open && !save.isPending) onClose() }} title={`Couleur · ${record.label}`} description="Choisissez une teinte Horizon ou une couleur personnalisée.">
    <div className="contact-panel"><HTonePicker label="Couleur du tag" value={tone} color={color} onChange={(next) => { setTone(next); setColor('') }} onColorChange={setColor} disabled={save.isPending} /><HSectionHeading title="Aperçu" /><HTag tone={tone} color={color}>{record.label}</HTag>{save.error && <p role="alert" className="field-error">{save.error.message}</p>}</div>
    <HDialogFooter><HButton onClick={onClose} disabled={save.isPending}>Annuler</HButton><HSaveButton hasChanges={dirty} pending={save.isPending} onClick={() => { if (dirty && !save.isPending) save.mutate() }}>Enregistrer</HSaveButton></HDialogFooter>
  </HDialog>
}
