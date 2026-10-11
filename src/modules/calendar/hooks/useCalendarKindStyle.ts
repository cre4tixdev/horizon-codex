import type { CSSProperties } from 'react'
import type { TagTone } from '../../../shared/schemas/tagTone'
import { useReferences } from '../../settings/hooks/useReferences'
import type { CalendarEvent } from '../schemas/events'

const tones = { publication: 'green', submission: 'pink', visit: 'blue', hearing: 'violet', result: 'amber', inventory: 'navy', event: 'violet' } as const satisfies Record<CalendarEvent['kind'], TagTone>

export function useCalendarKindStyle(enabled = true) {
  const query = useReferences('crm_appointment_kinds', enabled)
  return {
    error: query.error,
    refetch: query.refetch,
    styleFor(kind: CalendarEvent['kind']) {
      const tag = query.data?.find((item) => item.code === kind)
      return { tone: tag?.tone || tones[kind], color: tag?.color, style: tag?.color ? { '--tag-color': tag.color } as CSSProperties : undefined }
    },
  }
}
