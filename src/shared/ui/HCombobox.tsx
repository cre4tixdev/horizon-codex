import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Popover } from 'radix-ui'
export type ComboboxOption = { value: string; label: string; disabled?: boolean }
export function HCombobox({ id, label, value, options, onChange, onSearchChange, disabled, required, invalid, showCodes = true, emptyLabel = 'Non renseigné' }: { id?: string | undefined; label: string; value: string; options: ComboboxOption[]; onChange: (value: string) => void; onSearchChange?: (value: string) => void; disabled?: boolean | undefined; required?: boolean | undefined; invalid?: boolean | undefined; showCodes?: boolean; emptyLabel?: string }) {
  const listId = useId()
  const list = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [index, setIndex] = useState(0)
  const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const filtered = options.filter((option) => !option.disabled && normalize(`${option.label} ${showCodes ? option.value : ''}`).includes(normalize(search)))
  const choices = required ? filtered : [{ value: '', label: emptyLabel }, ...filtered]
  useEffect(() => { if (open) list.current?.querySelector('[data-highlighted=true]')?.scrollIntoView({ block: 'nearest' }) }, [open, index, search])
  function choose(next: string) { onChange(next); setOpen(false); setSearch(''); onSearchChange?.(''); setIndex(0) }
  return <Popover.Root open={open} onOpenChange={(next) => { setOpen(next); setSearch(''); onSearchChange?.(''); setIndex(0) }}>
    <Popover.Trigger asChild><button id={id} type="button" className="h-input h-combobox-trigger" role="combobox" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId} aria-invalid={invalid} disabled={disabled}><span className="h-combobox-value">{options.find((option) => option.value === value)?.label ?? (value || 'Choisir…')}</span><span className="h-combobox-chevron" aria-hidden="true"><ChevronDown size={15} /></span></button></Popover.Trigger>
    <Popover.Portal><Popover.Content className="h-combobox-menu" align="start" sideOffset={6} collisionPadding={12}>
      <div className="h-combobox-search"><Search size={14} aria-hidden="true" /><input className="h-input" aria-label={`Rechercher : ${label}`} placeholder="Rechercher…" role="combobox" aria-expanded="true" aria-controls={listId} aria-activedescendant={choices[index] ? `${listId}-${index}` : undefined} value={search} onChange={(event) => { setSearch(event.target.value); onSearchChange?.(event.target.value); setIndex(0) }} onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setIndex((current) => Math.max(0, Math.min(choices.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)))) } if (!search && event.key === 'Home') { event.preventDefault(); setIndex(0) } if (!search && event.key === 'End') { event.preventDefault(); setIndex(choices.length - 1) } if (event.key === 'Enter' && choices[index]) { event.preventDefault(); choose(choices[index].value) } }} /></div>
      <div ref={list} id={listId} role="listbox" aria-label={label}>{choices.map((option, i) => <button id={`${listId}-${i}`} key={option.value} type="button" role="option" aria-selected={value === option.value} data-highlighted={index === i} onMouseEnter={() => setIndex(i)} onClick={() => choose(option.value)}><span className="h-combobox-option-label">{option.label}</span>{showCodes && option.value && <small>{option.value}</small>}<span className="h-combobox-check" aria-hidden="true">{value === option.value && <Check size={14} />}</span></button>)}{choices.length === 0 && <p>Aucun résultat.</p>}</div>
    </Popover.Content></Popover.Portal>
  </Popover.Root>
}
