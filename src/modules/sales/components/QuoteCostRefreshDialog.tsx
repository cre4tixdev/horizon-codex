import { useState } from 'react'
import { ArrowRight, ChartNoAxesCombined } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { UseFormReturn } from 'react-hook-form'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HButton } from '../../../shared/ui/HButton'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { formatAmount, formatUnitAmount } from '../../../shared/formatters/money'
import { salesService } from '../services/SalesService'
import { quoteLinesForSave } from '../services/quoteDefaults'
import type { CostRefreshInput, QuoteInput } from '../schemas/quotes'

export function QuoteCostRefreshDialog({ form, quoteId, updated, scope, onClose }: { form: UseFormReturn<QuoteInput>; quoteId?: string | undefined; updated?: string | undefined; scope: number | 'all'; onClose: () => void }) {
  const [base] = useState(() => { const input = structuredClone(form.getValues()); return { ...(quoteId ? { id: quoteId, updated } : {}), opportunity: input.opportunity, lines: quoteLinesForSave(input.lines), discount: input.discount, discount_mode: input.discount_mode, ...(scope === 'all' ? {} : { scope }) } })
  const kitName = scope !== 'all' && base.lines[scope]?.kit_key ? base.lines[scope]?.description : undefined
  const [mode, setMode] = useState<CostRefreshInput['mode']>('price'), [selected, setSelected] = useState<number[]>(), [showAll, setShowAll] = useState(false)
  const request = { ...base, mode, ...(selected === undefined ? {} : { selected }) }
  const query = useQuery({ queryKey: ['sales', 'cost-preview', request], queryFn: () => salesService.costPreview(request), retry: false, placeholderData: (previous) => previous, refetchOnWindowFocus: false })
  const data = query.data, selection = data?.selected || [], rows = data?.rows || [], busy = query.isFetching
  const apply = useMutation({ mutationFn: () => salesService.costPreview({ ...request, selected: selection, versions: Object.fromEntries(rows.filter((row) => selection.includes(row.index)).map((row) => [row.index, row.token])) }), onSuccess: (result) => {
    for (const index of result.lines.map((line, index) => result.selected.includes(index) || line.kit_key && result.lines.some((child, childIndex) => child.kit_parent === line.kit_key && result.selected.includes(childIndex)) ? index : -1).filter((index) => index >= 0)) {
      const line = result.lines[index]!
      form.setValue(`lines.${index}.price_source`, line.price_source, { shouldDirty: true })
      form.setValue(`lines.${index}.unit_cost`, line.unit_cost, { shouldDirty: true })
      form.setValue(`lines.${index}.unit_price`, line.unit_price, { shouldDirty: true })
      form.setValue(`lines.${index}.margin_percent`, line.margin_percent, { shouldDirty: true })
      form.setValue(`lines.${index}.cost_refresh`, line.cost_refresh, { shouldDirty: true })
    }
    onClose()
  } })
  const available = rows.filter((row) => row.changed && !row.reason), visible = showAll || !available.length ? rows : rows.filter((row) => row.changed || row.reason)
  const rate = (value: number) => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
  return <HDialog open title="Actualiser les coûts" description={data ? `${kitName ? `Composants du kit « ${kitName} » · ` : ''}${rows.filter((row) => row.changed).length} coût${rows.filter((row) => row.changed).length > 1 ? 's ont' : ' a'} changé sur ${rows.length} ligne${rows.length > 1 ? 's' : ''} produit.` : 'Comparer les coûts du devis aux tarifs actuels.'} className="quote-cost-dialog" onOpenChange={(open) => { if (!open && !apply.isPending) onClose() }}>
    <div className="dialog-form quote-cost-form" aria-busy={busy || apply.isPending}>
      <fieldset className="quote-cost-policy" disabled={apply.isPending}><legend>Prix de vente</legend><label className="h-choice"><input type="radio" name="cost-policy" value="price" checked={mode === 'price'} onChange={() => { setMode('price'); apply.reset() }} />Conserver les prix de vente</label><label className="h-choice" title="Marge sur coût : prix de vente = coût × (1 + marge / 100)"><input type="radio" name="cost-policy" value="margin" checked={mode === 'margin'} onChange={() => { setMode('margin'); apply.reset() }} />Conserver les taux de marge</label></fieldset>
      {(query.error || apply.error) && <p className="field-error" role="alert">{query.error?.message || apply.error?.message}<HButton size="small" disabled={busy || apply.isPending} onClick={() => { apply.reset(); void query.refetch() }}>Vérifier à nouveau</HButton></p>}
      {query.isPending && <HLoadingIndicator label="Comparaison des coûts" />}
      {data && <>
        <HDataTable data={visible} columnBorders columnWidths={{ selection: 40, old: '25%', next: '25%', delta: '15%' }} columnAlignments={{ old: 'right', next: 'right', delta: 'right' }} columns={[
          { id: 'selection', header: () => <input ref={(node) => { if (node) node.indeterminate = selection.length > 0 && !available.every((row) => selection.includes(row.index)) }} className="quote-cost-checkbox" type="checkbox" aria-label="Sélectionner tous les coûts actualisables" disabled={busy || apply.isPending || !available.length} checked={available.length > 0 && available.every((row) => selection.includes(row.index))} onChange={(event) => { setSelected(event.target.checked ? available.map((row) => row.index) : []); apply.reset() }} />, cell: ({ row }) => <input className="quote-cost-checkbox" type="checkbox" aria-label={`Actualiser la ligne ${row.original.index + 1}`} disabled={busy || apply.isPending || !row.original.changed || Boolean(row.original.reason)} checked={selection.includes(row.original.index)} onChange={(event) => { setSelected(event.target.checked ? [...selection, row.original.index] : selection.filter((index) => index !== row.original.index)); apply.reset() }} /> },
          { id: 'product', header: 'Produit', cell: ({ row }) => <><span>{row.original.index + 1} · {row.original.description}</span>{row.original.reason && <small className="field-error">{row.original.reason}</small>}</> },
          { id: 'old', header: 'Coût du devis', cell: ({ row }) => <>{formatUnitAmount(row.original.old_cost, data.currency)}<small className="quote-cost-hint" title={row.original.old_source || 'Source non renseignée'}>{row.original.old_source || 'Source non renseignée'}</small></> },
          { id: 'next', header: 'Coût actuel', cell: ({ row }) => <>{row.original.new_cost === null ? '—' : formatUnitAmount(row.original.new_cost, data.currency)}<small className="quote-cost-hint" title={row.original.source}>{row.original.source}</small></> },
          { id: 'delta', header: 'Écart', cell: ({ row }) => row.original.delta === null ? '—' : formatUnitAmount(row.original.delta, data.currency) },
        ]} />
        {rows.length > 0 && !available.length && <p className="contact-muted">Aucun coût différent disponible pour la source indiquée sous chaque coût.</p>}
        {!visible.length && <p className="contact-muted">Aucune ligne produit à comparer.</p>}
        {rows.length > visible.length ? <HButton size="small" variant="ghost" onClick={() => setShowAll(true)}>Afficher les {rows.length} lignes produit</HButton> : showAll && <HButton size="small" variant="ghost" onClick={() => setShowAll(false)}>Masquer les lignes inchangées</HButton>}
        <section className="quote-cost-impact" aria-label="Impact sur le devis">
          <HSectionHeading title="Impact sur le devis" icon={ChartNoAxesCombined} description="Hors options" actions={<span className="quote-cost-selection">{selection.length ? `${selection.length} ligne${selection.length > 1 ? 's' : ''} sélectionnée${selection.length > 1 ? 's' : ''}` : 'Aucune ligne sélectionnée'}</span>} />
          <dl>{[
            { label: 'Coût total', before: data.before.cost_total, after: data.after.cost_total, format: (value: number) => formatAmount(value, data.currency), unit: '' },
            { label: 'Marge sur coût', before: data.before.margin_percent, after: data.after.margin_percent, format: rate, unit: ' pt' },
            { label: 'Vente HT', before: data.before.subtotal, after: data.after.subtotal, format: (value: number) => formatAmount(value, data.currency), unit: '' },
          ].map((metric) => {
            const delta = Math.round((metric.after - metric.before) * 100) / 100
            return <div key={metric.label} data-changed={delta !== 0}>
              <dt>{metric.label}</dt>
              <dd><div className="quote-cost-values"><span aria-label={`Avant : ${metric.format(metric.before)}`}>{metric.format(metric.before)}</span><ArrowRight size={14} aria-hidden="true" /><strong aria-label={`Après : ${metric.format(metric.after)}`}>{metric.format(metric.after)}</strong></div><small>{delta === 0 ? 'Sans changement' : `${delta > 0 ? '+' : ''}${metric.unit ? `${delta.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}${metric.unit}` : metric.format(delta)}`}</small></dd>
            </div>
          })}</dl>
          {mode === 'price' && <p className="quote-cost-policy-note">Prix de vente conservés ; les taux de marge seront adaptés.</p>}
        </section>
      </>}
    </div>
    <HDialogFooter><HButton disabled={apply.isPending} onClick={onClose}>Annuler</HButton><HButton variant="primary" disabled={!selection.length || busy || Boolean(query.error) || apply.isPending} onClick={() => apply.mutate()}>{apply.isPending ? 'Application…' : `Appliquer à ${selection.length} ligne${selection.length > 1 ? 's' : ''}`}</HButton></HDialogFooter>
  </HDialog>
}
