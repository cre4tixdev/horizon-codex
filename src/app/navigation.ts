import { LayoutDashboard, Mail, CalendarDays, ContactRound, Target, FileText, ShoppingCart, Package, FolderKanban, Headset, UsersRound, Clock3, CalendarOff, Receipt, Wallet, Landmark, Files, Settings2, type LucideIcon } from 'lucide-react'

export type NavigationItem = { label: string; href: string; icon: LucideIcon; description: string }
export type NavigationGroup = { label: string; items: NavigationItem[] }

export const navigationGroups: NavigationGroup[] = [
  { label: 'Espace de travail', items: [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard, description: 'Vue d’ensemble de votre activité' },
    { label: 'Messagerie', href: '/messaging', icon: Mail, description: 'E-mails et conversations internes' },
    { label: 'Calendrier', href: '/calendar', icon: CalendarDays, description: 'Rendez-vous, visites et échéances' },
  ] },
  { label: 'Activité', items: [
    { label: 'Contacts', href: '/contacts', icon: ContactRound, description: 'Sociétés, contacts et adresses' },
    { label: 'CRM', href: '/crm', icon: Target, description: 'Opportunités et appels d’offres' },
    { label: 'Ventes', href: '/sales', icon: FileText, description: 'Devis et commandes clients' },
    { label: 'Achats', href: '/purchasing', icon: ShoppingCart, description: 'Demandes et commandes fournisseurs' },
    { label: 'Stock', href: '/inventory', icon: Package, description: 'Catalogue, disponibilités et mouvements' },
    { label: 'Projets', href: '/projects', icon: FolderKanban, description: 'Exécution, jalons et recettes' },
    { label: 'SAV', href: '/service', icon: Headset, description: 'Parc installé, interventions et maintenance' },
  ] },
  { label: 'Ressources & finance', items: [
    { label: 'Employés', href: '/hr', icon: UsersRound, description: 'Collaborateurs et ressources externes' },
    { label: 'TimeReport', href: '/time-reporting', icon: Clock3, description: 'Planning et temps réalisés' },
    { label: 'Congés', href: '/leave', icon: CalendarOff, description: 'Demandes et absences' },
    { label: 'Dépenses', href: '/expenses', icon: Receipt, description: 'Notes de frais et justificatifs' },
    { label: 'Facturation', href: '/billing', icon: Wallet, description: 'Factures, avoirs et règlements' },
    { label: 'Comptabilité', href: '/accounting', icon: Landmark, description: 'Écritures et suivi analytique' },
    { label: 'Documents', href: '/documents', icon: Files, description: 'Modèles et documents partagés' },
    { label: 'Paramètres', href: '/settings', icon: Settings2, description: 'Organisation et configuration Horizon' },
  ] },
]

export const navigationItems = navigationGroups.flatMap((group) => group.items)
