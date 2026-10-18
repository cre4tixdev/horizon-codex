import { z } from 'zod'
export const timeStates = { missing: 'Non saisie', draft: 'Brouillon', submitted: 'À valider', validated: 'Validée', rejected: 'À corriger' } as const
export const timeStatusSchema = z.enum(['draft', 'submitted', 'validated', 'rejected'])
export const contexts = { affair: 'Affaire / commande', presales: 'Avant-vente / AO', internal: 'Interne' } as const
export const contextSchema = z.enum(['affair', 'presales', 'internal'])
const daySchema = z.object({ minutes: z.number().int().min(0).max(1440), description: z.string() })
export const timeLineSchema = z.object({ id: z.string(), product: z.string(), product_label: z.string(), product_code: z.string(), analytic_account: z.string(), account_label: z.string(), account_code: z.string(), sales_order_line: z.string(), context: contextSchema, days: daySchema.array().length(7) })
export type TimeLine = z.infer<typeof timeLineSchema>
export const sheetSchema = z.object({ today: z.string(), id: z.string(), employee: z.string(), employee_name: z.string(), user: z.string(), week_start: z.string(), status: timeStatusSchema, revision: z.number().int(), manager: z.string(), manager_name: z.string(), decision_reason: z.string(), actions: z.string().array(), days: z.array(z.object({ date: z.string(), holiday: z.string(), weekend: z.boolean(), absent: z.number(), capacity_minutes: z.number().nullable() })), totals: z.number().array(), total_minutes: z.number(), lines: timeLineSchema.array() })
export type TimeSheet = z.infer<typeof sheetSchema>
export const identitySchema = z.object({ id: z.string(), label: z.string() })
export const choicesSchema = z.object({ tracks_time: z.boolean(), has_history: z.boolean(), can_enter: z.boolean(), entry_reason: z.string(), work_type: z.string(), internal_account: identitySchema.extend({ code: z.string() }), employee: z.string(), employee_name: z.string(), managers: identitySchema.array(), can_review: z.boolean(), can_settings: z.boolean(), can_costs: z.boolean(), activities: z.array(z.object({ id: z.string(), label: z.string(), code: z.string(), valid_from: z.string(), valid_to: z.string() })), favorites: z.array(z.object({ id: z.string(), product: z.object({ id: z.string(), label: z.string(), code: z.string() }), account: z.object({ label: z.string(), code: z.string() }), analytic_account: z.string(), sales_order_line: z.string(), context: contextSchema })) })
export type TimeChoices = z.infer<typeof choicesSchema>
export const listSchema = z.object({ items: z.array(z.object({ id: z.string(), employee: z.string(), employee_name: z.string(), week_start: z.string(), status: z.enum(['draft', 'submitted', 'validated', 'rejected', 'missing']), total_minutes: z.number(), month_minutes: z.number(), manager_name: z.string() })), page: z.number(), totalItems: z.number(), totalPages: z.number(), total_minutes: z.number(), missing: z.number(), summary: z.object({ minutes: z.number(), missing: z.number(), draft: z.number(), submitted: z.number(), validated: z.number(), rejected: z.number() }) })
export const accountSchema = identitySchema.extend({ code: z.string(), parent: z.string(), internal: z.boolean() })
export const activitySettingSchema = z.object({ id: z.string(), product: z.string(), label: z.string(), active: z.boolean(), work_types: z.array(z.enum(['be', 'production'])), valid_from: z.string(), valid_to: z.string(), updated: z.string() })
export type ActivitySetting = z.infer<typeof activitySettingSchema>
export const settingsSchema = z.object({ can_costs: z.boolean(), activities: activitySettingSchema.array(), products: identitySchema.array(), employees: identitySchema.array(), resources: z.array(z.object({ id: z.string(), employee: z.string(), employee_name: z.string(), valid_from: z.string(), valid_to: z.string(), weekly_pattern: z.number().array(), work_types: z.array(z.enum(['be', 'production'])), hourly_cost: z.number().nullable().optional() })) })
export type TimeSettings = z.infer<typeof settingsSchema>
export type TimeInput = { week_start: string; revision: number; lines: Pick<TimeLine, 'id' | 'product' | 'analytic_account' | 'sales_order_line' | 'context' | 'days'>[] }
export const sheetInput = (sheet: TimeSheet, lines: TimeLine[]): TimeInput => ({ week_start: sheet.week_start, revision: sheet.revision, lines: lines.map(({ id, product, analytic_account, sales_order_line, context, days }) => ({ id: id.startsWith('new:') ? '' : id, product, analytic_account, sales_order_line, context, days })) })
export const duration = (minutes: number) => `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`
/** h:mm, integer hours or decimal hours, French comma accepted. No silent rounding. */
export function parseDuration(input: string): number | undefined {
  const value = input.trim().replace(',', '.')
  if (!value) return 0
  let result: number
  if (/^\d{1,2}:\d{2}$/.test(value)) { const [hours, minutes] = value.split(':').map(Number); if (minutes! >= 60) return; result = hours! * 60 + minutes! }
  else if (/^\d{1,2}(\.\d{1,2})?$/.test(value)) result = Math.round(Number(value) * 60 * 1000) / 1000
  else return
  return Number.isInteger(result) && result >= 0 && result <= 1440 ? result : undefined
}
export const civilToday = () => new Date().toLocaleDateString('sv-SE')
export const addDays = (day: string, n: number) => new Date(Date.parse(day) + n * 86400000).toISOString().slice(0, 10)
export const monday = (day: string) => addDays(day, -((new Date(day).getUTCDay() + 6) % 7))
export const dateLabel = (day: string) => new Date(day).toLocaleDateString('fr-FR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' })
export const stateTone = (state: keyof typeof timeStates) => ({ missing: 'navy', draft: 'navy', submitted: 'amber', validated: 'green', rejected: 'pink' } as const)[state]

