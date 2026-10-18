import { ImportImage } from './ImportImage'
import { ImportDetail } from './ImportDetail'
import { useState } from 'react'
import { Download, Eye, List, Plus, Pencil, AlertTriangle, Ban, CheckCircle2 } from 'lucide-react'
import { HRecordTabs } from '../../../shared/ui/HRecordTabs'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HListPagination } from '../../../shared/ui/HListPagination'
import { HBadge } from '../../../shared/ui/HBadge'
import { HButton } from '../../../shared/ui/HButton'
import { ImportDecision } from './ImportDecision'
import { actionLabels, type ImportJob, type ImportRow } from '../schemas/imports'
import { downloadImportReport } from '../services/report'
const identity = (row: ImportRow) => String(row.data.name || [row.data.first_name, row.data.last_name].filter(Boolean).join(' ') || `Ligne ${row.number}`)
export function ImportReview({ job, busy, onResolve, onResolveBulk }: { job: ImportJob; busy: boolean; onResolveBulk: (filter: string, resolution: '' | 'skip') => Promise<void>; onResolve: (row: string, resolution: string, values?: Record<string, string>) => Promise<void> }) {
  const [filter, setFilter] = useState('all'), [page, setPage] = useState(1), [detail, setDetail] = useState('')
  const selected = job.rows.find((row) => row.id === detail)
  const rows = job.rows.filter((row) => filter === 'all' || row.action === filter || row.status === filter)
  const totalPages = Math.max(1, Math.ceil(rows.length / 25)), currentPage = Math.min(page, totalPages)
  const [actionError, setActionError] = useState('')
  const [pending, setPending] = useState<{ id: string; resolution: string } | null>(null)
  const resolutionFor = (row: ImportRow) => pending?.id === row.id ? pending.resolution : row.resolution
  const decide = async (row: ImportRow, resolution: string) => { if (busy || pending) return; setActionError(''); setPending({ id: row.id, resolution }); try { await onResolve(row.id, resolution) } catch (e) { setActionError(e instanceof Error ? e.message : 'Résolution impossible.') } finally { setPending(null) } }
  const bulk = async (resolution: '' | 'skip') => { if (busy) return; setActionError(''); try { await onResolveBulk(filter, resolution) } catch (e) { setActionError(e instanceof Error ? e.message : 'Décision groupée impossible.') } }
  const tabs = [{ value: 'all', label: 'Toutes', icon: List, count: job.summary.total }, { value: 'create', label: 'Créations', icon: Plus, count: job.summary.create }, { value: 'update', label: 'Mises à jour', icon: Pencil, count: job.summary.update }, { value: 'conflict', label: 'À résoudre', icon: AlertTriangle, count: job.summary.conflict }, { value: 'error', label: 'Erreurs', icon: AlertTriangle, count: job.summary.error }, { value: 'skip', label: 'Ignorées', icon: Ban, count: job.summary.skip }]

  return <section className="contact-panel">
    <HSectionHeading title={job.status === 'completed' ? 'Résultat de l’import' : 'Vérification des lignes'} actions={<><HListPagination placement="inline" page={currentPage} totalPages={totalPages} label="Pagination des lignes d’import" busy={busy} onPageChange={setPage} /><HButton size="small" onClick={() => downloadImportReport(job)}><Download size={14} />Rapport CSV</HButton></>} count={job.summary.total} description={job.status === 'completed' ? `${job.summary.create} création(s), ${job.summary.update} mise(s) à jour, ${job.summary.skip} ligne(s) ignorée(s).` : 'Les fiches ne seront modifiées qu’après votre confirmation. Choisissez les actions directement dans le tableau. La loupe permet de comparer ou corriger les valeurs. 25 lignes par page.'} />
    <HRecordTabs label="Résultats de la simulation" idPrefix="import-results" value={filter} onChange={(v) => { setFilter(v); setPage(1) }} items={tabs.map((tab) => ({ ...tab, panel: 'import-results' }))} actions={job.status === 'preview' && <><HButton size="small" disabled={busy || !rows.length} onClick={() => void bulk('skip')}><Ban size={14} />Tout ignorer ({rows.length})</HButton><HButton size="small" disabled={busy || !rows.length} onClick={() => void bulk('')}>Tout en automatique ({rows.length})</HButton></>} />
    {actionError && <p role="alert" className="contact-error">{actionError}</p>}
    <div id="import-results">
    {rows.length ? <HDataTable columnBorders data={rows.slice((currentPage - 1) * 25, currentPage * 25)} columns={[
      { id: 'position', header: '#', cell: ({ row }) => row.original.number },
      { id: 'identity', header: job.type === 'companies' ? 'Société' : 'Contact', cell: ({ row }) => <span className="import-cell" title={identity(row.original)}>{identity(row.original)}</span> },
      { id: 'image', header: 'Image', cell: ({ row }) => <ImportImage compact value={String(row.original.data.image_base64 || '')} /> },
      ...(job.type === 'people' ? [{ id: 'company', header: 'Société de rattachement', cell: ({ row }: { row: { original: ImportRow } }) => <span className="import-cell" title={String(row.original.data.company_label || row.original.data.company_name || '')}>{row.original.data.company_label || row.original.data.company_name || 'Sans société'}{row.original.data.company_external_id ? ` · Réf. ${row.original.data.company_external_id}` : ''}</span> }] : []),
      { id: 'email', header: 'E-mail', cell: ({ row }) => <span className="import-cell">{row.original.data.email || '—'}</span> },
      { id: 'action', header: 'Résultat', cell: ({ row }) => <HBadge tone={['error', 'conflict'].includes(row.original.status) ? 'warning' : row.original.action === 'create' ? 'success' : row.original.action === 'update' ? 'info' : 'neutral'}>{row.original.status === 'applied' ? ({ create: 'Créée', update: 'Modifiée', skip: 'Ignorée' }[row.original.action] || 'Traitée') : actionLabels[row.original.status] || row.original.status}</HBadge> },
      { id: 'match', header: 'Contrôle', cell: ({ row }) => <span className="import-cell" title={row.original.error || row.original.match}>{row.original.error || row.original.match || '—'}</span> },
      { id: 'actions', header: 'Actions', cell: ({ row: { original: line } }) => <div className="import-row-actions">
        {job.status === 'preview' && <ImportDecision row={line} resolution={resolutionFor(line)} disabled={busy || Boolean(pending)} onChange={(v) => void decide(line, v)} />}

      </div> },
      { id: 'inspect', header: 'Voir', cell: ({ row: { original: line } }) => <HButton size="icon" variant="ghost" aria-label={`Examiner la ligne ${line.number}`} disabled={busy} onClick={() => setDetail(line.id)}>{line.status === 'applied' ? <CheckCircle2 size={15} /> : <Eye size={15} />}</HButton> },
    ]} columnWidths={{ position: 45, image: 52, identity: '25%', actions: 210, inspect: 48 }} columnAlignments={{ position: 'center', image: 'center', actions: 'center', inspect: 'center' }} /> : <p className="contact-muted">Aucune ligne dans cette catégorie.</p>}<div className="import-actions"><HListPagination placement="inline" page={currentPage} totalPages={totalPages} label="Pagination des lignes d’import en bas du tableau" busy={busy} onPageChange={setPage} /></div></div>
    {selected && <ImportDetail key={selected.id} job={job} row={selected} rows={rows.some((item) => item.id === selected.id) ? rows : [selected, ...rows]} busy={busy} onResolve={onResolve} onClose={() => setDetail('')} onChangeRow={(id) => { setDetail(id); const index = rows.findIndex((row) => row.id === id); if (index >= 0) setPage(Math.floor(index / 25) + 1) }} />}
  </section>
}
