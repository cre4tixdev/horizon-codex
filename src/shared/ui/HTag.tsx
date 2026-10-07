import type { CSSProperties, ReactNode } from 'react'
import type { TagTone } from '../schemas/tagTone'
export function HTag({ tone = 'blue', color, title, children }: { tone?: TagTone; color?: string | undefined; title?: string | undefined; children: ReactNode }) {
  return <span className="h-tag h-tone" data-tone={tone} title={title} style={color ? { '--tag-color': color } as CSSProperties : undefined}>{children}</span>
}
