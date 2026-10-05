import { Link, useParams } from 'react-router'
import { ArrowLeft, Globe } from 'lucide-react'
import { HBadge } from '../../../shared/ui/HBadge'
import { HButton } from '../../../shared/ui/HButton'
import { settingsSections } from '../navigation'
export function SettingsModulePage() {
  const { module } = useParams()
  const section = settingsSections.find((item) => item.slug === module && !item.available)
  if (!section) return <div className="settings-detail"><h2>Rubrique introuvable</h2><HButton asChild><Link to="/settings"><ArrowLeft size={14} />Vue d’ensemble</Link></HButton></div>
  const Icon = section.icon
  return <section className="settings-detail"><div className="settings-detail-heading"><span className="settings-module-icon"><Icon size={22} /></span><div><h2>{section.title}</h2><p>{section.description}</p></div><HBadge>Prévu</HBadge></div><p className="settings-planned-description">Les réglages de ce domaine seront regroupés ici au fur et à mesure de leur disponibilité.</p><div className="settings-topics">{section.topics.map((topic) => <div key={topic}><h3>{topic}</h3><span>À venir</span></div>)}</div>
    {['contacts', 'catalogue', 'ventes', 'achats', 'facturation', 'comptabilite', 'organisation'].includes(section.slug) && <div className="settings-related"><Globe size={18} /><div><strong>Référentiels communs</strong><p>Pays, langues et devises sont déjà disponibles et partagés entre les modules.</p></div><HButton asChild size="small"><Link to="/settings/references">Ouvrir les référentiels</Link></HButton></div>}
  </section>
}
