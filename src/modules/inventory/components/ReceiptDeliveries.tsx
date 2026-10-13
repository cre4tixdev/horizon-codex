import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Truck } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HCombobox } from '../../../shared/ui/HCombobox'
import { HFieldLabel } from '../../../shared/ui/HFieldLabel'
import { HButton } from '../../../shared/ui/HButton'
import { operationsService } from '../services/OperationsService'
import type { Operation } from '../schemas/operations'
export function ReceiptDeliveries({ record, canWrite, onSaved }: { record: Operation; canWrite: boolean; onSaved: (record: Operation) => Promise<void> }) {
  const [selected, setSelected] = useState<Record<string, string>>({})
  const matches = record.delivery_candidates.flatMap((candidate) => {
    const target = candidate.options.find((item) => item.sales_line === selected[`${candidate.line_id}/${candidate.analytic_account}`])
    return target ? [{ line_id: candidate.line_id, analytic_account: candidate.analytic_account, sales_quote: target.sales_quote, sales_line: target.sales_line }] : []
  })
  const prepare = useMutation({ mutationFn: () => operationsService.prepareReceiptDeliveries(record.id, record.updated, matches), onSuccess: onSaved })
  if (!record.delivery_candidates.length) return null
  return <section className="contact-panel"><HSectionHeading title="Livraisons à affecter" icon={Truck} description="Plusieurs commandes peuvent correspondre à cette réception. Choisissez la ligne à livrer." actions={canWrite && <HButton size="small" disabled={!matches.length || prepare.isPending} onClick={() => prepare.mutate()}><Truck size={14} />Préparer les BL</HButton>} />
    <div className="stock-operation-fields">{record.delivery_candidates.map((candidate) => {
      const key = `${candidate.line_id}/${candidate.analytic_account}`
      return <label key={key}><HFieldLabel>{candidate.label}</HFieldLabel>{candidate.options.length ? <HCombobox showCodes={false} label={`Commande à livrer · ${candidate.label}`} value={selected[key] || ''} options={candidate.options.map((item) => ({ value: item.sales_line, label: item.label }))} disabled={!canWrite || prepare.isPending} onChange={(value) => setSelected((current) => ({ ...current, [key]: value }))} /> : <span className="contact-muted">Aucune ligne de commande confirmée correspondante. Préparez le BL depuis la commande concernée.</span>}</label>
    })}</div>{prepare.error && <p role="alert" className="field-error">{prepare.error.message}</p>}
  </section>
}
