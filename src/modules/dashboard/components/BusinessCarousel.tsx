import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ArrowUpRight, ChevronLeft, ChevronRight, FileText, Pause, Play, Receipt, Settings2, ShoppingBag, Target } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { sessionService } from '../../../core/auth/services/session'
import { hasPermission } from '../../../core/auth/types/session'
import { crmService } from '../../crm'
import { salesService } from '../../sales'
import { crmRecordHref } from '../../crm/schemas/opportunities'
import { quoteStatusLabels, quoteStatusTones } from '../../sales/schemas/quotes'
import { HButton } from '../../../shared/ui/HButton'
import { HDialog } from '../../../shared/ui/HDialog'
import { HEmptyState } from '../../../shared/ui/HEmptyState'
import { HLoadingIndicator } from '../../../shared/ui/HLoadingIndicator'
import { HDataTable } from '../../../shared/ui/HDataTable'
import { HTag } from '../../../shared/ui/HTag'
import { formatAmount } from '../../../shared/formatters/money'
import type { TagTone } from '../../../shared/schemas/tagTone'

const slides = [
  { label: 'Opportunités', icon: Target, href: '/crm' },
  { label: 'Devis', icon: FileText, href: '/sales/quotes?status=quotes' },
  { label: 'Commandes clients', icon: ShoppingBag, href: '/sales/quotes?status=accepted' },
  { label: 'Factures', icon: Receipt, href: '/billing' },
] as const
const intervalMs = 10_000
function readAutomatic(key: string) {
  try { return localStorage.getItem(key) !== 'manual' }
  catch { console.warn('[dashboard] Carousel preference unavailable.'); return true }
}
type BusinessRow = { id: string; number: string; title: string; company: string; amount: number; currency: string; state: string; tone: TagTone; color?: string | undefined; href: string }
const columns: ColumnDef<BusinessRow>[] = [
  { header: 'Pièce / Client', accessorKey: 'title', cell: ({ row }) => <div className="dashboard-business-identity"><strong>{row.original.number} · {row.original.title}</strong><small>{row.original.company}</small></div> },
  { id: 'amount', header: 'Montant HT', cell: ({ row }) => formatAmount(row.original.amount, row.original.currency) },
  { id: 'state', header: 'État', cell: ({ row }) => <HTag tone={row.original.tone} color={row.original.color}>{row.original.state}</HTag> },
]

