import type { CSSProperties } from 'react'
import { HInput } from '../../../shared/ui/HInput'
export function OpacityControl({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  return <label className="studio-opacity"><span>{label}</span><div><input style={{ '--opacity-progress': `${Math.round(value * 100)}%` } as CSSProperties} type="range" min={0} max={100} value={Math.round(value * 100)} aria-label={label} onChange={(event) => onChange(Number(event.target.value) / 100)} /><HInput type="number" min={0} max={100} aria-label={`${label} (%)`} value={Math.round(value * 100)} onChange={(event) => onChange(Math.max(0, Math.min(100, Number(event.target.value))) / 100)} /><span>%</span></div></label>
}
