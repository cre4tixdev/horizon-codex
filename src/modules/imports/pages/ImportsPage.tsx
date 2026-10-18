import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, CheckCircle2, FileSpreadsheet, GitCompareArrows, History, ListChecks, Play, Plus, ShieldCheck, Pause, Trash2 } from 'lucide-react'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HPageBreadcrumb } from '../../../shared/ui/HPageBreadcrumb'
import { HButton } from '../../../shared/ui/HButton'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HProgressSteps } from '../../../shared/ui/HProgressSteps'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HBadge } from '../../../shared/ui/HBadge'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { importsService } from '../services/ImportsService'
import { ImportSource } from '../components/ImportSource'
import { ImportMapping } from '../components/ImportMapping'
import { ImportReview } from '../components/ImportReview'
import { suggestMapping, type ImportType, type ImportMode, type SourceData, type ImportJob, type ImportJobMutation } from '../schemas/imports'
import { mergeImportJob } from '../schemas/mergeImportJob'
import '../imports.css'
const states: Record<string, string> = { preview: 'À confirmer', applying: 'À poursuivre', completed: 'Terminé', blocked: 'À vérifier', cancelled: 'Annulé' }
export function ImportsPage() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const owner = session.status === 'authenticated' ? session.user.id : ''
  const allowed = session.status === 'authenticated' && session.user.erpProfile !== 'viewer' && ['contacts.read', 'contacts.write', 'contacts.import'].every((right) => hasPermission(session.user, right))
  const [params, setParams] = useSearchParams(), client = useQueryClient()
  const type: ImportType = params.get('type') === 'people' ? 'people' : 'companies', jobId = params.get('job') || '', historyView = params.get('view') === 'history'
  const [kind, setKind] = useState<'file' | 'odoo'>('file'), [source, setSource] = useState<SourceData | null>(null), [mapping, setMapping] = useState<Record<string, number>>({}), [mode, setMode] = useState<ImportMode>('upsert'), [stage, setStage] = useState(0)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [confirm, setConfirm] = useState(false)
  const [discarding, setDiscarding] = useState<{ id: string; filename: string } | null>(null)
  const [rechecking, setRechecking] = useState(false)
  const preparedJob = useRef('')
  const stop = useRef(false), key = ['contact-import', owner, jobId]
  useEffect(() => () => { stop.current = true }, [])
  const query = useQuery({ queryKey: key, queryFn: () => importsService.get(jobId), enabled: allowed && Boolean(jobId), retry: false })
  const history = useQuery({ queryKey: ['contact-import-history', owner], queryFn: () => importsService.history(), enabled: allowed && historyView, retry: false })
  const job = query.data, step = job ? job.status === 'completed' ? 3 : 2 : stage
  const putJob = (next: ImportJobMutation) => { client.setQueryData<ImportJob>(['contact-import', owner, next.id], (previous) => mergeImportJob(previous, next)); if (jobId !== next.id || type !== next.type || historyView) setParams((current) => { const p = new URLSearchParams(current); p.set('job', next.id); p.set('type', next.type); p.delete('view'); return p }, { replace: true }) }
  const reset = () => { preparedJob.current = ''; setParams({ type }); setSource(null); setMapping({}); setStage(0); setError('') }
  const preview = async () => {
    if (!source) return
    setBusy(true); setError('')
    try { const next = await importsService.preview({ headers: source.headers, rows: source.rows, namespace: source.namespace, filename: source.filename, source: kind, type, mapping, mode, key: crypto.randomUUID() }); preparedJob.current = next.id; putJob(next) }
    catch (e) { setError(e instanceof Error ? e.message : 'Simulation impossible.') } finally { setBusy(false) }
  }
  const discard = async () => {
    if (!discarding || busy) return
    setBusy(true); setError('')
    try {
      await importsService.discard(discarding.id)
      client.removeQueries({ queryKey: ['contact-import', owner, discarding.id], exact: true })
      await client.invalidateQueries({ queryKey: ['contact-import-history', owner] })
      setDiscarding(null)
      if (jobId === discarding.id) { reset(); if (historyView) setParams({ type, view: 'history' }) }
    } catch (e) { setError(e instanceof Error ? e.message : 'Suppression impossible.') } finally { setBusy(false) }
  }
  const recheck = async () => {
    if (!job || busy) return
    setBusy(true); setRechecking(true); setError('')
    try { putJob(await importsService.recheck(job.id)); await client.invalidateQueries({ queryKey: ['contact-import-history', owner] }) }
    catch (e) { setError(e instanceof Error ? e.message : 'Revérification impossible.') }
    finally { setBusy(false); setRechecking(false) }
  }
  const apply = async () => {
    if (!job) return
    setConfirm(false); setBusy(true); setError(''); stop.current = false
    try {
      let next = job
      do { next = await importsService.apply(next.id); putJob(next) } while (next.status === 'applying' && !stop.current)
      await client.invalidateQueries({ queryKey: ['contact-import-history', owner] }); await client.invalidateQueries({ queryKey: ['contacts'] })
    } catch (e) { setError(e instanceof Error ? e.message : 'Import interrompu. Retrouvez-le dans l’historique.'); await query.refetch() }
    finally { setBusy(false) }
  }
  if (!allowed) return <HEmptyState icon={ShieldCheck} title="Imports Contacts" description="Le droit Importer les contacts, la consultation et la modification des fiches sont nécessaires." />
  return <div className="imports-page">
    <HPageBreadcrumb items={[{ label: 'Paramètres', href: '/settings' }, { label: 'Imports' }]} />
    <HPageHeader title="Importer des contacts" description="Préparez vos sociétés et personnes, vérifiez les correspondances, puis confirmez l’import." actions={<><HButton asChild disabled={busy}><Link to={type === 'people' ? '/contacts/people' : '/contacts'}><ArrowLeft size={14} />Contacts</Link></HButton>{job && ['preview', 'blocked', 'applying'].includes(job.status) && <HButton size="icon" disabled={busy} aria-label="Supprimer la préparation" title="Supprimer la préparation" onClick={() => setDiscarding({ id: job.id, filename: job.filename })}><Trash2 size={14} /></HButton>}{job && <HButton disabled={busy} onClick={reset}><Plus size={14} />Nouvel import</HButton>}</>} />
    <HRecordTabs label="Imports Contacts" idPrefix="imports-view" value={historyView ? 'history' : 'assistant'} onChange={(v) => { if (busy) return; setParams((current) => { const next = new URLSearchParams(current); if (v === 'history') next.set('view', 'history'); else next.delete('view'); return next }) }} items={[{ value: 'assistant', label: 'Assistant', icon: FileSpreadsheet, panel: 'imports-assistant' }, { value: 'history', label: 'Mes imports', icon: History, panel: 'imports-history' }]} />
    {historyView ? <section id="imports-history" className="contact-panel"><HSectionHeading title="Mes imports" description="Les 30 derniers imports conservés dans votre liste. Retirez une préparation inutile ou reprenez un import interrompu depuis sa fiche." />{history.isPending && <p role="status">Chargement des imports…</p>}{history.error && <p role="alert">{history.error.message}</p>}{history.data?.length ? <HDataTable columnBorders data={history.data} columns={[{ id: 'date', header: 'Date', cell: ({ row }) => new Date(row.original.created).toLocaleString('fr-FR') }, { accessorKey: 'filename', header: 'Source' }, { id: 'type', header: 'Destination', cell: ({ row }) => row.original.type === 'companies' ? 'Sociétés' : 'Personnes' }, { id: 'status', header: 'État', cell: ({ row }) => <HBadge tone={row.original.status === 'completed' ? 'success' : 'neutral'}>{states[row.original.status] || row.original.status}</HBadge> }, { id: 'lines', header: 'Lignes', cell: ({ row }) => `${row.original.summary.applied}/${row.original.summary.total}` }, { id: 'actions', header: 'Actions', cell: ({ row }) => ['preview', 'blocked', 'applying'].includes(row.original.status) ? <HButton size="icon" variant="ghost" disabled={busy} aria-label={`Supprimer la préparation ${row.original.filename}`} title="Supprimer la préparation" onClick={(event) => { event.stopPropagation(); setDiscarding({ id: row.original.id, filename: row.original.filename }) }}><Trash2 size={14} /></HButton> : null }]} columnWidths={{ actions: 56 }} columnAlignments={{ actions: 'center' }} getRowAction={(r) => ({ label: `Ouvrir l’import ${r.filename}`, onClick: () => setParams({ type: r.type, job: r.id }) })} /> : history.data && <HEmptyState icon={History} title="Aucun import" description="Préparez votre premier fichier depuis l’assistant." />}</section> : <div id="imports-assistant">
      <HProgressSteps label="Étapes de l’import" steps={[{ id: 'source', label: 'Source', icon: FileSpreadsheet }, { id: 'mapping', label: 'Correspondance', icon: GitCompareArrows }, { id: 'review', label: 'Vérification', icon: ListChecks }, { id: 'result', label: 'Résultat', icon: CheckCircle2 }].map((item, index) => ({ ...item, state: index === step ? 'current' : index < step ? 'done' : 'pending' }))} />
      {query.isPending && jobId && <p role="status">Chargement de l’import…</p>}{query.error && <p role="alert">{query.error.message}</p>}
      {!job && !jobId && <>
        <div className="import-destination"><label>Destination<HCombobox label="Destination de l’import" value={type} required clearable={false} disabled={busy || step !== 0} showCodes={false} options={[{ value: 'companies', label: 'Sociétés' }, { value: 'people', label: 'Personnes' }]} onChange={(v) => { setParams({ type: v }); setSource(null); setMapping({}); setError('') }} /></label><p className="contact-muted">Commencez par les sociétés, puis rattachez leurs contacts.</p></div>
        {step === 0 && <ImportSource onBusy={setBusy} owner={owner} key={type} type={type} kind={kind} onKind={setKind} value={source} onChange={setSource} />}
        {step === 1 && source && <ImportMapping lockIdentity={kind === 'odoo'} owner={owner} type={type} source={source} mapping={mapping} mode={mode} onMapping={setMapping} onMode={setMode} />}
      </>}
      {job && <><div className="import-job-heading"><strong>{job.filename}</strong><HBadge tone={job.status === 'completed' ? 'success' : 'neutral'}>{states[job.status] || job.status}</HBadge>{job.status === 'applying' && <span role="status">{job.summary.applied}/{job.summary.total} lignes traitées</span>}</div><ImportReview job={job} busy={busy} onResolveBulk={async (filter, resolution) => { setBusy(true); try { putJob(await importsService.resolveBulk(job.id, filter, resolution)) } finally { setBusy(false) } }} onResolve={async (row, resolution, values) => { setBusy(true); try { putJob(await importsService.resolve(job.id, row, resolution, values)) } finally { setBusy(false) } }} /></>}
      {(error || job?.error) && <p role="alert" className="contact-error">{error || job?.error}</p>}
      <div className="import-actions">
        {!job && step === 1 && <HButton disabled={busy} onClick={() => setStage(0)}><ArrowLeft size={14} />Source</HButton>}
        {job && ['preview', 'blocked'].includes(job.status) && !busy && <HButton onClick={() => { setParams({ type }); setStage(source && preparedJob.current === job.id ? 1 : 0); if (preparedJob.current !== job.id) { setSource(null); setMapping({}) } setError('') }}>Revoir le mapping</HButton>}
        {!job && step === 0 && <HButton variant="primary" disabled={!source?.rows.length || busy} onClick={() => { if (source) { setMapping(suggestMapping(type, source.headers)); setStage(1); setError('') } }}>Continuer<ArrowRight size={14} /></HButton>}
        {!job && step === 1 && <HButton variant="primary" disabled={busy || !Object.keys(mapping).length} onClick={() => void preview()}><ListChecks size={14} />{busy ? 'Vérification…' : 'Vérifier les données'}</HButton>}
        {job && ['preview', 'blocked'].includes(job.status) && <HButton disabled={busy} onClick={() => void recheck()}><ListChecks size={14} />{rechecking ? 'Revérification…' : 'Revérifier la préparation'}</HButton>}
        {job && ['preview', 'applying'].includes(job.status) && !busy && <HButton variant="primary" disabled={job.summary.conflict + job.summary.error > 0} onClick={() => job.status === 'applying' ? void apply() : setConfirm(true)}><Play size={14} />{job.status === 'applying' ? 'Reprendre l’import' : 'Confirmer l’import'}</HButton>}
        {busy && job?.status === 'applying' && <HButton onClick={() => { stop.current = true }}><Pause size={14} />Mettre en pause après ce lot</HButton>}
        {job?.status === 'completed' && <HButton variant="primary" asChild><Link to={job.type === 'companies' ? '/contacts' : '/contacts/people'}>Voir les {job.type === 'companies' ? 'sociétés' : 'contacts'}<ArrowRight size={14} /></Link></HButton>}
      </div>
      {job?.status === 'blocked' && <p className="contact-muted">La revérification conserve vos corrections et vos choix, sans appliquer de données. Si l’import a déjà commencé, une nouvelle préparation contiendra uniquement les lignes restantes ; l’historique déjà importé sera conservé.</p>}
      {job && job.summary.conflict + job.summary.error > 0 && <p className="contact-muted">Résolvez ou ignorez les {job.summary.conflict + job.summary.error} ligne(s) signalée(s) pour pouvoir confirmer.</p>}
    </div>}
    <HDialog open={Boolean(discarding)} onOpenChange={(open) => { if (!open && !busy) setDiscarding(null) }} title="Supprimer la préparation" description="Cette préparation sera retirée de la liste et les lignes restantes ne seront plus importées. Si l’import a commencé, son historique et les fiches déjà importées seront conservés."><div className="dialog-form"><p>{discarding?.filename}</p>{error && <p role="alert">{error}</p>}<HDialogFooter><HButton disabled={busy} onClick={() => setDiscarding(null)}>Annuler</HButton><HButton variant="primary" disabled={busy} onClick={() => void discard()}><Trash2 size={14} />Supprimer la préparation</HButton></HDialogFooter></div></HDialog>
    <HDialog open={confirm} onOpenChange={setConfirm} title="Confirmer l’import" description="Seules les lignes vérifiées seront traitées. Les valeurs vides et les champs non associés conservent l’existant."><div className="dialog-form"><p>{job?.summary.create || 0} création(s) · {job?.summary.update || 0} mise(s) à jour · {job?.summary.skip || 0} ligne(s) ignorée(s).</p><HDialogFooter><HButton onClick={() => setConfirm(false)}>Annuler</HButton><HButton variant="primary" onClick={() => void apply()}>Importer maintenant</HButton></HDialogFooter></div></HDialog>
  </div>
}
