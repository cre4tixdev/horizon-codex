import { Save } from 'lucide-react'
import type { ComponentProps } from 'react'
import { HButton } from './HButton'

/** Neutral while unchanged; highlighted only when there are changes to save. */
export function HSaveButton({ hasChanges, pending = false, disabled, children, size = 'small', ...props }: Omit<ComponentProps<typeof HButton>, 'variant' | 'asChild'> & { hasChanges: boolean; pending?: boolean }) {
  return <HButton {...props} type="submit" size={size} aria-busy={pending} variant={hasChanges && !pending ? 'primary' : 'secondary'} disabled={disabled || pending || !hasChanges}><Save size={14} aria-hidden="true" />{children ?? 'Enregistrer'}</HButton>
}
