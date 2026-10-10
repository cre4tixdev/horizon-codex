import { Crosshair, Target, Hourglass, Check, Frown, X, type LucideIcon } from 'lucide-react'
import { HProgressSteps } from '../../../shared/ui/HProgressSteps'
import type { Stage } from '../schemas/opportunities'

const stageIcons: Record<string, LucideIcon> = { new: Crosshair, qualified: Hourglass, won: Target, completed: Check, lost: Frown, cancelled: X }

export function OpportunityProgress({ stages, currentId }: { stages: Stage[]; currentId: string }) {
  const visible = stages.filter((stage) => stage.active || stage.id === currentId).toSorted((a, b) => a.sort_order - b.sort_order)
  const current = visible.findIndex((stage) => stage.id === currentId)
  const lost = visible[current]?.status === 'lost'
  return <HProgressSteps label="Avancement de l’opportunité" className="crm-progress" preserveIcons steps={visible.map((stage, index) => ({ id: stage.id, label: stage.label, icon: stageIcons[stage.code] || Target, state: index === current ? 'current' : !lost && stage.status === 'open' && index < current ? 'done' : 'pending' }))} />
}
