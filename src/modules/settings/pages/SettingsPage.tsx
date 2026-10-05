import { Link, useSearchParams } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import { HBadge } from '../../../shared/ui/HBadge'
import { settingsGroups, settingsSections, settingsSectionPath } from '../navigation'
export function SettingsPage() {
  const [params] = useSearchParams()
  const search = params.get('q') ?? ''
  const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const sections = settingsSections.filter((section) => normalize(`${section.title} ${section.description} ${section.topics.join(' ')}`).includes(normalize(search)))
  return <><div className="settings-overview-heading"><div><h2>Vue d’ensemble</h2><p>Un espace pour chaque domaine, un socle partagé pour tous.</p></div></div>
    {settingsGroups.map((group) => sections.some((section) => section.group === group) && <section className="settings-section-group" key={group}><h3>{group}</h3><div className="settings-card-grid">{sections.filter((section) => section.group === group).map(({ slug, title, icon: Icon, description, available }) => <Link className="settings-module-card" key={slug} to={settingsSectionPath(slug)}><div className="settings-module-card-heading"><span className="settings-module-icon"><Icon size={20} /></span><HBadge tone={available ? 'success' : 'neutral'}>{available ? 'Disponible' : 'Prévu'}</HBadge></div><h4>{title}</h4><p>{description}</p><span className="settings-module-link">{available ? 'Configurer' : 'Voir le périmètre'}<ArrowUpRight size={14} /></span></Link>)}</div></section>)}
    {sections.length === 0 && <p className="settings-empty">Aucune rubrique ne correspond à cette recherche.</p>}
  </>
}
