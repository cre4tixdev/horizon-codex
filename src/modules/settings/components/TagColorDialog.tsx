import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HButton } from '../../../shared/ui/HButton'
import { HDialog } from '../../../shared/ui/HDialog'
import { HDialogFooter } from '../../../shared/ui/HDialogFooter'
import { HSaveButton } from '../../../shared/ui/HSaveButton'
import { HTag } from '../../../shared/ui/HTag'
import { HTonePicker } from '../../../shared/ui/HTonePicker'
import { referencesService } from '../services/ReferencesService'
import type { CatalogName, Reference } from '../types/references'

export function TagColorDialog({ record, onClose, catalog }: { catalog: CatalogName; record: Reference; onClose: () => void }) {
  const [tone, setTone] = useState(record.tone || 'blue')
  const [color, setColor] = useState(record.color || '')
  const client = useQueryClient()
  const dirty = tone !== (record.tone || 'blue') || color !== (record.color || '')
  const save = useMutation({ mutationFn: () => referencesService.save(catalog, { ...record, tone, color }, record.id), onSuccess: async () => { await client.invalidateQueries({ queryKey: ['references', catalog] }); onClose() } })
  return <HDialog open onOpenChange={(open) => { if (!open && !save.isPending) onClose() }} title={`Couleur · ${record.label}`} description="Choisissez une teinte Horizon ou une couleur personnalisée.">
    <div className="contact-panel"><HTonePicker label="Couleur du tag" value={tone} color={color} onChange={(next) => { setTone(next); setColor('') }} onColorChange={setColor} disabled={save.isPending} /><HSectionHeading title="Aperçu" /><HTag tone={tone} color={color}>{record.label}</HTag>{save.error && <p role="alert" className="field-error">{save.error.message}</p>}</div>
    <HDialogFooter><HButton onClick={onClose} disabled={save.isPending}>Annuler</HButton><HSaveButton hasChanges={dirty} pending={save.isPending} onClick={() => { if (dirty && !save.isPending) save.mutate() }}>Enregistrer</HSaveButton></HDialogFooter>
  </HDialog>
}
