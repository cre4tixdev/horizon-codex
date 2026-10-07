import type { ReactNode } from 'react'

/** Caption inside a native label; required state is declared by the form. */
export function HFieldLabel({ children, required = false }: { children: ReactNode; required?: boolean }) {
  return <span className="h-field-label">{children}{required && <span className="h-required-mark" aria-hidden="true" />}</span>
}
