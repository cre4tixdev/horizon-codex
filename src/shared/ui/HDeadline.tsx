import { CalendarDays, Flag } from 'lucide-react'
import { displayDate } from '../time/zonedDate'
import { deadlineState } from '../time/deadline'

export function HDeadline({ value, timezone = 'Europe/Paris', label = 'Échéance', variant = 'badge' }: { variant?: 'badge' | 'text'; value: string; timezone?: string; label?: string }) {
  const state = deadlineState(value)
  const hint = state === 'past' ? 'Date passée' : state === 'urgent' ? 'Dans les prochaines 48 heures' : state === 'soon' ? 'Dans les prochains 7 jours' : ''
  return <span className={`h-deadline h-tone${variant === 'text' ? ' h-deadline--text' : ''}`} data-tone={state === 'soon' ? 'amber' : 'green'} data-state={state} title={[label, hint, timezone].filter(Boolean).join(' · ')}>
    {variant === 'badge' ? <><Flag size={13} aria-hidden="true" /><span>{label}</span></> : <CalendarDays size={13} aria-hidden="true" />}<time dateTime={value || undefined}>{value ? displayDate(value, timezone) : 'À définir'}</time>
  </span>
}
