import { useState } from 'react'
import type { OperationForecast as Forecast } from '../schemas/operations'

export function OperationForecast({ forecast, seriesKey, label }: { forecast: Forecast | null | undefined; seriesKey: keyof Forecast['series']; label: string }) {
  const [active, setActive] = useState<number | null>(null)
  if (!forecast) return <div className="stock-forecast stock-forecast--unavailable">Prévision indisponible</div>
  const series = forecast.series[seriesKey], peak = Math.max(1, ...series.completed, ...series.planned)
  const x = (index: number) => 12 + index * 30, y = (count: number) => 68 - count / peak * 48
  const path = (values: number[]) => values.map((count, index) => index === 0 ? `M${x(index)},${y(count)}` : `C${x(index) - 15},${y(values[index - 1]!)} ${x(index) - 15},${y(count)} ${x(index)},${y(count)}`).join(' ')
  const hasActivity = series.completed.some(Boolean) || series.planned.some(Boolean)
  const todayIndex = forecast.dates.indexOf(forecast.today)
  const selected = active === null ? null : forecast.dates[active]
  const dateLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' })
  const pointLabel = (index: number) => `${dateLabel(forecast.dates[index]!)} : ${series.completed[index]} réalisé(s), ${series.planned[index]} prévu(s)`
  return <div className="stock-forecast">
    <div className="stock-forecast-caption">{active === null ? <><span>Activité sur 10 jours</span><span>Pièces / jour</span></> : <><span>{dateLabel(selected!)}</span><span>{series.completed[active]} réalisé(s) · {series.planned[active]} prévu(s)</span></>}</div>
    <svg viewBox="0 0 294 94" role="img" aria-label={`${label} : réalisé et prévu, du ${dateLabel(forecast.dates[0]!)} au ${dateLabel(forecast.dates[9]!)}`} tabIndex={0} onMouseLeave={() => setActive(null)} onBlur={() => setActive(null)} onFocus={() => setActive(todayIndex)} onKeyDown={(event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setActive((current) => Math.max(0, Math.min(9, (current ?? todayIndex) + (event.key === 'ArrowLeft' ? -1 : 1)))) } }}>
      <title>{forecast.dates.map((_, index) => pointLabel(index)).join('; ')}</title>
      {[0, .5, 1].map((ratio) => <line key={ratio} x1="12" x2="282" y1={y(ratio * peak)} y2={y(ratio * peak)} className="stock-forecast-grid" />)}
      <text x="282" y="12" textAnchor="end" className="stock-forecast-axis">{peak}</text>
      <line x1={x(todayIndex)} x2={x(todayIndex)} y1="16" y2="72" className="stock-forecast-today" />
      <path d={`${path(series.completed)} L282,68 L12,68 Z`} className="stock-forecast-area-completed" />
      <path d={`${path(series.planned)} L282,68 L12,68 Z`} className="stock-forecast-area-planned" />
      <path d={path(series.completed)} className="stock-forecast-completed" />
      <path d={path(series.planned)} className="stock-forecast-planned" />
      {!hasActivity && <text x="147" y="42" textAnchor="middle" className="stock-forecast-empty">Aucune opération datée</text>}
      {forecast.dates.map((date, index) => <g key={date}>
        <text x={x(index)} y="89" textAnchor="middle" className={date === forecast.today ? 'stock-forecast-axis stock-forecast-axis--today' : 'stock-forecast-axis'}>{date === forecast.today ? 'Auj.' : date.slice(8)}</text>
        {active === index && <><line x1={x(index)} x2={x(index)} y1="16" y2="72" className="stock-forecast-cursor" /><circle cx={x(index)} cy={y(series.completed[index]!)} r="3" className="stock-forecast-point-completed" /><circle cx={x(index)} cy={y(series.planned[index]!)} r="3" className="stock-forecast-point-planned" /></>}
        <rect x={x(index) - 12} y="14" width="24" height="80" fill="transparent" onMouseEnter={() => setActive(index)}><title>{pointLabel(index)}</title></rect>
      </g>)}
    </svg>
    <div className="stock-forecast-legend"><span><i className="stock-forecast-key-completed" />Réalisé</span><span><i className="stock-forecast-key-planned" />Prévu</span><span className="stock-forecast-period">J−2 → J+7</span></div>
    {(series.undated > 0 || series.overdue > 0) && <div className="stock-forecast-notice">{[series.undated > 0 && `${series.undated} sans date`, series.overdue > 0 && `${series.overdue} en retard`].filter(Boolean).join(' · ')}</div>}
  </div>
}
