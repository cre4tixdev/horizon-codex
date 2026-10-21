import { useDeferredValue, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Archive, Copy, Eye, Pencil, Plus, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSettingsTable } from '../../../shared/ui/HSettingsTable'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { salesService } from '../services/SalesService'
import { emptyQuoteLine, type SalesSettings } from '../schemas/quotes'
import type { QuoteTemplate, QuoteTemplateInput } from '../schemas/quoteTemplates'
import { QuoteTemplateEditor } from './QuoteTemplateEditor'
import { QuoteTemplatePreview } from './QuoteTemplatePreview'
export function QuoteTemplatesSettings({ settings, editable }: { settings: SalesSettings; editable: boolean }) {
  const [search, setSearch] = useState(''), q = useDeferredValue(search), [page, setPage] = useState(1), [state, setState] = useState<'active' | 'archived'>('active')
  const [editor, setEditor] = useState<{ initial: QuoteTemplateInput; record?: QuoteTemplate }>(), [preview, setPreview] = useState<QuoteTemplate>()
  const query = useQuery({ queryKey: ['sales', 'templates', q, page, state], queryFn: () => salesService.templates({ q, page, state }), retry: false })
  const load = useMutation({ mutationFn: ({ id, action }: { id: string; action: 'edit' | 'copy' | 'preview' }) => salesService.template(id).then((record) => ({ record, action })), onSuccess: ({ record, action }) => {
    if (action === 'preview') setPreview(record)
    else setEditor({ initial: { ...record, label: action === 'copy' ? `${record.label.slice(0, 110)} · copie` : record.label }, ...(action === 'edit' ? { record } : {}) })
  } })
  const archive = useMutation({ mutationFn: (record: { id: string; updated: string; active: boolean }) => salesService.templateState(record.id, record.updated, !record.active), onSuccess: () => query.refetch() })
  return <section className="contact-panel"><HSectionHeading title="Modèles de devis" description="Contenu et règles de prix proposés à la création. La mise en page PDF reste dans Modèles de pièces." actions={editable && <HButton size="small" onClick={() => setEditor({ initial: { label: '', description: '', currency: 'EUR', content: { title: '', notes: '', validity_days: settings.validity_days, terms_id: settings.terms.find((term) => term.active && term.is_default)?.id || '', discount: 0, discount_mode: 'percent', lines: [emptyQuoteLine()] } } })}><Plus size={14} />Nouveau modèle</HButton>} />
    <div className="quote-template-toolbar"><HInput aria-label="Rechercher un modèle de devis" placeholder="Rechercher un modèle…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} />{editable && <HButton size="small" variant="ghost" aria-pressed={state === 'archived'} onClick={() => { setState(state === 'active' ? 'archived' : 'active'); setPage(1) }}><Archive size={14} />Archives</HButton>}</div>
    {(query.error || load.error || archive.error) && <p role="alert" className="field-error">{query.error?.message || load.error?.message || archive.error?.message}<HButton onClick={() => { load.reset(); archive.reset(); void query.refetch() }}>Réessayer</HButton></p>}
    {query.isPending ? <HLoadingIndicator label="Chargement des modèles" /> : <HSettingsTable count={query.data?.totalItems || 0} noun="modèle"><table className="reference-table"><thead><tr><th>Modèle</th><th>Description</th><th>Devise</th><th className="settings-actions-cell">Actions</th></tr></thead><tbody>{query.data?.items.map((record) => <tr key={record.id}><td>{record.label}</td><td>{record.description || '—'}</td><td>{record.currency}</td><td className="settings-actions-cell"><div><HButton size="icon" variant="ghost" aria-label={`Aperçu ${record.label}`} title="Aperçu" disabled={load.isPending} onClick={() => load.mutate({ id: record.id, action: 'preview' })}><Eye size={14} /></HButton>{editable && <><HButton size="icon" variant="ghost" aria-label={`Modifier ${record.label}`} title="Modifier" disabled={load.isPending} onClick={() => load.mutate({ id: record.id, action: 'edit' })}><Pencil size={14} /></HButton><HButton size="icon" variant="ghost" aria-label={`Dupliquer ${record.label}`} title="Dupliquer" disabled={load.isPending} onClick={() => load.mutate({ id: record.id, action: 'copy' })}><Copy size={14} /></HButton><HButton size="icon" variant="ghost" aria-label={`${record.active ? 'Archiver' : 'Restaurer'} ${record.label}`} title={record.active ? 'Archiver' : 'Restaurer'} disabled={archive.isPending} onClick={() => archive.mutate(record)}>{record.active ? <Archive size={14} /> : <RotateCcw size={14} />}</HButton></>}</div></td></tr>)}{!query.data?.items.length && <tr><td colSpan={4}>Aucun modèle {state === 'archived' ? 'archivé' : 'disponible'}.</td></tr>}</tbody></table></HSettingsTable>}
    {query.data && query.data.totalPages > 1 && <div className="record-navigator"><span>Page {page} / {query.data.totalPages}</span><HButton size="icon" aria-label="Modèles précédents" disabled={page <= 1 || query.isFetching} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></HButton><HButton size="icon" aria-label="Modèles suivants" disabled={page >= query.data.totalPages || query.isFetching} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></HButton></div>}
    {editor && <QuoteTemplateEditor initial={editor.initial} record={editor.record} settings={settings} onClose={() => setEditor(undefined)} />}
    {preview && <HDialog open title={preview.label} description={preview.description || 'Structure du modèle. Les coûts seront relus lors de son utilisation.'} className="quote-template-preview-dialog" onOpenChange={(open) => { if (!open) setPreview(undefined) }}><div className="dialog-form"><QuoteTemplatePreview lines={preview.content.lines} currency={preview.currency} /></div><HDialogFooter><HButton onClick={() => setPreview(undefined)}>Fermer</HButton></HDialogFooter></HDialog>}
  </section>
}
