import { z } from 'zod'
import { defaultPages, widgetConfigSchema } from './widgetData'

export const widgetTypes = ['forecast', 'ordered', 'invoiced', 'margin', 'business', 'economic', 'planning', 'activity', 'records', 'shortcuts', 'time', 'leave', 'approvals'] as const
export type WidgetType = typeof widgetTypes[number]
export const widgetCatalog: Record<WidgetType, { label: string; description: string; minWidth: number; minHeight: number; width: number; height: number }> = {
  forecast: { label: 'Chiffre d’affaires prévu', description: 'Estimations des opportunités sur la période.', minWidth: 2, minHeight: 1, width: 3, height: 2 },
  ordered: { label: 'Commandé', description: 'Montant des commandes clients confirmées.', minWidth: 2, minHeight: 1, width: 3, height: 2 },
  invoiced: { label: 'Facturé', description: 'Indicateur en attente de raccordement.', minWidth: 2, minHeight: 1, width: 3, height: 2 },
  margin: { label: 'Marge prévisionnelle', description: 'Marge des commandes, selon les coûts historiques.', minWidth: 2, minHeight: 1, width: 3, height: 2 },
  business: { label: 'Suivi commercial', description: 'Opportunités, devis et commandes en carrousel.', minWidth: 2, minHeight: 2, width: 6, height: 5 },
  economic: { label: 'Pilotage économique', description: 'Prévu et engagé sur la période.', minWidth: 2, minHeight: 2, width: 6, height: 3 },
  planning: { label: 'Mon planning', description: 'Vos tâches et échéances des sept prochains jours.', minWidth: 2, minHeight: 2, width: 6, height: 4 },
  activity: { label: 'Mon activité récente', description: 'Vos actions, mentions et tâches attribuées.', minWidth: 2, minHeight: 2, width: 6, height: 4 },
  records: { label: 'Données métier', description: 'Liste, tableau ou compteur : opportunités, devis, commandes, factures.', minWidth: 2, minHeight: 2, width: 4, height: 4 },
  shortcuts: { label: 'Mes raccourcis', description: 'Les destinations utiles, choisies et ordonnées.', minWidth: 2, minHeight: 1, width: 3, height: 2 },
  time: { label: 'Suivi des temps', description: 'Heures et états de saisie, pour vous ou votre équipe.', minWidth: 2, minHeight: 2, width: 6, height: 4 },
  leave: { label: 'Absences', description: 'Calendrier des congés de l’équipe ou de l’entreprise.', minWidth: 2, minHeight: 2, width: 6, height: 4 },
  approvals: { label: 'À valider', description: 'Demandes de congés, notes de frais et feuilles de temps.', minWidth: 2, minHeight: 2, width: 4, height: 3 },
}
const identity = z.string().regex(/^[a-zA-Z0-9-]{1,64}$/)
const dimensions = { type: z.enum(widgetTypes), width: z.number().int().min(2).max(12), height: z.number().int().min(1).max(12) }
const instanceSchema = z.object({ ...dimensions, id: identity, x: z.number().int().min(0).max(10).optional(), y: z.number().int().min(0).max(1000).optional(), config: widgetConfigSchema }).strict()
const legacySchema = z.object(dimensions).strict().transform((widget) => instanceSchema.parse({ ...widget, id: `legacy-${widget.type}`, config: initialWidgetConfig(widget.type) }))
export const widgetSchema = z.union([instanceSchema, legacySchema]).refine((value) => value.width >= widgetCatalog[value.type].minWidth && value.height >= widgetCatalog[value.type].minHeight && (value.x === undefined || value.x + value.width <= 12))
export type DashboardWidget = z.infer<typeof instanceSchema>
export const personalDashboardSchema = z.object({ id: identity.refine((id) => id !== 'horizon'), name: z.string().trim().min(1).max(80).refine((value) => [...value].every((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)), widgets: z.array(widgetSchema).max(32).refine((items) => new Set(items.map((item) => item.id)).size === items.length) }).strict()
export type PersonalDashboard = z.infer<typeof personalDashboardSchema>
export const dashboardPreferenceSchema = z.object({ defaultId: z.string(), dashboards: z.array(personalDashboardSchema).max(12) }).strict().refine((value) => new Set(value.dashboards.map((item) => item.id)).size === value.dashboards.length && (value.defaultId === 'horizon' || value.dashboards.some((item) => item.id === value.defaultId)))
export const dashboardLayoutsSchema = z.object({ revision: z.number().int().nonnegative(), preference: dashboardPreferenceSchema })
export type DashboardPreference = z.infer<typeof dashboardPreferenceSchema>
export type DashboardLayouts = z.infer<typeof dashboardLayoutsSchema>
function initialWidgetConfig(type: WidgetType) {
  return widgetConfigSchema.parse(type === 'leave' ? { scope: 'team' } : type === 'business' ? { pages: defaultPages.map((page) => ({ ...page, presentation: 'table' })) } : type === 'records' ? { data: { presentation: 'table' } } : {})
}
export function createWidget(type: WidgetType): DashboardWidget {
  return { id: crypto.randomUUID(), type, width: widgetCatalog[type].width, height: widgetCatalog[type].height, config: initialWidgetConfig(type) }
}
export const defaultDashboard = { id: 'horizon', name: 'Horizon', widgets: (['forecast', 'ordered', 'invoiced', 'margin', 'business', 'planning', 'economic', 'activity'] as const).map((type) => ({ ...createWidget(type), id: `horizon-${type}` })) }

/** Explicit positions win in order; displaced neighbours move down without overlap. */
export function placeWidgets(widgets: DashboardWidget[]) {
  const occupied = new Set<string>()
  return widgets.map((widget) => {
    let y = widget.y ?? 0, x = widget.x ?? 0
    const fits = () => {
      for (let row = y; row < y + widget.height; row++) for (let col = x; col < x + widget.width; col++) if (occupied.has(`${col}:${row}`)) return false
      return true
    }
    while (true) {
      if (widget.x !== undefined) { x = Math.min(widget.x, 12 - widget.width); if (fits()) break }
      else { for (x = 0; x <= 12 - widget.width; x++) if (fits()) break; if (x <= 12 - widget.width) break }
      y++
    }
    for (let row = y; row < y + widget.height; row++) for (let col = x; col < x + widget.width; col++) occupied.add(`${col}:${row}`)
    return { ...widget, x, y }
  })
}
export function resizeWidget(widget: DashboardWidget, width: number, height: number): DashboardWidget {
  const definition = widgetCatalog[widget.type]
  const nextWidth = Math.max(definition.minWidth, Math.min(12, Math.round(width)))
  return { ...widget, width: nextWidth, height: Math.max(definition.minHeight, Math.min(12, Math.round(height))), ...(widget.x === undefined ? {} : { x: Math.min(widget.x, 12 - nextWidth) }) }
}
/** Give the moved widget priority, then persist the exact preview placement. */
export function positionWidget(widgets: DashboardWidget[], moved: DashboardWidget) {
  const placed = placeWidgets([moved, ...placeWidgets(widgets).filter((widget) => widget.id !== moved.id)])
  return widgets.map((widget) => placed.find((item) => item.id === widget.id)!)
}