export function BusinessCarousel() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const user = session.status === 'authenticated' ? session.user : undefined
  const key = `horizon.dashboard.carousel.${user?.id || 'preview'}`
  const [preference, setPreference] = useState(() => ({ key, automatic: readAutomatic(key) }))
  const automatic = preference.key === key ? preference.automatic : readAutomatic(key)
  const [active, setActive] = useState(0), [settings, setSettings] = useState(false)
  const region = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const slide = slides[active]!, Icon = slide.icon
  const canRead = Boolean(user && hasPermission(user, active === 0 ? 'crm.read' : 'sales.read'))
  const query = useQuery({
    queryKey: active === 0 ? ['crm', 'opportunities', 'dashboard', user?.id] : ['sales', 'quotes', 'dashboard', user?.id, active], enabled: canRead && active !== 3, retry: false, staleTime: 60_000,
    queryFn: async (): Promise<{ items: BusinessRow[]; total: number }> => {
      if (active === 0) {
        const page = await crmService.list({ search: '', page: 1, archived: false, status: '', company: '', owner: '', sort: '-created' })
        return { total: page.totalItems, items: page.items.slice(0, 7).map((item) => ({ id: item.id, number: item.opportunity_number, title: item.title, company: item.expand?.company?.name || '', amount: item.estimated_value, currency: item.currency, state: item.expand?.stage?.label || 'Opportunité', tone: item.expand?.stage?.tone || 'navy', color: item.expand?.stage?.color || undefined, href: crmRecordHref(item) })) }
      }
      const page = await salesService.list({ q: '', opportunity: '', company: '', status: active === 1 ? 'quotes' : 'accepted', sort: '-created', page: 1 })
      return { total: page.totalItems, items: page.items.slice(0, 7).map((item) => ({ id: item.id, number: item.quote_number, title: item.title, company: item.company_name, amount: item.subtotal, currency: item.currency, state: quoteStatusLabels[item.status], tone: quoteStatusTones[item.status], href: `/sales/quotes/${item.id}` })) }
    },
  })
  function remember(automatic: boolean) {
    setPreference({ key, automatic })
    try { localStorage.setItem(key, automatic ? 'automatic' : 'manual') }
    catch { console.warn('[dashboard] Carousel preference kept for this session only.') }
  }
  function move(delta: number) { setActive((value) => (value + delta + slides.length) % slides.length) }
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  useEffect(() => {
    if (!automatic || settings || !visible) return
    const timer = window.setInterval(() => {
      if (region.current?.matches(':hover') || region.current?.contains(document.activeElement)) return
      setActive((value) => (value + 1) % slides.length)
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [automatic, active, settings, visible])
  return <section ref={region} className="panel h-dashboard-card h-tone dashboard-business-carousel" data-tone="pink" aria-label="Suivi commercial" aria-roledescription="carrousel">
    <div className="panel-heading"><h2><Icon size={17} aria-hidden="true" />{slide.label}</h2><div className="dashboard-carousel-actions">{active !== 3 && canRead && <Link className="panel-link" to={slide.href}>Tout voir<ArrowUpRight size={14} /></Link>}<HButton size="icon" variant="ghost" title="Paramètres du carrousel" aria-label="Paramètres du carrousel" onClick={() => setSettings(true)}><Settings2 size={14} /></HButton></div></div>
    <div className="dashboard-carousel-content" key={active} role="group" aria-roledescription="diapositive" aria-label={`${active + 1} sur ${slides.length} · ${slide.label}`} onPointerDown={(event) => { pointer.current = null; if (event.button !== 0 || !event.target || event.target instanceof Element && event.target.closest('a, button')) return; pointer.current = { x: event.clientX, y: event.clientY } }} onPointerCancel={() => { pointer.current = null }} onPointerUp={(event) => { const start = pointer.current; pointer.current = null; if (start && Math.abs(event.clientX - start.x) > 60 && Math.abs(event.clientY - start.y) < 40) move(event.clientX < start.x ? 1 : -1) }}>
      {active === 3 ? <HEmptyState icon={Receipt} title="Factures · À venir" description="Le suivi des factures apparaîtra ici lorsque le module Facturation sera disponible." /> : !canRead ? <HEmptyState icon={Icon} title={slide.label} description={user ? 'Vous ne disposez pas de la permission de consulter ces pièces.' : 'Connectez-vous pour consulter vos pièces.'} /> : <>
        {query.isPending && <HLoadingIndicator label={`Chargement : ${slide.label}`} />}
        {query.error && <p className="field-error dashboard-carousel-error" role="alert">{query.error.message}<HButton size="small" onClick={() => void query.refetch()}>Réessayer</HButton></p>}
        {query.data && (query.data.items.length ? <HDataTable data={query.data.items} columns={columns} columnBorders columnAlignments={{ amount: 'right', state: 'center' }} getRowLink={(item) => ({ href: item.href, label: `Ouvrir ${item.number}` })} /> : <HEmptyState icon={Icon} title={`Aucun élément · ${slide.label}`} description="Vos dernières pièces apparaîtront ici." />)}
      </>}
    </div>
    <footer className="dashboard-carousel-footer"><nav aria-label="Vues du suivi commercial">{slides.map((item, index) => <button type="button" key={item.label} aria-label={`Afficher ${item.label}`} aria-current={active === index ? 'true' : undefined} title={item.label} onClick={() => setActive(index)}><span /></button>)}</nav><span className="dashboard-carousel-caption">{query.data && active !== 3 && canRead ? `${query.data.total} ${slide.label.toLowerCase()}` : slide.label}</span><div className="dashboard-carousel-actions"><HButton size="icon" variant="ghost" title="Vue précédente" aria-label="Vue précédente" onClick={() => move(-1)}><ChevronLeft size={15} /></HButton><HButton size="icon" variant="ghost" title={automatic ? 'Mettre en pause' : 'Reprendre le défilement'} aria-label={automatic ? 'Mettre en pause' : 'Reprendre le défilement'} onClick={() => remember(!automatic)}>{automatic ? <Pause size={14} /> : <Play size={14} />}</HButton><HButton size="icon" variant="ghost" title="Vue suivante" aria-label="Vue suivante" onClick={() => move(1)}><ChevronRight size={15} /></HButton></div></footer>
    <HDialog open={settings} onOpenChange={setSettings} title="Carrousel du dashboard" description="Préférence personnelle conservée sur ce navigateur."><div className="dialog-form"><label className="dashboard-carousel-setting"><input type="checkbox" checked={automatic} onChange={(event) => remember(event.target.checked)} />Défilement automatique toutes les 10 secondes</label><p className="contact-muted">Pause pendant le survol, la navigation au clavier ou lorsque l’onglet est masqué. Les flèches, les points et le glissement permettent de changer de vue manuellement.</p></div></HDialog>
  </section>
}
