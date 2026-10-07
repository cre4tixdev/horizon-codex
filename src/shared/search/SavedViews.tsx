import { HFieldLabel } from '../ui/HFieldLabel'
import { useState, useSyncExternalStore } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Globe, LockKeyhole, Trash2, Plus, Save } from 'lucide-react'
import { sessionService } from '../../core/auth/services/session'
import { viewsService } from '../../core/views/ViewsService'
import type { SavedView, SavedViewInput, ViewContext } from '../../core/views/types'
import { HButton } from '../ui/HButton'
import { HInput } from '../ui/HInput'

export function SavedViews({ context, params, onApply }: { context: ViewContext; params: SavedViewInput['params']; onApply: (view: SavedView) => void }) {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const user = session.status === 'authenticated' ? session.user : undefined
  const allowed = user?.role.permissions.includes('contacts.read') ?? false
  const canManage = user?.role.permissions.includes('core.views.manage') ?? false
  const client = useQueryClient()
  const views = useQuery({ queryKey: ['saved-views', user?.id, context], queryFn: () => viewsService.list(context), enabled: allowed, retry: false })
  const [editing, setEditing] = useState<{ id?: string; name: string; visibility: 'personal' | 'shared' }>()
  const [deleting, setDeleting] = useState<string>()
  const save = useMutation({ mutationFn: (input: SavedViewInput & { id?: string }) => viewsService.save(input, input.id), onSuccess: (view) => { setEditing(undefined); void client.invalidateQueries({ queryKey: ['saved-views'] }); onApply(view) } })
  const remove = useMutation({ mutationFn: (id: string) => viewsService.remove(id), onSuccess: () => { setDeleting(undefined); void client.invalidateQueries({ queryKey: ['saved-views'] }) } })
  const original = views.data?.find((view) => view.id === editing?.id)
  const dirty = Boolean(editing && (!editing.id || original && (editing.name.trim() !== original.name || editing.visibility !== original.visibility || Object.keys({ ...original.params, ...params }).some((key) => original.params[key as keyof typeof params] !== params[key as keyof typeof params]))))
  if (!allowed) return null
  return <section className="saved-views" aria-label="Vues enregistrées">
    <header><h3><Bookmark size={14} />Vues enregistrées</h3><HButton size="small" variant="ghost" aria-label="Enregistrer une nouvelle vue" disabled={Boolean(views.error) || views.isPending || save.isPending} onClick={() => { save.reset(); setEditing({ name: '', visibility: 'personal' }) }}><Plus size={14} />Nouvelle</HButton></header>
    {views.isPending && <p role="status">Chargement des vues…</p>}
    {views.error && <p role="alert">{views.error.message} <button type="button" onClick={() => { void views.refetch() }}>Réessayer</button></p>}
    {views.data?.length === 0 && !editing && <p>Retrouvez vos critères en un clic.</p>}
    <div className="saved-views-list">{views.data?.map((view) => {
      const editable = canManage || view.owner === user?.id
      const Icon = view.visibility === 'shared' ? Globe : LockKeyhole
      return <div key={view.id} className="saved-view-row"><button type="button" className="saved-view-apply" onClick={() => onApply(view)} title={view.visibility === 'shared' ? 'Vue partagée' : 'Vue personnelle'}><Icon size={13} /><span>{view.name}</span><small>{view.visibility === 'shared' ? 'Partagée' : 'Personnelle'}</small></button>{editable && <><HButton variant="ghost" size="icon" aria-label={`Mettre à jour la vue ${view.name}`} onClick={() => { save.reset(); setEditing({ id: view.id, name: view.name, visibility: view.visibility }) }}><Save size={13} /></HButton><HButton variant="ghost" size="icon" aria-label={`Supprimer la vue ${view.name}`} onClick={() => { remove.reset(); setDeleting(view.id) }}><Trash2 size={13} /></HButton></>}{deleting === view.id && <div className="saved-view-delete"><span>Supprimer cette vue ?</span><button type="button" disabled={remove.isPending} onClick={() => remove.mutate(view.id)}>Supprimer</button><button type="button" onClick={() => setDeleting(undefined)}>Annuler</button></div>}</div>
    })}</div>
    {editing && <form className="saved-view-editor" onSubmit={(event) => { event.preventDefault(); if (dirty && editing.name.trim()) save.mutate({ ...editing, context, params }) }}>
      <label><HFieldLabel required>Nom de la vue</HFieldLabel><HInput autoFocus required maxLength={80} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label>
      <fieldset><legend>Visible par</legend><label><input type="radio" name="view-visibility" checked={editing.visibility === 'personal'} onChange={() => setEditing({ ...editing, visibility: 'personal' })} />Moi uniquement</label><label><input type="radio" name="view-visibility" checked={editing.visibility === 'shared'} onChange={() => setEditing({ ...editing, visibility: 'shared' })} />Tous les utilisateurs du module</label></fieldset>
      <small>{editing.id ? 'Enregistrer remplace les critères de cette vue par les choix actuels.' : 'La recherche, les filtres, le regroupement, le tri et la présentation seront conservés.'}</small>
      <div><HButton size="small" variant={dirty && editing.name.trim() ? 'primary' : 'secondary'} disabled={!dirty || !editing.name.trim() || save.isPending} type="submit">Enregistrer la vue</HButton><HButton size="small" variant="ghost" disabled={save.isPending} onClick={() => setEditing(undefined)}>Annuler</HButton></div>
    </form>}
    {(save.error || remove.error) && <p role="alert">{(save.error || remove.error)?.message}</p>}
  </section>
}
