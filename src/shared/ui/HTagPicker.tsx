import { useState } from 'react'
import { Popover } from 'radix-ui'
import { Plus, X, Search } from 'lucide-react'
import { HTag } from './HTag'
import type { TagTone } from '../schemas/tagTone'
export function HTagPicker({ label, value, options, onChange, disabled, addLabel = 'Choisir les types…' }: { label: string; value: string[]; options: { value: string; label: string; tone: TagTone; color?: string | undefined; disabled?: boolean }[]; onChange: (ids: string[]) => void; disabled?: boolean; addLabel?: string }) {
  const [search, setSearch] = useState('')
  return <div className="h-tag-picker" role="group" aria-label={label}>
    {value.map((id) => { const option = options.find((item) => item.value === id); return <HTag key={id} color={option?.color} tone={option?.tone || 'blue'}>{option?.label || 'Référence indisponible'}{!disabled && <button type="button" aria-label={`Retirer ${option?.label || 'ce tag'}`} onClick={() => onChange(value.filter((item) => item !== id))}><X size={11} /></button>}</HTag> })}
    <Popover.Root onOpenChange={() => setSearch('')}><Popover.Trigger asChild><button type="button" className="h-tag-picker-add" disabled={disabled} aria-label={`Ajouter : ${label}`}><Plus size={12} />{value.length ? 'Ajouter' : addLabel}</button></Popover.Trigger><Popover.Portal><Popover.Content className="h-combobox-menu h-tag-picker-menu" align="start" sideOffset={6} collisionPadding={12} aria-label={label}>
      <div className="h-combobox-search"><Search size={14} /><input className="h-input" aria-label={`Rechercher : ${label}`} placeholder="Rechercher…" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
      <div>{options.filter((option) => (!option.disabled || value.includes(option.value)) && option.label.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'))).map((option) => <label className="h-tag-picker-option" key={option.value}><input type="checkbox" checked={value.includes(option.value)} disabled={option.disabled && !value.includes(option.value)} onChange={() => onChange(value.includes(option.value) ? value.filter((id) => id !== option.value) : [...value, option.value])} /><HTag color={option.color} tone={option.tone}>{option.label}</HTag></label>)}</div>
    </Popover.Content></Popover.Portal></Popover.Root>
  </div>
}
