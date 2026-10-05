import { HCombobox } from '../../../shared/ui/HCombobox'
import { HButton } from '../../../shared/ui/HButton'
import { useReferences } from '../../settings/hooks/useReferences'
import type { CatalogName } from '../../settings/types/references'
export function ReferencePicker({ catalog, label, value, onChange, id, disabled, invalid, required }: { catalog: CatalogName; label: string; value: string; onChange: (value: string) => void; id?: string | undefined; disabled?: boolean | undefined; invalid?: boolean; required?: boolean | undefined }) {
  const query = useReferences(catalog)
  return <div><HCombobox {...{ id, label, value, onChange, invalid, required }} disabled={disabled || query.isPending || Boolean(query.error)} options={(query.data ?? []).filter((item) => item.active || item.code === value).map((item) => ({ value: item.code, label: `${item.label}${!item.active ? ' (inactif)' : ''}`, disabled: !item.active }))} />{query.isPending && <small role="status">Chargement des choix…</small>}{query.error && <p className="field-error" role="alert">{query.error.message}<HButton size="small" onClick={() => { void query.refetch() }}>Réessayer</HButton></p>}</div>
}
