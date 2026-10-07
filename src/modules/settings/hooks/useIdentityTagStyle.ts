import type { TagTone } from '../../../shared/schemas/tagTone'
import { useReferences } from './useReferences'

const defaults = { admin: 'navy', superuser: 'violet', user: 'blue', viewer: 'blue', direction: 'navy', manager: 'violet', collaborator: 'blue' } as const satisfies Record<string, TagTone>
export type IdentityTagKind = keyof typeof defaults

export function useIdentityTagStyle() {
  const query = useReferences('settings_identity_tags')
  return (kind: IdentityTagKind) => {
    const tag = query.data?.find((item) => item.code === kind)
    return { tone: tag?.tone || defaults[kind], color: tag?.color, title: query.error ? 'Couleur par défaut : réglages indisponibles.' : undefined }
  }
}
