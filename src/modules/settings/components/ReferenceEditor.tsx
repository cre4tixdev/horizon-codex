import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HButton } from '../../../shared/ui/HButton'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HInput } from '../../../shared/ui/HInput'
import { referencesService } from '../services/ReferencesService'
import type { CatalogName, Reference, ReferenceInput } from '../types/references'
export function ReferenceEditor({ catalog, record, onClose }: { catalog: CatalogName; record?: Reference; onClose: () => void }) {
  const client = useQueryClient()
  const [initial] = useState<ReferenceInput>(record ?? { code: '', label: '', active: true, sort_order: 0, ...(catalog === 'accounting_currencies' ? { minor_unit_digits: 2 } : {}) })
  const [input, setInput] = useState(initial)
  const hasChanges = input.code !== initial.code || input.label !== initial.label || input.active !== initial.active || input.sort_order !== initial.sort_order || input.minor_unit_digits !== initial.minor_unit_digits
  const save = useMutation({ mutationFn: () => referencesService.save(catalog, input, record?.id), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['references', catalog] }); onClose() } })
  return <form className="contact-card contact-form-grid" onSubmit={(event) => { event.preventDefault(); if (hasChanges && !save.isPending) save.mutate() }}><label>Code<HInput required disabled={Boolean(record) || save.isPending} value={input.code} onChange={(event) => setInput({ ...input, code: event.target.value })} /></label><label>Libellé<HInput required value={input.label} onChange={(event) => setInput({ ...input, label: event.target.value })} /></label><label>Ordre<HInput required type="number" min="0" value={input.sort_order} onChange={(event) => setInput({ ...input, sort_order: Number(event.target.value) })} /></label>{catalog === 'accounting_currencies' && <label>Décimales<HInput required type="number" min="0" max="4" value={input.minor_unit_digits ?? 2} onChange={(event) => setInput({ ...input, minor_unit_digits: Number(event.target.value) })} /></label>}<label><input type="checkbox" checked={input.active} onChange={(event) => setInput({ ...input, active: event.target.checked })} /> Actif</label>{save.error && <p role="alert" className="field-error">{save.error.message}</p>}<div className="contact-form-actions"><HSaveButton hasChanges={hasChanges} pending={save.isPending}>Enregistrer</HSaveButton><HButton onClick={onClose} disabled={save.isPending}>Annuler</HButton></div></form>
}
