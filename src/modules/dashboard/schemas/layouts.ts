import { z } from 'zod'

export const widgetTypes = ['forecast', 'ordered', 'invoiced', 'margin', 'business', 'economic', 'planning', 'activity'] as const
export type WidgetType = typeof widgetTypes[number]
export const widgetCatalog: Record<WidgetType, { label: string; description: string; minWidth: number; minHeight: number; width: number; height: number }> = {
  forecast: { label: 'Chiffre d’affaires prévu', description: 'Estimations des opportunités sur la période.', minWidth: 3, minHeight: 2, width: 3, height: 2 },
  ordered: { label: 'Commandé', description: 'Montant des commandes clients confirmées.', minWidth: 3, minHeight: 2, width: 3, height: 2 },
  invoiced: { label: 'Facturé', description: 'Indicateur en attente de raccordement.', minWidth: 3, minHeight: 2, width: 3, height: 2 },
  margin: { label: 'Marge prévisionnelle', description: 'Marge des commandes, selon les coûts historiques.', minWidth: 3, minHeight: 2, width: 3, height: 2 },
  business: { label: 'Suivi commercial', description: 'Opportunités, devis et commandes en carrousel.', minWidth: 6, minHeight: 4, width: 6, height: 5 },
  economic: { label: 'Pilotage économique', description: 'Prévu et engagé sur la période.', minWidth: 6, minHeight: 3, width: 6, height: 3 },
  planning: { label: 'Mon planning', description: 'Vos tâches et échéances des sept prochains jours.', minWidth: 6, minHeight: 3, width: 6, height: 4 },
  activity: { label: 'Mon activité récente', description: 'Vos actions, mentions et tâches attribuées.', minWidth: 6, minHeight: 3, width: 6, height: 4 },
}
export const widgetSchema = z.object({ type: z.enum(widgetTypes), width: z.union([z.literal(3), z.literal(4), z.literal(6), z.literal(8), z.literal(12)]), height: z.number().int().min(2).max(8) }).strict().refine((value) => value.width >= widgetCatalog[value.type].minWidth && value.height >= widgetCatalog[value.type].minHeight)
export type DashboardWidget = z.infer<typeof widgetSchema>
export const personalDashboardSchema = z.object({ id: z.string().regex(/^[a-zA-Z0-9-]{1,64}$/).refine((id) => id !== 'horizon'), name: z.string().trim().min(1).max(80).refine((value) => [...value].every((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)), widgets: z.array(widgetSchema).max(8).refine((items) => new Set(items.map((item) => item.type)).size === items.length) }).strict()
export type PersonalDashboard = z.infer<typeof personalDashboardSchema>
export const dashboardPreferenceSchema = z.object({ defaultId: z.string(), dashboards: z.array(personalDashboardSchema).max(12) }).strict().refine((value) => new Set(value.dashboards.map((item) => item.id)).size === value.dashboards.length && (value.defaultId === 'horizon' || value.dashboards.some((item) => item.id === value.defaultId)))
export const dashboardLayoutsSchema = z.object({ revision: z.number().int().nonnegative(), preference: dashboardPreferenceSchema })
export type DashboardPreference = z.infer<typeof dashboardPreferenceSchema>
export type DashboardLayouts = z.infer<typeof dashboardLayoutsSchema>
export const defaultDashboard = { id: 'horizon', name: 'Horizon', widgets: (['forecast', 'ordered', 'invoiced', 'margin', 'business', 'planning', 'economic', 'activity'] as const).map((type) => ({ type, width: widgetCatalog[type].width, height: widgetCatalog[type].height }) as DashboardWidget) }

/** Stable first-fit placement in reading order. The persisted order remains mobile order. */
export function placeWidgets(widgets: DashboardWidget[]) {
  const occupied = new Set<string>()
  return widgets.map((widget) => {
    let y = 0, x = 0
    const fits = () => {
      for (let row = y; row < y + widget.height; row++) for (let col = x; col < x + widget.width; col++) if (occupied.has(`${col}:${row}`)) return false
      return true
    }
    while (true) {
      for (x = 0; x <= 12 - widget.width; x++) if (fits()) break
      if (x <= 12 - widget.width) break
      y++
    }
    for (let row = y; row < y + widget.height; row++) for (let col = x; col < x + widget.width; col++) occupied.add(`${col}:${row}`)
    return { ...widget, x, y }
  })
}
export function resizeWidget(widget: DashboardWidget, width: number, height: number): DashboardWidget {
  const definition = widgetCatalog[widget.type]
  const widths = [3, 4, 6, 8, 12].filter((value) => value >= definition.minWidth)
  const nearest = widths.reduce((best, value) => Math.abs(value - width) < Math.abs(best - width) ? value : best, widths[0]!)
  return { type: widget.type, width: nearest as DashboardWidget['width'], height: Math.max(definition.minHeight, Math.min(8, Math.round(height))) }
}
export function moveWidget(widgets: DashboardWidget[], from: number, to: number) {
  const result = [...widgets], item = result[from]
  if (!item || to < 0 || to >= result.length) return result
  result.splice(from, 1); result.splice(to, 0, item)
  return result
}
