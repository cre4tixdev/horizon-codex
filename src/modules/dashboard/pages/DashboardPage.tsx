import { Link } from 'react-router'
import { ArrowUpRight, ChartNoAxesCombined, ShoppingCart, Receipt, Percent, Target, CalendarDays, Activity, ContactRound, FileText, FolderKanban, ArrowRight, Clock3, ListTodo } from 'lucide-react'
import { HPageHeader } from '../../../shared/ui/HPageHeader'
import { HBadge } from '../../../shared/ui/HBadge'
import { HButton } from '../../../shared/ui/HButton'
import { HEmptyState } from '../../../shared/ui/HEmptyState'

const indicators = [
  { label: 'Chiffre d’affaires prévu', icon: ChartNoAxesCombined, caption: 'Opportunités commerciales' },
  { label: 'Commandé', icon: ShoppingCart, caption: 'Commandes clients' },
  { label: 'Facturé', icon: Receipt, caption: 'Factures clients' },
  { label: 'Marge actuelle', icon: Percent, caption: 'Pilotage des affaires' },
]

const shortcuts = [
  { title: 'Contacts', description: 'Sociétés & interlocuteurs', href: '/contacts', icon: ContactRound },
  { title: 'CRM', description: 'Opportunités & appels d’offres', href: '/crm', icon: Target },
  { title: 'Ventes', description: 'Devis & commandes', href: '/sales', icon: FileText },
  { title: 'Projets', description: 'Phases, jalons & exécution', href: '/projects', icon: FolderKanban },
]

export function DashboardPage() {
  const date = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date())

  return <>
    <HPageHeader title="Dashboard" description="Une vue d’ensemble de votre activité et de vos prochaines échéances." actionsPlacement="inline" actions={<span className="dashboard-date"><CalendarDays size={15} aria-hidden="true" />{date}</span>} />
    <div className="dashboard-intro"><span className="dashboard-intro__line" /><span><strong>Votre espace de travail, au même endroit.</strong> Retrouvez les domaines clés de votre activité CVS.</span><HBadge>Prise en main</HBadge></div>
    <div className="kpi-grid">{indicators.map(({ label, icon: Icon, caption }) => (
      <section className="panel kpi" key={label} aria-label={label}>
        <div className="kpi__label"><Icon size={17} aria-hidden="true" /><span>{label}</span></div>
        <strong className="kpi__value" aria-label="Donnée indisponible">—</strong>
        <div className="kpi__caption">{caption}<span>Non disponible</span></div>
      </section>
    ))}</div>
    <section className="quick-access" aria-labelledby="quick-access-title">
      <div className="section-label"><h2 id="quick-access-title">Accès rapides</h2><span>Vos espaces métier</span></div>
      <div className="shortcut-grid">{shortcuts.map(({ title, description, href, icon: Icon }) => (
        <Link to={href} key={href} className="shortcut"><span className="shortcut__icon"><Icon size={19} aria-hidden="true" /></span><span><strong>{title}</strong><small>{description}</small></span><ArrowUpRight size={16} aria-hidden="true" /></Link>
      ))}</div>
    </section>
    <div className="dashboard-columns">
      <div className="dashboard-primary">
        <section className="panel" aria-labelledby="opportunities-title">
          <div className="panel-heading"><h2 id="opportunities-title"><Target size={17} aria-hidden="true" />Dernières opportunités</h2><Link to="/crm" className="panel-link">Ouvrir le CRM<ArrowRight size={14} aria-hidden="true" /></Link></div>
          <div className="empty-table-heading" aria-hidden="true"><span>Opportunité / Client</span><span>Montant</span><span>Statut</span><span>Échéance</span></div>
          <HEmptyState icon={Target} title="Vos opportunités apparaîtront ici" description="Suivez vos affaires, vos appels d’offres et leurs prochaines étapes depuis une vue commune.">
            <HButton asChild size="small"><Link to="/crm">Découvrir l’espace CRM<ArrowUpRight size={14} /></Link></HButton>
          </HEmptyState>
          <div className="panel-footnote">Opportunités directes et appels d’offres</div>
        </section>
        <section className="panel economic-panel" aria-labelledby="economic-title">
          <div className="panel-heading"><h2 id="economic-title"><ChartNoAxesCombined size={17} aria-hidden="true" />Pilotage économique</h2><HBadge>Vue analytique</HBadge></div>
          <div className="economic-flow">{['Prévu', 'Engagé', 'Réalisé', 'Facturé', 'Payé'].map((label, index) => <div key={label}><span className="economic-flow__number">0{index + 1}</span><strong>{label}</strong><span className="economic-flow__value">—</span></div>)}</div>
          <p className="economic-note">Le suivi d’une affaire conserve le même compte analytique, du commercial à l’exécution.</p>
        </section>
      </div>
      <div className="dashboard-secondary">
        <section className="panel" aria-labelledby="planning-title">
          <div className="panel-heading"><h2 id="planning-title"><CalendarDays size={17} aria-hidden="true" />Mon planning</h2><Link to="/calendar" aria-label="Ouvrir le calendrier" className="panel-icon-link"><ArrowUpRight size={16} /></Link></div>
          <div className="planning-date"><Clock3 size={14} aria-hidden="true" />À venir</div>
          <HEmptyState icon={CalendarDays} title="Un aperçu de vos prochaines dates" description="Rendez-vous, visites et échéances seront rassemblés ici." />
        </section>
        <section className="panel" aria-labelledby="activity-title">
          <div className="panel-heading"><h2 id="activity-title"><Activity size={17} aria-hidden="true" />Activité récente</h2><HBadge>Équipe</HBadge></div>
          <HEmptyState icon={ListTodo} title="Votre fil d’activité" description="Les notes, tâches et événements de vos affaires apparaîtront ici." />
        </section>
      </div>
    </div>
  </>
}