export const overviewStates = { missing: 'Non saisie', draft: 'Brouillon', submitted: 'À valider', validated: 'Validée', rejected: 'À corriger', mixed: 'Partielle', future: 'À venir', off: 'Non attendu', unknown: 'À saisir', unavailable: 'OnSite à raccorder' } as const
export const overviewCellSchema = z.object({ key: z.string(), minutes: z.number().nullable(), capacity_minutes: z.number().nullable(), status: z.enum(['missing', 'draft', 'submitted', 'validated', 'rejected', 'mixed', 'future', 'off', 'unknown', 'unavailable']), validated_weeks: z.number(), total_weeks: z.number(), missing_weeks: z.number(), sheets: z.array(z.object({ id: z.string(), week_start: z.string(), status: timeStatusSchema })) })
export const overviewDaySchema = z.object({ date: z.string(), holiday: z.string(), weekend: z.boolean(), absent: z.number(), minutes: z.number(), sheet_status: timeStatusSchema.nullable() })
export const overviewRowSchema = z.object({ days: overviewDaySchema.array(), employee: z.string(), has_photo: z.boolean(), photo_revision: z.string(), employee_name: z.string(), team_name: z.string(), work_type: z.string(), cells: overviewCellSchema.array(), total_minutes: z.number(), capacity_minutes: z.number().nullable() })
export const overviewSchema = z.object({ today: z.string(), summary: z.object({ minutes: z.number(), submitted: z.number(), validated: z.number(), rejected: z.number(), missing: z.number() }), area: z.enum(['own', 'review']), view: z.enum(['week', 'month', 'year']), start: z.string(), end: z.string(), periods: z.array(z.object({ key: z.string(), start: z.string(), end: z.string() })), items: overviewRowSchema.array(), totalItems: z.number(), totalPages: z.number(), page: z.number() })
export type TimeOverview = z.infer<typeof overviewSchema>
export type TimeOverviewCell = z.infer<typeof overviewCellSchema>
export type TimeOverviewRow = z.infer<typeof overviewRowSchema>
