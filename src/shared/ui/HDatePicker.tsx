import { useId, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'
import { Popover } from 'radix-ui'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../lib/cn'
import { HButton } from './HButton'
import { calendarMonth, civilDate, dateAllowed, dateString, monthDays, monthNames, moveCalendarFocus, shiftMonth, type DatePickerKind } from './datePicker'

type PickerProps = ComponentProps<'input'> & { type: DatePickerKind; calendarAnchor?: string | undefined }
/** Keep the real input/ref/ISO value and native form constraints; replace only its browser popup. */
export function HDatePicker({ ref, className, type, onChange, onKeyDown, disabled, readOnly, calendarAnchor, ...props }: PickerProps) {
  const input = useRef<HTMLInputElement>(null), [open, setOpen] = useState(false), [snapshot, setSnapshot] = useState({ value: '', baseValue: '' }), id = useId()
  const editable = !disabled && !readOnly
  function changeOpen(next: boolean) { if (next && (!editable || input.current?.matches(':disabled'))) return; if (next) setSnapshot({ value: input.current?.value || '', baseValue: String(props.defaultValue ?? input.current?.getAttribute('value') ?? '') }); setOpen(next) }
  function select(value: string) {
    const node = input.current
    if (!node || node.matches(':disabled') || node.readOnly) return
    // Bypass React's value tracker so both controlled forms and RHF receive the real input event.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(node, value)
    node.dispatchEvent(new Event('input', { bubbles: true }))
    node.dispatchEvent(new Event('change', { bubbles: true }))
    setOpen(false)
  }
  return <Popover.Root open={open && editable} onOpenChange={changeOpen}><Popover.Anchor asChild><span className="h-date-input" data-editable={editable} data-kind={type}>
    <input {...props} ref={(node) => { input.current = node; if (typeof ref === 'function') return ref(node); if (ref) ref.current = node }} type={type} lang={props.lang || 'fr-FR'} disabled={disabled} readOnly={readOnly} className={cn('h-input h-date-input-control', className)} onChange={onChange} onKeyDown={(event) => { onKeyDown?.(event); if (!event.defaultPrevented && editable && (event.altKey && event.key === 'ArrowDown' || event.key === 'F4')) { event.preventDefault(); changeOpen(true) } }} aria-haspopup={editable ? 'dialog' : undefined} aria-expanded={editable ? open : undefined} aria-controls={open ? id : undefined} />
    {editable && <Popover.Trigger aria-controls={id} asChild><button type="button" className="h-date-input-trigger" aria-label={props['aria-label'] ? `Choisir une date · ${props['aria-label']}` : type === 'month' ? 'Choisir un mois' : 'Choisir une date'} title={type === 'month' ? 'Choisir un mois' : 'Choisir une date'} disabled={disabled} tabIndex={-1}><CalendarDays size={15} aria-hidden="true" /></button></Popover.Trigger>}
    </span></Popover.Anchor><Popover.Portal><Popover.Content id={id} className="h-date-popover" align="start" sideOffset={5} collisionPadding={12} aria-label={type === 'month' ? 'Sélectionner un mois' : 'Sélectionner une date'} onCloseAutoFocus={(event) => { event.preventDefault(); input.current?.focus() }} onOpenAutoFocus={(event) => { event.preventDefault(); requestAnimationFrame(() => document.getElementById(id)?.querySelector<HTMLButtonElement>('[data-calendar-focus=true]')?.focus()) }}>
      {open && <DateCalendar type={type} calendarAnchor={calendarAnchor} value={snapshot.value} min={typeof props.min === 'string' ? props.min : ''} max={typeof props.max === 'string' ? props.max : ''} step={props.step} baseValue={snapshot.baseValue} required={props.required || false} onSelect={select} />}
    </Popover.Content></Popover.Portal>
  </Popover.Root>
}
function DateCalendar({ type, value, calendarAnchor, min, max, step, baseValue, required, onSelect }: { type: DatePickerKind; calendarAnchor?: string | undefined; value: string; min: string; max: string; step: ComponentProps<'input'>['step']; baseValue: string; required: boolean; onSelect: (value: string) => void }) {
  const today = dateString(new Date()), initial = (calendarAnchor && civilDate(calendarAnchor.slice(0, 10)) ? calendarAnchor : '') || value || (min && today < min ? min : max && today > max ? max : today)
  const [month, setMonth] = useState(() => calendarMonth(initial)), [focused, setFocused] = useState(initial.slice(0, 10)), [selected, setSelected] = useState(value.slice(0, 10)), [time, setTime] = useState(value.split('T')[1] || '00:00'), grid = useRef<HTMLDivElement>(null), pendingFocus = useRef('')
  const year = Number(month.slice(0, 4)), monthIndex = Number(month.slice(5, 7)) - 1, isMonth = type === 'month', days = monthDays(month)
  const allowed = (date: string) => dateAllowed(date, type, min, max, step, baseValue)
  const dayAllowed = (date: string) => type === 'datetime-local' ? (!min || date >= min.slice(0, 10)) && (!max || date <= max.slice(0, 10)) : allowed(date)
  const dateTime = selected ? `${selected}T${time}` : ''
  function navigate(delta: number) { const next = shiftMonth(month, isMonth ? delta * 12 : delta); if (Number(next.split('-')[0]) < 1 || Number(next.split('-')[0]) > 9999) return; setMonth(next) }
  useLayoutEffect(() => { if (pendingFocus.current) { grid.current?.querySelector<HTMLButtonElement>(`[data-date="${pendingFocus.current}"]`)?.focus(); pendingFocus.current = '' } }, [focused, month])
  function focusDate(date: string) { if (!civilDate(date)) return; const changesMonth = date.slice(0, 7) !== month; if (changesMonth) pendingFocus.current = date; else grid.current?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)?.focus(); setFocused(date); if (changesMonth) setMonth(date.slice(0, 7)) }
  function keyDate(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) return
    event.preventDefault(); focusDate(moveCalendarFocus(date, event.key, event.shiftKey))
  }
  function chooseDay(date: string) { if (!dayAllowed(date)) return; if (type === 'datetime-local') { setSelected(date); setFocused(date) } else onSelect(date) }
  const currentDay = civilDate(focused) && focused.slice(0, 7) === month ? focused : days.find((d) => d.slice(0, 7) === month && dayAllowed(d)) || `${month}-01`
  return <div className="h-date-calendar"><div className="h-date-calendar-heading"><HButton size="icon" variant="ghost" aria-label={isMonth ? 'Année précédente' : 'Mois précédent'} onClick={() => navigate(-1)}><ChevronLeft size={15} /></HButton><span>{isMonth ? 'Choisir un mois' : monthNames[monthIndex]}</span><input className="h-input h-date-year" key={year} aria-label="Année du calendrier" type="number" min={1} max={9999} defaultValue={year} onBlur={(event) => { const next = Number(event.target.value); if (Number.isInteger(next) && next >= 1 && next <= 9999) setMonth(`${String(next).padStart(4, '0')}-${month.slice(5, 7)}`); else event.target.value = String(year) }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur() } }} /><HButton size="icon" variant="ghost" aria-label={isMonth ? 'Année suivante' : 'Mois suivant'} onClick={() => navigate(1)}><ChevronRight size={15} /></HButton></div>
    {isMonth ? <div className="h-date-month-grid" role="group" aria-label={`Mois de ${year}`}>{monthNames.map((name, i) => { const date = `${month.slice(0, 4)}-${String(i + 1).padStart(2, '0')}`, valid = allowed(date); return <button type="button" key={name} data-calendar-focus={date === (value || month)} aria-pressed={date === value} aria-label={`${name} ${year}`} disabled={!valid} data-selected={date === value} onClick={() => onSelect(date)}>{name.slice(0, 3)}.</button> })}</div> : <div ref={grid} className="h-date-day-grid" role="grid" aria-label={`${monthNames[monthIndex]} ${year}`}>
      <div role="row" className="h-date-week">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => <span key={day} role="columnheader">{day}</span>)}</div>
      {Array.from({ length: days.length / 7 }, (_, week) => <div role="row" className="h-date-week" key={week}>{days.slice(week * 7, week * 7 + 7).map((date) => { if (!civilDate(date)) return <span key={date} aria-hidden="true" />; const valid = dayAllowed(date), active = type === 'datetime-local' ? selected === date : value === date; return <button type="button" role="gridcell" key={date} data-date={date} data-calendar-focus={currentDay === date} data-outside={date.slice(0, 7) !== month} data-today={date === today} aria-selected={active} aria-current={date === today ? 'date' : undefined} aria-disabled={!valid} aria-label={civilDate(date)!.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} tabIndex={currentDay === date ? 0 : -1} onFocus={() => setFocused(date)} onKeyDown={(event) => keyDate(event, date)} onClick={() => chooseDay(date)}>{Number(date.slice(8))}</button> })}</div>)}
    </div>}
    {type === 'datetime-local' && <div className="h-date-time"><label>Heure<input className="h-input" aria-label="Heure du rendez-vous" type="time" step={step} value={time} onChange={(event) => setTime(event.target.value)} /></label><HButton size="small" variant="primary" disabled={!selected || !time || !allowed(dateTime)} onClick={() => onSelect(dateTime)}>Appliquer</HButton></div>}
    <div className="h-date-calendar-footer"><HButton size="small" variant="ghost" disabled={isMonth ? !allowed(today.slice(0, 7)) : !dayAllowed(today)} onClick={() => isMonth ? onSelect(today.slice(0, 7)) : chooseDay(today)}>{isMonth ? 'Ce mois-ci' : 'Aujourd’hui'}</HButton>{!required && <HButton size="small" variant="ghost" disabled={!value} onClick={() => onSelect('')}>Effacer</HButton>}</div>
    {type === 'datetime-local' && selected && time && !allowed(dateTime) && <p className="h-date-constraint" role="status">Choisissez une heure dans la plage autorisée.</p>}
  </div>
}
