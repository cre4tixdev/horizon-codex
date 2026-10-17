import { Link, useSearchParams } from 'react-router'
import { ArrowRight, ChevronDown, Clock3, Search } from 'lucide-react'
import { HSectionHeading } from '../../../shared/ui/HSectionHeading'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { settingsGroups, settingsSections, settingsSectionPath } from '../navigation'

type SettingsSection = (typeof settingsSections)[number]
function SectionLink({ section }: { section: SettingsSection }) {
  const Icon = section.icon
  if (section.available) return <Link className="settings-module-card" to={settingsSectionPath(section.slug)}>
    <span className="settings-module-icon"><Icon size={20} aria-hidden="true" /></span>
    <strong>{section.title}</strong>
    <p>{section.description}</p>
    <span className="settings-module-link">Configurer<ArrowRight size={14} aria-hidden="true" /></span>
  </Link>
  return <Link className="settings-entry" to={settingsSectionPath(section.slug)}>
    <Icon size={17} aria-hidden="true" />
    <span><strong>{section.title}</strong><small>{section.description}</small></span>
    <ArrowRight size={14} aria-hidden="true" />
  </Link>
}

export function SettingsPage() {
  const [params] = useSearchParams()
  const search = params.get('q')?.trim() ?? ''
  const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const sections = settingsSections.filter((section) => normalize(`${section.group} ${section.title} ${section.description} ${section.topics.join(' ')}`).includes(normalize(search)))
  const available = sections.filter((section) => section.available), planned = sections.filter((section) => !section.available)
  return <div className="settings-overview">
    <HSectionHeading title="Vue d’ensemble" description="Les réglages disponibles, regroupés par usage. Recherchez une rubrique depuis la barre du haut." />
    <div className="settings-overview-groups">{settingsGroups.map((group) => {
      const items = available.filter((section) => section.group === group)
      return items.length > 0 && <section className="settings-section-group" key={group} aria-label={group}>
        <HSectionHeading title={group} />
        <div className="settings-card-grid">{items.map((section) => <SectionLink key={section.slug} section={section} />)}</div>
      </section>
    })}</div>
    {planned.length > 0 && <details className="settings-planned" key={search} open={search ? true : undefined}>
      <summary><Clock3 size={15} aria-hidden="true" /><span>À venir <small>({planned.length})</small></span><ChevronDown size={15} aria-hidden="true" /></summary>
      <p>Ces rubriques présentent uniquement le périmètre prévu. Aucun réglage n’y est encore disponible.</p>
      <div className="settings-planned-entries">{planned.map((section) => <SectionLink key={section.slug} section={section} />)}</div>
    </details>}
    {sections.length === 0 && <HEmptyState icon={Search} title="Aucune rubrique trouvée" description="Essayez un autre nom de réglage ou de module dans la barre de recherche." />}
  </div>
}
