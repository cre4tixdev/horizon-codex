import { Check, Clock3, FilePenLine, CircleAlert } from 'lucide-react'
import { HTag } from '../../../shared/ui/HTag'
import { overviewStates, type TimeOverviewCell } from '../schemas/time'
const tones = { missing: 'navy', draft: 'navy', submitted: 'amber', validated: 'green', rejected: 'pink', mixed: 'violet', future: 'navy', off: 'navy', unknown: 'navy', unavailable: 'navy' } as const
export function TimeStatus({ status, review = false }: { status: TimeOverviewCell['status']; review?: boolean }) {
  if (status === 'unknown') return null
  const Icon = status === 'validated' ? Check : status === 'rejected' || status === 'missing' ? CircleAlert : status === 'draft' ? FilePenLine : Clock3
  return <HTag tone={tones[status]} title={review && status === 'missing' ? 'Non reçue' : overviewStates[status]}><Icon size={11} aria-hidden="true" />{review && status === 'missing' ? 'Non reçue' : overviewStates[status]}</HTag>
}
