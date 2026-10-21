import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HButton } from '../../../shared/ui/HButton'
import { HInput } from '../../../shared/ui/HInput'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { QuoteLines } from './QuoteLines'
import { salesService } from '../services/SalesService'
import { quoteLinesForSave } from '../services/quoteDefaults'
import { templateQuoteInput, quoteTemplateInputSchema, type QuoteTemplate, type QuoteTemplateInput } from '../schemas/quoteTemplates'
import type { SalesSettings } from '../schemas/quotes'
export function QuoteTemplateEditor({ initial, record, settings, onClose, onSaved }: { initial: QuoteTemplateInput; record?: QuoteTemplate | undefined; settings: SalesSettings; onClose: () => void; onSaved?: ((saved: QuoteTemplate) => void) | undefined }) {
  const id = useId(), [key] = useState(() => crypto.randomUUID()), client = useQueryClient()
  const form = useForm({ defaultValues: templateQuoteInput(initial.content) })
  const [label, setLabel] = useState(initial.label), [description, setDescription] = useState(initial.description), [currency, setCurrency] = useState(initial.currency), [days, setDays] = useState(initial.content.validity_days), [error, setError] = useState('')
  const save = useMutation({ mutationFn: async () => {
    const values = form.getValues()
    const parsed = quoteTemplateInputSchema.safeParse({ label, description, currency, content: { title: values.title, notes: values.notes, validity_days: days, discount: values.discount, discount_mode: values.discount_mode, terms_id: values.terms_id, lines: quoteLinesForSave(values.lines).map((line) => Object.fromEntries(Object.entries(line).filter(([field]) => !['id', 'cost_refresh'].includes(field)))) } })
    if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Vérifiez le modèle.')
    return salesService.saveTemplate(parsed.data, key, record?.id, record?.updated)
  }, onSuccess: async (saved) => { await client.invalidateQueries({ queryKey: ['sales', 'templates'] }); onSaved?.(saved); onClose() } })
  return <HDialog open title={record ? 'Modifier le modèle de devis' : 'Nouveau modèle de devis'} description="Structure et règles commerciales réutilisables. Les coûts catalogue seront relus à la création d’un devis." className="quote-template-editor" onOpenChange={(open) => { if (!open && !save.isPending) onClose() }}>
    <form id={id} className="dialog-form" onSubmit={(event) => { event.preventDefault(); setError(''); save.mutate() }}>
      <HSectionHeading title="Modèle" icon={FileText} actions={<HSaveButton hasChanges pending={save.isPending} form={id}>Enregistrer</HSaveButton>} />
      <fieldset className="access-fieldset" disabled={save.isPending}><div className="contact-fields">
        <label><HFieldLabel required>Nom du modèle</HFieldLabel><HInput required maxLength={120} value={label} onChange={(event) => setLabel(event.target.value)} /></label>
        <label>Devise<HCombobox label="Devise du modèle" clearable={false} value={currency} options={['EUR', 'USD', 'GBP', 'CAD', 'CHF'].map((code) => ({ value: code, label: code }))} onChange={(code) => { const value = quoteTemplateInputSchema.shape.currency.safeParse(code); if (value.success) setCurrency(value.data) }} /></label>
        <label>Titre proposé du devis<HInput maxLength={200} {...form.register('title')} /></label>
        <label><HFieldLabel required>Validité (jours)</HFieldLabel><HInput required type="number" min={1} max={365} value={days} onChange={(event) => setDays(Number(event.target.value))} /></label>
        <label>Description du modèle<textarea className="h-input" rows={2} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>Notes proposées<textarea className="h-input" rows={2} maxLength={10000} {...form.register('notes')} /></label>
      </div>
      <QuoteLines template form={form} settings={settings} editable={!save.isPending} currency={currency} taxRate={settings.default_tax_rate} />
      </fieldset>
      {(error || save.error) && <p className="field-error" role="alert">{error || save.error?.message}</p>}
    </form>
    <HDialogFooter><span className="contact-muted">Vérifiez les textes repris : aucun nom de client ou détail d’affaire ne doit rester dans un modèle partagé.</span><HButton disabled={save.isPending} onClick={onClose}>Fermer</HButton></HDialogFooter>
  </HDialog>
}
