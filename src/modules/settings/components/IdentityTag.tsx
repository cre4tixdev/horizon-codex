import type { ReactNode } from 'react'
import { HTag } from '../../../shared/ui/HTag'
import { useIdentityTagStyle, type IdentityTagKind } from '../hooks/useIdentityTagStyle'

export function IdentityTag({ kind, children }: { kind: IdentityTagKind; children: ReactNode }) {
  const style = useIdentityTagStyle()
  return <HTag {...style(kind)}>{children}</HTag>
}
