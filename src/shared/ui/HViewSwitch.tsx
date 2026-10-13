import type { LucideIcon } from 'lucide-react'
import { HButton } from './HButton'
export function HViewSwitch({ label, value, items, onChange }: { label: string; value: string; items: readonly { value: string; label: string; icon: LucideIcon; disabled?: boolean }[]; onChange: (value: string) => void }) {
  return <div className="contact-view-switch" role="group" aria-label={label}>{items.map(({ value: choice, label, icon: Icon, disabled }) => <HButton key={choice} aria-pressed={value === choice} disabled={disabled} onClick={() => onChange(choice)}><Icon size={14} />{label}</HButton>)}</div>
}
