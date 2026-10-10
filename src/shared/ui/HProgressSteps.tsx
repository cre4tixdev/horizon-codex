import type { CSSProperties } from 'react'
import { Check, type LucideIcon } from 'lucide-react'
import type { TagTone } from '../schemas/tagTone'

export type ProgressStep = { id: string; label: string; icon: LucideIcon; state: 'current' | 'done' | 'pending'; tone?: TagTone; color?: string | undefined }
export function HProgressSteps({ label, steps, className = '', preserveIcons = false }: { label: string; steps: ProgressStep[]; className?: string; preserveIcons?: boolean }) {
  return <nav className={`record-progress ${className}`} aria-label={label}><ol>{steps.map(({ id, label, icon: Icon, state, tone, color }) => <li key={id} className={tone ? 'h-tone' : undefined} data-tone={tone} data-state={state} aria-current={state === 'current' ? 'step' : undefined} style={tone ? { '--progress-color': color || 'var(--tag-color)' } as CSSProperties : undefined}><span>{state === 'done' && !preserveIcons ? <Check size={13} /> : <Icon size={13} />}</span><strong>{label}</strong></li>)}</ol></nav>
}
