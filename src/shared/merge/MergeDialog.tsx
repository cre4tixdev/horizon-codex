import { HProgressSteps } from '../ui/HProgressSteps'
import { useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeftRight, Merge, ListChecks, GitCompareArrows, CheckCircle2 } from 'lucide-react'
import { HDialog } from '../ui/HDialog'
import { HDialogFooter } from '../ui/HDialogFooter'
import { HButton } from '../ui/HButton'
import { HCombobox } from '../ui/HCombobox'
import { HTableViewport } from '../ui/HTableViewport'
import { HSectionHeading } from '../ui/HSectionHeading'
import type { MergeAdapter, MergeIdentity, MergeKind, MergePreview } from './schema'
const imageFields = new Set(['logo', 'avatar', 'primary_image'])
export function MergeDialog({ kind, record, initialSource, adapter, renderImage, onClose, onMerged }: { kind: MergeKind; record: MergeIdentity; initialSource?: MergeIdentity | undefined; adapter: MergeAdapter; renderImage: (identity: MergeIdentity, filename: string) => ReactNode; onClose: () => void; onMerged: (id: string) => Promise<void> }) {
  const [search, setSearch] = useState('')
  const [other, setOther] = useState(initialSource?.id || '')
  const [reverse, setReverse] = useState(false)
  const [showIdentical, setShowIdentical] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [preview, setPreview] = useState<MergePreview>()
  const [choices, setChoices] = useState<Record<string, 'source' | 'target'>>({})
  const [selectedLabel, setSelectedLabel] = useState(initialSource?.label || '')
  const options = useQuery({ queryKey: ['merge-options', adapter.key, kind, search], queryFn: () => adapter.search(search), retry: false })
  const selection = { kind, source: reverse ? record.id : other, target: reverse ? other : record.id }
  const load = useMutation({ mutationFn: () => adapter.preview(selection), onSuccess: (data) => { setPreview(data); setChoices({}); setConfirmed(false) } })
  const apply = useMutation({ mutationFn: () => { if (!preview) throw new Error('Rechargez l’aperçu.'); return adapter.apply({ kind, source: preview.source.id, target: preview.target.id, fingerprint: preview.fingerprint, choices, confirmed: true }) }, onSuccess: async ({ id }) => { await onMerged(id) } })
  const busy = load.isPending || apply.isPending
  function reset() { setPreview(undefined); setConfirmed(false); load.reset(); apply.reset() }
  const name = record.label
  const candidates = (options.data || []).filter((item) => item.id !== record.id).map((item) => ({ value: item.id, label: [item.label, item.detail].filter(Boolean).join(' · ') }))
  if (other && !candidates.some((item) => item.value === other)) candidates.push({ value: other, label: selectedLabel })
  return <HDialog open className="record-merge-dialog" title={adapter.title} description="Comparez les deux fiches, choisissez les valeurs à conserver puis confirmez la fusion." onOpenChange={(open) => { if (!open && !busy) onClose() }}>
    <div className="dialog-form">
      <HProgressSteps label="Progression de la fusion" steps={[{ id: 'select', label: 'Sélection', icon: ListChecks, state: preview ? 'done' : 'current' }, { id: 'compare', label: 'Comparaison', icon: GitCompareArrows, state: preview ? confirmed ? 'done' : 'current' : 'pending' }, { id: 'confirm', label: 'Confirmation', icon: CheckCircle2, state: confirmed ? 'current' : 'pending' }]} />
      <label>Fusionner avec<HCombobox label="Fiche à fusionner" value={other} options={candidates} showCodes={false} required disabled={busy} onSearchChange={setSearch} onChange={(id) => { setOther(id); setSelectedLabel(candidates.find((item) => item.value === id)?.label || ''); reset() }} /></label>
      {options.error && <p role="alert" className="field-error">{options.error.message}</p>}
      <HSectionHeading title="Fiche à conserver" actions={<HButton disabled={!other || busy} onClick={() => { setReverse(!reverse); reset() }}><ArrowLeftRight size={15} />Inverser</HButton>} />
      <p>{reverse ? selectedLabel : name}</p>
      {!preview && <HButton disabled={!other || busy} onClick={() => load.mutate()}>{load.isPending ? 'Vérification…' : 'Comparer les fiches'}</HButton>}
      {load.error && <p role="alert" className="field-error">{load.error.message}</p>}
      {preview && <>
        <HSectionHeading title="Informations à conserver" />
        <label className="h-choice"><input type="checkbox" checked={showIdentical} onChange={(event) => setShowIdentical(event.target.checked)} />Afficher aussi les valeurs identiques</label>
        <HTableViewport className="settings-reference-table"><table className="reference-table"><thead><tr><th>Champ</th><th>Fiche conservée · {preview.target.label}</th><th>Autre fiche · {preview.source.label}</th></tr></thead><tbody>{preview.fields.filter((field) => (field.source || field.target) && (showIdentical || field.source !== field.target || imageFields.has(field.key))).map((field) => {
          const chosen = choices[field.key] || (field.target ? 'target' : 'source')
          return <tr key={field.key}><td>{adapter.labels[field.key] || field.key}</td>{(['target', 'source'] as const).map((side) => <td key={side}><label className="h-choice">{!field.readonly && <input type="radio" name={`merge-${field.key}`} aria-label={`${adapter.labels[field.key] || field.key} · ${side === 'target' ? 'Fiche conservée' : 'Autre fiche'}`} checked={chosen === side} disabled={busy} onChange={() => { setChoices({ ...choices, [field.key]: side }); setConfirmed(false) }} />}{imageFields.has(field.key) ? renderImage(preview[side], field[side]) : <span>{field[`${side}_label`] || field[side] || '—'}</span>}</label></td>)}</tr>
        })}</tbody></table></HTableViewport>
        <HSectionHeading title="Éléments réunis" />
        <p>{Object.entries(preview.counts).map(([key, value]) => `${value} ${adapter.countLabels[key] || key}`).join(' · ')}</p>
        <p className="contact-muted">{adapter.description}</p>
        {preview.blockers.map((message) => <p key={message} role="alert" className="field-error">{message}</p>)}
        {!preview.blockers.length && <label className="h-choice"><input type="checkbox" checked={confirmed} disabled={busy} onChange={(e) => setConfirmed(e.target.checked)} />Je confirme la fusion vers {preview.target.label}.</label>}
      </>}
      {apply.error && <p role="alert" className="field-error">{apply.error.message} <HButton disabled={busy} onClick={() => { reset(); load.mutate() }}>Recharger l’aperçu</HButton></p>}
      <HDialogFooter><HButton disabled={busy} onClick={onClose}>Annuler</HButton><HButton variant="primary" disabled={!preview || preview.blockers.length > 0 || !confirmed || busy || apply.isError} onClick={() => apply.mutate()}><Merge size={15} />{apply.isPending ? 'Fusion…' : 'Fusionner'}</HButton></HDialogFooter>
    </div>
  </HDialog>
}
