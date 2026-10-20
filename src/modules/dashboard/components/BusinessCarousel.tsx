import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { HButton } from '../../../shared/ui/HButton'
import type { HorizonUser } from '../../../core/auth/types/session'
import type { WidgetConfig } from '../schemas/widgetData'
import type { WidgetRange } from '../services/widgetRecords'
import { RecordWidget } from './RecordWidget'
export function BusinessCarousel({ instanceId, config, range, user, editing = false, renderPage }: { instanceId: string; config: WidgetConfig; range: WidgetRange; user: HorizonUser | undefined; editing?: boolean; renderPage?: (page: WidgetConfig['pages'][number]) => ReactNode }) {
  const pauseKey = `horizon.dashboard.carousel.${user?.id || 'preview'}.${instanceId}`
  const [index, setIndex] = useState(0), [paused, setPaused] = useState(() => {
    try { return localStorage.getItem(pauseKey) === 'manual' || ['horizon.horizon-business', 'horizon.legacy-business'].includes(instanceId) && localStorage.getItem(`horizon.dashboard.carousel.${user?.id || 'preview'}`) === 'manual' }
    catch { console.warn('[dashboard] Carousel pause preference unavailable.'); return false }
  }), [inView, setInView] = useState(false)
  const active = Math.min(index, config.pages.length - 1), page = config.pages[active]!
  const region = useRef<HTMLElement>(null), pointer = useRef<{ x: number; y: number } | null>(null)
  function move(delta: number) { setIndex((active + delta + config.pages.length) % config.pages.length) }
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)))
    if (region.current) observer.observe(region.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!inView || !config.automatic || paused || editing || config.pages.length <= 1) return
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || region.current?.matches(':hover') || region.current?.contains(document.activeElement)) return
      setIndex((value) => (value + 1) % config.pages.length)
    }, config.interval * 1000)
    return () => window.clearInterval(timer)
  }, [config.automatic, config.interval, config.pages.length, paused, editing, inView])
  return <section ref={region} className="panel dashboard-business-carousel h-dashboard-card h-tone" data-tone="navy" aria-label={config.title || 'Suivi commercial'} aria-roledescription="carrousel">
    {config.title && <div className="panel-heading"><h2>{config.title}</h2></div>}
    <div className="dashboard-carousel-content" role="group" aria-roledescription="diapositive" aria-label={`${active + 1} sur ${config.pages.length} · ${page.title}`} onPointerDown={(event) => { pointer.current = null; if (event.target instanceof Element && event.target.closest('a,button,input')) return; pointer.current = { x: event.clientX, y: event.clientY } }} onPointerCancel={() => { pointer.current = null }} onPointerUp={(event) => { const start = pointer.current; pointer.current = null; if (start && Math.abs(event.clientX - start.x) > 60 && Math.abs(event.clientY - start.y) < 40) move(event.clientX < start.x ? 1 : -1) }}>
      {renderPage ? renderPage(page) : <RecordWidget key={active} data={page} range={range} user={user} embedded />}
    </div>
    <footer className="dashboard-carousel-footer"><nav aria-label="Pages du carrousel">{config.pages.map((item, i) => <button type="button" key={i} aria-label={`Afficher ${item.title || `page ${i + 1}`}`} aria-current={active === i ? 'true' : undefined} onClick={() => setIndex(i)}><span /></button>)}</nav><span className="dashboard-carousel-caption">{active + 1} / {config.pages.length}</span><div className="dashboard-carousel-actions"><HButton size="icon" variant="ghost" aria-label="Page précédente du carrousel" disabled={config.pages.length < 2} onClick={() => move(-1)}><ChevronLeft size={15} /></HButton>{config.automatic && <HButton size="icon" variant="ghost" aria-label={paused ? 'Reprendre le défilement' : 'Mettre en pause'} onClick={() => { setPaused(!paused); try { localStorage.setItem(pauseKey, paused ? 'automatic' : 'manual') } catch { console.warn('[dashboard] Carousel pause kept for this session only.') } }}>{paused ? <Play size={14} /> : <Pause size={14} />}</HButton>}<HButton size="icon" variant="ghost" aria-label="Page suivante du carrousel" disabled={config.pages.length < 2} onClick={() => move(1)}><ChevronRight size={15} /></HButton></div></footer>
  </section>
}
