import { LayoutDashboard, Mail, CalendarDays, ContactRound, Target, FileText, ShoppingCart, Package, FolderKanban, Headset, UsersRound, Clock3, CalendarOff, Receipt, Wallet, Landmark, Files, Settings2, Columns3, ClipboardList, Building2, Truck, type LucideIcon } from 'lucide-react'

export type NavigationItem = { label: string; href: string; icon: LucideIcon; description: string; children?: NavigationItem[] }
export type NavigationGroup = { label: string; items: NavigationItem[] }

export const navigationGroups: NavigationGroup[] = [
  { label: 'Espace de travail', items: [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard, description: 'Vue d’ensemble de votre activité' },
    { label: 'Messagerie', href: '/messaging', icon: Mail, description: 'E-mails et conversations internes' },
    { label: 'Calendrier', href: '/calendar', icon: CalendarDays, description: 'Rendez-vous, visites et échéances' },
  ] },
  { label: 'Activité', items: [
    { label: 'Contacts', href: '/contacts', icon: ContactRound, description: 'Sociétés, contacts et adresses', children: [
      { label: 'Clients', href: '/contacts?role=customer&scope=companies&view=list', icon: Building2, description: 'Sociétés clientes' },
      { label: 'Fournisseurs', href: '/contacts?role=supplier&scope=companies&view=list', icon: Truck, description: 'Sociétés fournisseurs' },
      { label: 'Personnes', href: '/contacts/people?scope=people&view=list', icon: UsersRound, description: 'Tous les interlocuteurs' },
    ] },
    { label: 'CRM', href: '/crm', icon: Target, description: 'Opportunités et appels d’offres', children: [
      { label: 'Pipeline', href: '/crm', icon: Columns3, description: 'Toutes les opportunités commerciales' },
      { label: 'Appels d’offres', href: '/crm?area=ao', icon: ClipboardList, description: 'Préparation et suivi des réponses AO' },
    ] },
    { label: 'Ventes', href: '/sales', icon: FileText, description: 'Devis et commandes clients', children: [{ label: 'Devis', href: '/sales/quotes', icon: FileText, description: 'Tous les devis commerciaux' }] },
    { label: 'Achats', href: '/purchasing', icon: ShoppingCart, description: 'Demandes et commandes fournisseurs' },
    { label: 'Stock', href: '/inventory', icon: Package, description: 'Catalogue, disponibilités et mouvements', children: [{ label: 'Produits', href: '/inventory', icon: Package, description: 'Catalogue produits et tarifs fournisseurs' }] },
    { label: 'Projets', href: '/projects', icon: FolderKanban, description: 'Exécution, jalons et recettes' },
    { label: 'SAV', href: '/service', icon: Headset, description: 'Parc installé, interventions et maintenance' },
  ] },
  { label: 'Ressources humaines', items: [
    { label: 'Employés', href: '/hr', icon: UsersRound, description: 'Collaborateurs et ressources externes' },
    { label: 'TimeReport', href: '/time-reporting', icon: Clock3, description: 'Planning et temps réalisés' },
    { label: 'Congés', href: '/leave', icon: CalendarOff, description: 'Demandes et absences' },
    { label: 'Notes de frais', href: '/expenses', icon: Receipt, description: 'Notes de frais et justificatifs' },
  ] },
  { label: 'Finance', items: [
    { label: 'Facturation', href: '/billing', icon: Wallet, description: 'Factures, avoirs et règlements' },
    { label: 'Comptabilité', href: '/accounting', icon: Landmark, description: 'Écritures et suivi analytique' },
  ] },
  { label: 'Administration', items: [
    { label: 'Documents', href: '/documents', icon: Files, description: 'Modèles et documents partagés' },
    { label: 'Paramètres', href: '/settings', icon: Settings2, description: 'Organisation et configuration Horizon' },
  ] },
]

export const navigationItems = navigationGroups.flatMap((group) => group.items)
