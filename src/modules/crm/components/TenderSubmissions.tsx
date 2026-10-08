import { useId, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PackageCheck, Plus, LockKeyhole } from 'lucide-react'
import { activityService } from '../../../core/activity/services/ActivityService'
import { ActivityFileLink } from '../../../shared/activity/ActivityFileLink'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HZonedDateInput } from '../../../shared/ui/HZonedDateInput'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { displayInstant } from '../../../shared/time/zonedDate'
import { tenderService } from '../services/TenderService'
import { submissionInputSchema, type Tender, type SubmissionInput } from '../schemas/tenders'
function activityFilename(value: string) { return value.replace(/_[a-z0-9]{10}(\.[^.]+)$/i, '$1') }
export function TenderSubmissions({ tender, editable }: { tender: Tender; editable: boolean }) {
  const history = useQuery({ queryKey: ['crm', 'submissions', tender.id], queryFn: () => tenderService.submissions(tender.id), retry: false, refetchInterval: 30_000 })
  const [open, setOpen] = useState(false)
  return <section className="contact-panel"><HSectionHeading title="Réponses déposées" icon={PackageCheck} count={history.data?.length} description="L’échéance de remise reste distincte du dépôt effectif. Chaque dépôt conserve ses pièces." actions={editable && <HButton size="small" onClick={() => setOpen(true)}><Plus size={14} />Enregistrer un dépôt</HButton>} />{history.isPending && <p role="status">Chargement des dépôts…</p>}{history.error && <p role="alert" className="field-error">{history.error.message}<HButton onClick={() => void history.refetch()}>Réessayer</HButton></p>}{history.data && !history.data.length && <p className="contact-muted">Aucune réponse déposée.</p>}<div className="tender-submission-history">{history.data?.map((submission) => <article key={submission.id}><strong><LockKeyhole size={13} />Version {submission.version} · {displayInstant(submission.submitted_at, submission.timezone)}</strong>{submission.notes && <p>{submission.notes}</p>}<div className="activity-attachments">{submission.documents.map((file) => <ActivityFileLink key={`${file.event_id}/${file.filename}`} eventId={file.event_id} file={file.filename} />)}</div></article>)}</div>{open && <SubmissionEditor tender={tender} onClose={() => setOpen(false)} />}</section>
}
function SubmissionEditor({ tender, onClose }: { tender: Tender; onClose: () => void }) {
  const formId = useId()
  const [key] = useState(() => crypto.randomUUID())
  const [input, setInput] = useState<SubmissionInput>({ submitted_at: new Date().toISOString(), timezone: tender.timezone, notes: '', documents: [] })
  const [error, setError] = useState('')
  const client = useQueryClient()
  const files = useInfiniteQuery({ queryKey: ['activity', 'deposit-documents', tender.id], queryFn: ({ pageParam }) => activityService.list({ entity: 'crm_tenders', id: tender.id }, pageParam, 'documents'), initialPageParam: 1, getNextPageParam: (page) => page.page < page.totalPages ? page.page + 1 : undefined, retry: false })
  const documents = files.data?.pages.flatMap((page) => page.items.flatMap((event) => event.attachments.map((filename) => ({ event_id: event.id, filename })))) || []
  const save = useMutation({ mutationFn: () => tenderService.submit(tender.id, input, key), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: ['crm', 'submissions'] }), client.invalidateQueries({ queryKey: ['activity'] })]); onClose() } })
  return <HDialog open title="Enregistrer le dépôt de la réponse" description="Sélectionnez les documents réellement transmis et votre preuve de dépôt. Ce dépôt sera conservé sans modification." onOpenChange={(open) => { if (!open && !save.isPending) onClose() }}><form id={formId} className="dialog-form" onSubmit={(event) => { event.preventDefault(); const result = submissionInputSchema.safeParse(input); if (!result.success) { setError(result.error.issues[0]?.message || 'Vérifiez le dépôt.'); return }; setError(''); save.mutate() }}><fieldset className="access-fieldset contact-form-grid" disabled={save.isPending}><label><HFieldLabel required>Date et heure du dépôt</HFieldLabel><HZonedDateInput value={input.submitted_at} timezone={input.timezone} required onChange={(submitted_at) => setInput({ ...input, submitted_at })} /></label><label>Notes du dépôt<textarea className="h-input" rows={3} maxLength={5000} value={input.notes} onChange={(event) => setInput({ ...input, notes: event.target.value })} /></label></fieldset><div className="tender-deposit-files"><HFieldLabel required>Pièces déposées et preuve</HFieldLabel><p className="contact-muted">Ajoutez vos fichiers dans le fil de la fiche, puis sélectionnez-les ici.</p>{documents.map((file) => <label key={`${file.event_id}/${file.filename}`} className="h-choice"><input type="checkbox" disabled={save.isPending} checked={input.documents.some((selected) => selected.event_id === file.event_id && selected.filename === file.filename)} onChange={(event) => setInput({ ...input, documents: event.target.checked ? [...input.documents, file] : input.documents.filter((selected) => selected.event_id !== file.event_id || selected.filename !== file.filename) })} />{activityFilename(file.filename)}</label>)}{files.isPending && <p role="status">Chargement des pièces…</p>}{files.error && <p role="alert" className="field-error">{files.error.message}<HButton onClick={() => void files.refetch()}>Réessayer</HButton></p>}{files.hasNextPage && <HButton onClick={() => void files.fetchNextPage()} disabled={files.isFetchingNextPage}>Afficher les pièces précédentes</HButton>}</div>{(error || save.error) && <p role="alert" className="field-error">{error || save.error?.message}</p>}</form><HDialogFooter><HButton onClick={onClose} disabled={save.isPending}>Annuler</HButton><HSaveButton form={formId} hasChanges={input.documents.length > 0} pending={save.isPending}>Enregistrer le dépôt</HSaveButton></HDialogFooter></HDialog>
}
