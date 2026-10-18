import { HCombobox } from '../../../shared/ui/HCombobox'
import type { ImportRow } from '../schemas/imports'
export function ImportDecision({ row, resolution = row.resolution, disabled, onChange }: { row: ImportRow; resolution?: string; disabled: boolean; onChange: (value: string) => void }) {
  return <HCombobox label={`Action pour la ligne ${row.number}`} showCodes={false} required clearable={false} value={resolution} disabled={disabled} options={[
    { value: '', label: 'Règle automatique', displayLabel: row.status === 'conflict' ? 'Choisir une action…' : row.status === 'error' ? 'À corriger' : row.action === 'update' ? 'Mettre à jour' : row.action === 'create' ? 'Créer' : 'Ignorer (automatique)' },
    { value: 'skip', label: 'Ignorer' },
    ...(row.status === 'conflict' || row.resolution === 'create' ? [{ value: 'create', label: 'Créer une fiche distincte' }] : []),
    ...row.candidates.map((c) => ({ value: `target:${c.id}`, label: `Utiliser : ${c.label}` })),
    ...(row.resolution.startsWith('target:') && !row.candidates.some((c) => `target:${c.id}` === row.resolution) ? [{ value: row.resolution, label: `Utiliser : ${String(row.before.name || [row.before.first_name, row.before.last_name].filter(Boolean).join(' ') || row.data.name || [row.data.first_name, row.data.last_name].filter(Boolean).join(' '))}` }] : []),
  ]} onChange={onChange} />
}
