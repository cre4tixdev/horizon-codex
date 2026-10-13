import type { ReactNode } from 'react'
/** A trailing action shares the input border, like the record combobox opener. */
export function HInputWithAction({ children, action, label, disabled, highlighted = false, onAction }: { children: ReactNode; action: ReactNode; label: string; disabled?: boolean; highlighted?: boolean; onAction: () => void }) {
  return <div className="h-input-with-action">{children}<button type="button" className="h-combobox-inspect" data-highlighted={highlighted} aria-label={label} title={label} disabled={disabled} onClick={onAction}>{action}</button></div>
}
