import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HButton } from '../../../shared/ui/HButton'
import { timeService } from '../services/TimeService'
import { addDays, contexts, contextSchema, type TimeLine, type TimeChoices } from '../schemas/time'
export function TimeLineEditor({ line, choices, weekStart, onSave, onClose }: { line?: TimeLine | undefined; choices: TimeChoices; weekStart: string; onSave: (line: TimeLine) => void; onClose: () => void }) {
  const form = useForm({ defaultValues: { context: line?.context || 'affair', product: line?.product || '', analytic_account: line?.analytic_account || '', sales_order_line: line?.sales_order_line || '' } }), values = useWatch({ control: form.control }), [search, setSearch] = useState(''), [error, setError] = useState('')
  const accounts = useQuery({ queryKey: ['time', 'accounts', search], queryFn: () => timeService.accounts(search), enabled: values.context !== 'internal', retry: false })
  const sold = useQuery({ queryKey: ['time', 'sold', values.analytic_account, values.product], queryFn: () => timeService.sold(values.analytic_account!, values.product!), enabled: Boolean(values.analytic_account && values.product && values.context === 'affair'), retry: false })
  const activities = choices.activities.filter((a) => (!a.valid_from || a.valid_from <= addDays(weekStart, 6)) && (!a.valid_to || a.valid_to >= weekStart))
  const accountItems = (accounts.data || []).filter((a) => !a.internal && (values.context !== 'presales' || !a.parent)).map((a) => ({ value: a.id, label: a.label }))
  if (line && line.analytic_account === values.analytic_account && !accountItems.some((a) => a.value === line.analytic_account)) accountItems.push({ value: line.analytic_account, label: `${line.account_code} · ${line.account_label}` })
  return <HDialog open title={line ? 'Modifier la ligne de temps' : 'Ajouter une ligne de temps'} description="Choisissez une imputation et un service interne. Les heures se saisissent ensuite dans la semaine." onOpenChange={(open) => { if (!open) onClose() }}><form className="dialog-form" onSubmit={form.handleSubmit((input) => {
    if (input.context === 'internal') { input.analytic_account = choices.internal_account.id; input.sales_order_line = '' }
    const product = choices.activities.find((a) => a.id === input.product), account = accounts.data?.find((a) => a.id === input.analytic_account)
    if (!product || !input.analytic_account) { setError('Choisissez une activité et une imputation.'); return }
    onSave({ id: line?.id || `new:${crypto.randomUUID()}`, ...input, context: contextSchema.parse(input.context), product_label: product.label, product_code: product.code, account_label: input.context === 'internal' ? choices.internal_account.label : account?.label || line?.account_label || '', account_code: input.context === 'internal' ? choices.internal_account.code : account?.code || line?.account_code || '', days: line?.days || Array.from({ length: 7 }, () => ({ minutes: 0, description: '' })) })
  })}>
    <HSectionHeading title="Rattachement" /><div className="contact-fields"><label><HFieldLabel required>Imputation</HFieldLabel><HCombobox label="Type d’imputation" value={values.context || 'affair'} clearable={false} showCodes={false} options={Object.entries(contexts).map(([value, label]) => ({ value, label }))} onChange={(v) => { form.setValue('context', contextSchema.parse(v)); form.setValue('analytic_account', ''); form.setValue('sales_order_line', '') }} /></label>{values.context !== 'internal' && <label><HFieldLabel required>Affaire / commande</HFieldLabel><HCombobox label="Imputation analytique" required showCodes={false} value={values.analytic_account || ''} options={accountItems} onSearchChange={setSearch} onChange={(v) => { form.setValue('analytic_account', v); form.setValue('sales_order_line', '') }} />{accounts.isFetching && <small className="contact-muted">Recherche…</small>}</label>}</div>
    <HSectionHeading title="Activité" /><div className="contact-fields"><label className={values.context !== 'affair' ? 'contact-wide' : undefined}><HFieldLabel required>Service interne</HFieldLabel><HCombobox label="Activité BE" required showCodes={false} value={values.product || ''} options={activities.map((a) => ({ value: a.id, label: `${a.code} · ${a.label}` }))} onChange={(v) => { form.setValue('product', v); form.setValue('sales_order_line', '') }} /></label>{values.context === 'affair' && <label><HFieldLabel>Ligne de commande associée</HFieldLabel><HCombobox label="Service vendu" showCodes={false} value={values.sales_order_line || ''} options={(sold.data || []).map((a) => ({ value: a.id, label: a.label }))} onChange={(v) => form.setValue('sales_order_line', v)} /><small className="contact-muted">Facultatif · services du même produit sur la commande sélectionnée.</small></label>}</div>
    {values.context === 'internal' && <p className="contact-muted">Rattachement analytique automatique aux temps internes.</p>}
    {!activities.length && <p className="contact-muted">Aucun service BE ouvert pour cette semaine. Vérifiez la période des activités dans Paramètres → Planning et temps.</p>}
    {(error || values.context !== 'internal' && accounts.error || values.context === 'affair' && sold.error) && <p role="alert" className="field-error">{error || accounts.error?.message || sold.error?.message}</p>}
    <HDialogFooter><HButton onClick={onClose}>Annuler</HButton><HSaveButton hasChanges>{line ? 'Appliquer' : 'Ajouter la ligne'}</HSaveButton></HDialogFooter>
  </form></HDialog>
}
