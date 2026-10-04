import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import type { NavigationItem } from '../navigation'
import { HPageHeader } from '../../shared/ui/HPageHeader'
import { HEmptyState } from '../../shared/ui/HEmptyState'
import { HButton } from '../../shared/ui/HButton'
import { HBadge } from '../../shared/ui/HBadge'

export function WorkspacePage({ item }: { item: NavigationItem }) {
  return <>
    <HPageHeader title={item.label} description={item.description} actions={<HBadge>À venir</HBadge>} />
    <section className="panel workspace-placeholder" aria-label={item.label}>
      <HEmptyState icon={item.icon} title={`Votre espace ${item.label}`} description="Cet espace n’est pas encore disponible. Vous retrouverez ici vos informations et vos actions métier.">
        <HButton asChild><Link to="/"><ArrowLeft size={15} />Retour au dashboard</Link></HButton>
      </HEmptyState>
    </section>
  </>
}
