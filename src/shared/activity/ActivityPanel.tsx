import { ActivityFileLink } from './ActivityFileLink'
import { HFieldLabel } from '../ui/HFieldLabel'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AtSign, Check, CheckCheck, ChevronDown, Clock3, History, MessageSquare, Paperclip, Send, X, ArrowRight, Trash2, ClipboardPlus } from 'lucide-react'
import { sessionService } from '../../core/auth/services/session'
import { activityService } from '../../core/activity/services/ActivityService'
import type { ActivityEvent, ActivityFilter, ActivitySource, ActivityTask, ActivityUser, Publication, TaskStatus } from '../../core/activity/types/activity'
import { changeAction } from './changeAction'
import { mentionParts } from './mentionParts'
import { HButton } from '../ui/HButton'
import { HInput } from '../ui/HInput'
import { HCombobox } from '../ui/HCombobox'
import { HRecordConfirmation } from '../ui/HRecordConfirmation'

const filters: { value: ActivityFilter; label: string }[] = [{ value: 'all', label: 'Tout' }, { value: 'changes', label: 'Modifications' }, { value: 'comments', label: 'Commentaires' }, { value: 'documents', label: 'Documents' }, { value: 'tasks', label: 'Tâches' }]
const taskStatuses: { value: TaskStatus; label: string }[] = [{ value: 'todo', label: 'À faire' }, { value: 'in_progress', label: 'En cours' }, { value: 'blocked', label: 'Bloquée' }, { value: 'done', label: 'Terminée' }, { value: 'cancelled', label: 'Annulée' }]
function timestamp(value: string) { return new Date(value.replace(' ', 'T')).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function filename(value: string) { return value.replace(/_[a-z0-9]{10}(\.[^.]+)$/i, '$1') }

export function ActivityPanel({ source, editable }: { source: ActivitySource; editable: boolean }) {
  const { hash } = useLocation()
  useEffect(() => { if (hash === '#activity') document.getElementById('activity')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [hash, source.id])
  const [filter, setFilter] = useState<ActivityFilter>('all')
  const [origin, setOrigin] = useState<ActivityEvent>()
  const client = useQueryClient()
  const feed = useInfiniteQuery({ queryKey: ['activity', source.entity, source.id, filter], queryFn: ({ pageParam }) => activityService.list(source, pageParam, filter), initialPageParam: 1, getNextPageParam: (page) => page.page < page.totalPages ? page.page + 1 : undefined, retry: false, refetchInterval: 30_000 })
  const tasks = useQuery({ queryKey: ['activity-tasks', source.entity, source.id], queryFn: () => activityService.tasks(source), retry: false, refetchInterval: 30_000 })
  const items = feed.data?.pages.flatMap((page) => page.items) ?? []
  const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: ['activity', source.entity, source.id] }), client.invalidateQueries({ queryKey: ['activity-tasks', source.entity, source.id] }), client.invalidateQueries({ queryKey: ['notifications'] })]) }
  const taskUpdate = useMutation({ mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => activityService.updateTask(id, { status }), onSuccess: refresh })
  return <section className="activity-panel" id="activity" aria-label="Fil d’activité">
    <div className="activity-panel-heading"><div className="activity-panel-title"><span className="activity-heading-icon"><History size={18} /></span><div><h2>Fil d’activité</h2><p>Les échanges et l’histoire de cette fiche.</p></div></div></div>
    {editable && <ActivityComposer key={origin?.id ?? 'new'} source={source} origin={origin} onPublished={async () => { setOrigin(undefined); await refresh() }} onCancelOrigin={() => setOrigin(undefined)} />}
    <div className="activity-filter-row"><nav aria-label="Filtrer le fil d’activité">{filters.map((item) => <button type="button" key={item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}</nav>{feed.data && <small>{feed.data.pages[0]?.totalItems} événement{feed.data.pages[0]?.totalItems === 1 ? '' : 's'}</small>}</div>
    {(feed.error || tasks.error || taskUpdate.error) && <div role="alert" className="activity-error">{(feed.error ?? tasks.error ?? taskUpdate.error)?.message}<HButton size="small" onClick={() => { taskUpdate.reset(); void refresh() }}>Réessayer</HButton></div>}
    {feed.isPending ? <div className="activity-skeleton" aria-label="Chargement du fil"><span /><span /><span /></div> : !items.length && !feed.error ? <div className="activity-empty"><MessageSquare size={25} /><strong>{filter === 'all' ? 'Le fil commence ici' : 'Aucun événement dans cette catégorie'}</strong><p>{filter === 'all' ? 'Les prochaines modifications et les échanges de votre équipe apparaîtront ici.' : 'Choisissez un autre filtre pour consulter le reste du fil.'}</p></div> : <ol className="activity-timeline">{items.map((item) => <ActivityItem key={item.id} item={item} task={tasks.data?.find((task) => task.activity_event === item.id)} editable={editable} taskBusy={taskUpdate.isPending} onTaskStatus={(id, status) => taskUpdate.mutate({ id, status })} onConvert={() => { setOrigin(item); document.getElementById('activity')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} />)}</ol>}
    {feed.hasNextPage && <div className="activity-more"><HButton size="small" disabled={feed.isFetchingNextPage} onClick={() => void feed.fetchNextPage()}><ChevronDown size={14} />Afficher les événements précédents</HButton></div>}
  </section>
}
function ActivityItem({ item, task, editable, taskBusy, onTaskStatus, onConvert }: { item: ActivityEvent; task: ActivityTask | undefined; editable: boolean; taskBusy: boolean; onTaskStatus: (id: string, status: TaskStatus) => void; onConvert: () => void }) {
  const automatic = ['change', 'status_change', 'system'].includes(item.type)
  const comment = ['note', 'message'].includes(item.type)
  const convertAction = editable && comment ? <button type="button" className="activity-convert" aria-label="Créer une tâche à partir de cette note" title="Créer une tâche à partir de cette note" onClick={onConvert}><ClipboardPlus size={15} aria-hidden="true" /></button> : null
  const message = item.body ? <p className={`activity-message${comment ? ' activity-message--comment' : ''}`}>{mentionParts(item.body, item.metadata.mentions).map((part, index) => part.mentioned ? <span className="activity-mention" key={index}>{part.text}</span> : part.text)}</p> : !item.attachments.length ? <p className="activity-change-title">Les pièces jointes de cette publication ont été supprimées.</p> : null
  return <li className={`activity-item activity-item--${automatic ? 'change' : item.type}`}>
    <div className="activity-date-divider"><time dateTime={item.created.replace(' ', 'T')}>{timestamp(item.created)}</time></div>
    <div className="activity-item-content"><div className="activity-item-heading"><span className={`activity-avatar${!item.author ? ' activity-avatar--system' : ''}`} aria-hidden="true">{item.author ? item.metadata.author.initials : <History size={15} />}</span><strong>{item.metadata.author.name}</strong><span>{item.metadata.action === 'attachment_delete' ? 'a supprimé une pièce jointe' : automatic ? changeAction(item) : item.type === 'task' ? task ? 'a créé une tâche' : 'a mis à jour une tâche' : item.type === 'document' || !item.body && item.attachments.length ? 'a ajouté un document' : item.metadata.mentions?.length ? item.metadata.mentions.length === 1 ? 'a mentionné un collègue' : 'a mentionné des collègues' : 'a publié un commentaire'}</span></div>
      {automatic ? <div className="activity-change-row">{!item.metadata.changes?.length && <p className="activity-change-title">{item.body}</p>}<ActivityChanges changes={item.metadata.changes} /></div> : message && (comment ? <div className="activity-comment-row">{message}{convertAction}</div> : message)}
      {!automatic && <ActivityChanges changes={item.metadata.changes} />}
      {item.attachments.length > 0 && <div className="activity-attachments">{item.attachments.map((file) => <ActivityAttachment key={file} item={item} file={file} editable={editable} />)}{!item.body && convertAction}</div>}
      {task && <div className={`activity-task activity-task--${task.status}`}><div className="activity-task-title"><CheckCheck size={17} /><strong>{task.title}</strong>{task.priority === 'high' && <span className="activity-task-priority">Prioritaire</span>}</div><div className="activity-task-meta"><span>{task.assigned_name}</span>{task.due_date && <span><Clock3 size={12} />Échéance {new Date(task.due_date.replace(' ', 'T')).toLocaleDateString('fr-FR')}</span>}</div><div className="activity-task-actions"><HCombobox label={`État de la tâche : ${task.title}`} value={task.status} onChange={(value) => { const status = taskStatuses.find((item) => item.value === value)?.value; if (status) onTaskStatus(task.id, status) }} options={taskStatuses} required showCodes={false} disabled={!editable || taskBusy} />{editable && task.status !== 'done' && task.status !== 'cancelled' && <HButton variant="ghost" size="small" disabled={taskBusy} onClick={() => onTaskStatus(task.id, 'done')}><Check size={14} />Terminer</HButton>}</div></div>}
    </div>
  </li>
}
function ActivityChanges({ changes }: { changes: ActivityEvent['metadata']['changes'] }) {
  if (!changes?.length) return null
  const value = (input: string | boolean) => typeof input === 'boolean' ? input ? 'Oui' : 'Non' : input || '—'
  return <ul className="activity-diff" aria-label="Modifications de la fiche">{changes.map((change, index) => <li key={`${change.field}-${index}`}><strong>{change.label} :</strong><span className="activity-diff-before" title={value(change.before)}>{value(change.before)}</span><ArrowRight size={11} aria-label="devient" /><span>{value(change.after)}</span></li>)}</ul>
}
function ActivityAttachment({ item, file, editable }: { item: ActivityEvent; file: string; editable: boolean }) {
  const [open, setOpen] = useState(false)
  const client = useQueryClient()
  return <div className="activity-file-group"><ActivityFileLink eventId={item.id} collectionId={item.collectionId} file={file} />
    {editable && <HButton variant="ghost" size="icon" className="activity-file-delete" aria-label={`Supprimer la pièce jointe ${filename(file)}`} onClick={() => setOpen(true)}><Trash2 size={14} /></HButton>}
    <HRecordConfirmation action="delete" itemName={filename(file)} description="Le fichier sera retiré définitivement. Le commentaire reste conservé et la suppression sera tracée dans le fil." open={open} onOpenChange={setOpen} onConfirm={async () => { await activityService.removeAttachment(item.id, file); client.removeQueries({ queryKey: ['activity-file', item.id, file] }); void client.invalidateQueries({ queryKey: ['activity'] }) }} />
  </div>
}
function ActivityComposer({ source, origin, onPublished, onCancelOrigin }: { source: ActivitySource; origin: ActivityEvent | undefined; onPublished: () => Promise<void>; onCancelOrigin: () => void }) {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const user = session.status === 'authenticated' ? session.user : undefined
  const [body, setBody] = useState(origin?.body ?? '')
  const [mode, setMode] = useState<'note' | 'task'>(origin ? 'task' : 'note')
  const [files, setFiles] = useState<File[]>([])
  const [mentions, setMentions] = useState<ActivityUser[]>([])
  const [picker, setPicker] = useState<'mention' | 'assignee'>()
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState(origin?.body.split('\n')[0]?.slice(0, 160) ?? '')
  const [assignee, setAssignee] = useState<ActivityUser | undefined>(user ? { id: user.id, name: user.name, initials: user.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() } : undefined)
  const [due, setDue] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const users = useQuery({ queryKey: ['activity-users', source.entity, query], queryFn: () => activityService.users(query, source), enabled: Boolean(picker), retry: false })
  const publication = useMutation({ mutationFn: () => {
    const input: Publication = { body, type: mode, mentions: mentions.map((item) => item.id), ...(origin ? { origin_event: origin.id } : {}), ...(mode === 'task' ? { task: { title, assigned_to: assignee?.id ?? '', due_date: due, priority } } : {}) }
    return activityService.publish(source, input, files)
  }, onSuccess: async () => { setBody(''); setFiles([]); setMentions([]); setPicker(undefined); setTitle(''); setMode('note'); await onPublished() } })
  const busy = publication.isPending
  function chooseUser(person: ActivityUser) {
    if (picker === 'assignee') setAssignee(person)
    else if (!mentions.some((item) => item.id === person.id) && mentions.length < 10) { setMentions((current) => [...current, person]); setBody((current) => { const base = current.endsWith('@' + query) ? current.slice(0, -query.length - 1) : current; return base + `${base.endsWith(' ') || !base ? '' : ' '}@${person.name} ` }) }
    setPicker(undefined); setQuery('')
  }
  return <form className="activity-composer" aria-label="Publier dans le fil" onSubmit={(event) => { event.preventDefault(); publication.mutate() }}>
    <div className="activity-composer-top"><span className="activity-avatar" aria-hidden="true">{user?.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U'}</span><div className="activity-composer-body">
      {origin && <div className="activity-origin"><span>Créer une tâche à partir d’une note</span><HButton variant="ghost" size="icon" aria-label="Annuler la conversion en tâche" disabled={busy} onClick={onCancelOrigin}><X size={13} /></HButton></div>}
      <textarea aria-label="Message du fil" className="activity-textarea" placeholder="Partager une information avec l’équipe… @ pour mentionner" value={body} maxLength={10000} rows={2} disabled={busy} onChange={(event) => { const value = event.target.value; setBody(value); const match = value.match(/@([^@\n]{0,40})$/); if (match && !mentions.some((person) => match[1]?.startsWith(person.name))) { setPicker('mention'); setQuery(match[1] ?? '') } else if (picker === 'mention') setPicker(undefined) }} />
      {mode === 'task' && <div className="activity-task-fields"><label><HFieldLabel required>Titre de la tâche</HFieldLabel><HInput aria-label="Titre de la tâche" aria-required="true" value={title} maxLength={160} disabled={busy} onChange={(event) => setTitle(event.target.value)} placeholder="Action à réaliser" /></label><label><HFieldLabel required>Responsable</HFieldLabel><HButton disabled={busy} onClick={() => { setPicker('assignee'); setQuery('') }}>{assignee?.name || 'Choisir un responsable'}<ChevronDown size={13} /></HButton></label><label>Échéance<HInput aria-label="Échéance de la tâche" type="date" value={due} disabled={busy} onChange={(event) => setDue(event.target.value)} /></label><label><HFieldLabel required>Priorité</HFieldLabel><HCombobox label="Priorité de la tâche" value={priority} options={[{ value: 'low', label: 'Basse' }, { value: 'normal', label: 'Normale' }, { value: 'high', label: 'Haute' }]} required showCodes={false} disabled={busy} onChange={(value) => { if (value === 'low' || value === 'normal' || value === 'high') setPriority(value) }} /></label></div>}
      {picker && <div className="activity-user-picker"><div><HInput aria-label={picker === 'mention' ? 'Rechercher une personne à mentionner' : 'Rechercher un responsable'} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un collègue…" /><HButton variant="ghost" size="icon" aria-label="Fermer la sélection de personne" onClick={() => setPicker(undefined)}><X size={14} /></HButton></div>{users.error ? <p role="alert">{users.error.message}</p> : <div className="activity-user-options">{users.data?.map((person) => <button type="button" key={person.id} disabled={busy} onClick={() => chooseUser(person)}><span className="activity-avatar">{person.initials}</span>{person.name}</button>)}{users.data?.length === 0 && <p>Aucun collègue disponible.</p>}</div>}</div>}
      {mentions.length > 0 && <div className="activity-mention-chips">{mentions.map((person) => <span key={person.id}><AtSign size={11} />{person.name}<button type="button" disabled={busy} aria-label={`Retirer la mention de ${person.name}`} onClick={() => setMentions((current) => current.filter((item) => item.id !== person.id))}><X size={11} /></button></span>)}</div>}
      {files.length > 0 && <div className="activity-draft-files">{files.map((file, index) => <span key={`${file.name}-${index}`}><Paperclip size={12} />{file.name}<button type="button" disabled={busy} aria-label={`Retirer ${file.name}`} onClick={() => setFiles((current) => current.filter((_, position) => position !== index))}><X size={12} /></button></span>)}</div>}
    </div></div>
    <div className="activity-composer-footer"><div><label className="activity-attach"><Paperclip size={15} /><span>Joindre</span><input type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp,text/plain" aria-label="Pièces jointes du fil" disabled={busy} onChange={(event) => { const incoming = Array.from(event.target.files ?? []); setFiles((current) => [...current, ...incoming]); event.target.value = '' }} /></label><HButton variant="ghost" size="small" disabled={busy || mentions.length >= 10} onClick={() => { setPicker('mention'); setQuery('') }}><AtSign size={15} />Mentionner</HButton><HButton variant="ghost" size="small" disabled={busy || Boolean(origin)} aria-pressed={mode === 'task'} onClick={() => setMode((current) => current === 'task' ? 'note' : 'task')}><CheckCheck size={15} />Tâche</HButton></div><HButton type="submit" variant={body.trim() || files.length ? 'primary' : 'secondary'} size="small" disabled={busy || (!body.trim() && !files.length) || (mode === 'task' && (!title.trim() || !assignee))}><Send size={14} />{busy ? 'Publication…' : mode === 'task' ? 'Créer la tâche' : 'Publier'}</HButton></div>
    {publication.error && <p role="alert" className="activity-error">{publication.error.message}</p>}
  </form>
}
