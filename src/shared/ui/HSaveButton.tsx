import type { ComponentProps } from 'react'
import { HButton } from './HButton'

/** Neutral while unchanged; highlighted only when there are changes to save. */
export function HSaveButton({ hasChanges, pending = false, disabled, ...props }: Omit<ComponentProps<typeof HButton>, 'variant' | 'asChild'> & { hasChanges: boolean; pending?: boolean }) {
  return <HButton {...props} type="submit" variant={hasChanges && !pending ? 'primary' : 'secondary'} disabled={disabled || pending || !hasChanges} />
}
