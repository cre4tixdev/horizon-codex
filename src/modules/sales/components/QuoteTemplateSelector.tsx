import { useDeferredValue, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { displayDate } from '../../../shared/time/zonedDate'
import { formatAmount } from '../../../shared/formatters/money'
import { salesService } from '../services/SalesService'
import type { QuoteTemplatePreview as Preview } from '../schemas/quoteTemplates'
import { QuoteTemplatePreview } from './QuoteTemplatePreview'
export function QuoteTemplateSelector({ opportunity, date, disabled, onApply }: { opportunity: string; date: string; disabled: boolean; onApply: (input: Preview['input']) => void }) {
  const [search, setSearch] = useState(''), q = useDeferredValue(search), [choosing, setChoosing] = useState(''), [applied, setApplied] = useState<{ id: string; label: string }>()
  const query = useQuery({ queryKey: ['sales', 'templates', 'choices', q], queryFn: () => salesService.templates({ q, page: 1, state: 'active' }), enabled: !disabled && Boolean(opportunity), retry: false })
  const options = [...(!applied ? [{ value: '', label: 'Devis vierge', description: '' }] : []), ...(query.data?.items || []).map((record) => ({ value: record.id, label: record.label, description: record.description }))]
  if (applied && !options.some((option) => option.value === applied.id)) options.push({ value: applied.id, label: applied.label, description: '' })
  return <div className="h-form-field quote-template-selector"><HFieldLabel>Modèle de devis</HFieldLabel><HCombobox label="Modèle de devis" required showCodes={false} value={applied?.id || ''} emptyLabel="Devis vierge" clearable={false} disabled={disabled || !opportunity} options={options} onSearchChange={setSearch} onChange={(id) => { if (id) setChoosing(id) }} />
    {!opportunity && <small className="contact-muted">Choisissez d’abord l’opportunité.</small>}
    {query.error && <span role="alert" className="field-error">{query.error.message}<HButton size="small" onClick={() => void query.refetch()}>Réessayer</HButton></span>}
    {choosing && <TemplateUseDialog id={choosing} opportunity={opportunity} quote_date={date} onClose={() => setChoosing('')} onApply={(result) => { onApply(result.input); setApplied({ id: result.template.id, label: result.template.label }); setChoosing('') }} />}
  </div>
}
function TemplateUseDialog({ id, opportunity, quote_date, onClose, onApply }: { id: string; opportunity: string; quote_date: string; onClose: () => void; onApply: (preview: Preview) => void }) {
  const query = useQuery({ queryKey: ['sales', 'template-preview', id, opportunity, quote_date], queryFn: () => salesService.templatePreview({ id, opportunity, quote_date }), retry: false, refetchOnWindowFocus: false })
  const apply = useMutation({ mutationFn: () => salesService.templatePreview({ id, opportunity, quote_date, token: query.data!.token }), onSuccess: (result) => { if (!result.issues.length) onApply(result) } })
  const data = query.data
  return <HDialog open title={data ? data.template.label : 'Aperçu du modèle'} description="Les lignes, notes, remises et conditions du modèle remplaceront le contenu actuel. Le client, le contact et le commercial sont conservés." className="quote-template-preview-dialog" onOpenChange={(open) => { if (!open && !apply.isPending) onClose() }}><div className="dialog-form" aria-busy={query.isFetching || apply.isPending}>
    {query.isPending && <HLoadingIndicator label="Vérification du modèle et des tarifs" />}
    {(query.error || apply.error) && <p className="field-error" role="alert">{query.error?.message || apply.error?.message}<HButton size="small" onClick={() => { apply.reset(); void query.refetch() }}>Vérifier à nouveau</HButton></p>}
    {data && <>{data.template.description && <p className="contact-muted">{data.template.description}</p>}<dl className="quote-template-preview-meta"><div><dt>Titre proposé</dt><dd>{data.input.title || 'Titre de l’opportunité'}</dd></div><div><dt>Valable jusqu’au</dt><dd>{displayDate(data.input.valid_until)}</dd></div><div><dt>Conditions de vente</dt><dd>{data.terms_label || 'Sans conditions'}</dd></div></dl><QuoteTemplatePreview lines={data.input.lines} currency={data.template.currency} issues={data.issues} />{data.issues.filter((issue) => !issue.line).map((issue) => <p role="alert" className="field-error" key={issue.message}>{issue.message}</p>)}<div className="sales-quote-totals"><span>Total HT · hors options</span><strong>{formatAmount(data.subtotal, data.template.currency)}</strong></div>{Boolean(data.options_total) && <p className="contact-muted">Options : {formatAmount(data.options_total, data.template.currency)}</p>}{data.input.notes && <p className="quote-template-notes">{data.input.notes}</p>}{data.issues.length > 0 && <p role="alert" className="field-error">Corrigez les éléments signalés dans le catalogue ou le modèle avant de l’utiliser.</p>}</>}
    </div><HDialogFooter><HButton disabled={apply.isPending} onClick={onClose}>Annuler</HButton><HButton variant="primary" disabled={!data || Boolean(data.issues.length) || query.isFetching || Boolean(query.error) || apply.isPending} onClick={() => apply.mutate()}><FileText size={14} />{apply.isPending ? 'Vérification…' : 'Utiliser ce modèle'}</HButton></HDialogFooter></HDialog>
}
