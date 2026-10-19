import { z } from 'zod'
export const states = { draft: 'Brouillon', submitted: 'À valider', returned: 'À corriger', validated: 'Validée', reimbursed: 'Remboursée', cancelled: 'Annulée' } as const
export const categoryModes = { general: 'Classique', meal: 'Restaurant / invités', travel: 'Trajet / séjour', fuel: 'Carburant / véhicule', purchase: 'Achat de matériel' } as const
export const categorySchema = z.object({ id: z.string(), code: z.string(), label: z.string(), mode: z.enum(['general', 'meal', 'travel', 'fuel', 'purchase']), active: z.boolean(), sort_order: z.number(), updated: z.string() })
export const vehicleInputSchema = z.object({ brand: z.string().trim().min(1).max(60), model: z.string().trim().min(1).max(80), registration: z.string().trim().min(2).max(30), employee: z.string().min(1), active: z.boolean() })
export const vehicleSchema = vehicleInputSchema.extend({ id: z.string(), updated: z.string(), label: z.string(), employee_name: z.string() })
export type ExpenseVehicle = z.infer<typeof vehicleSchema>
export type ExpenseVehicleInput = z.infer<typeof vehicleInputSchema>
export const lineInputSchema = z.object({ date: z.string(), category: z.string(), description: z.string().max(2000), company: z.string(), contact: z.string(), opportunity: z.string(), internal: z.boolean(), guests: z.array(z.string()), internal_guests: z.string().max(2000), route: z.string().max(500), vehicle: z.string().max(200), vehicle_record: z.string().default(''), payment_method: z.enum(['personal', 'company']), amount: z.number().min(0).max(10000000), tax_amount: z.number().min(0).max(10000000) }).refine((v) => v.tax_amount <= v.amount, 'La TVA doit être comprise dans le TTC.')
export const lineSchema = lineInputSchema.safeExtend({ id: z.string(), collectionId: z.string(), report: z.string(), position: z.number(), analytic_account: z.string(), receipt: z.array(z.string()), company_name: z.string(), contact_name: z.string(), opportunity_name: z.string(), opportunity_number: z.string().default(''), category_label: z.string(), guests_names: z.array(z.object({ id: z.string(), label: z.string() })), snapshot: z.unknown() })
export const reportSchema = z.object({ id: z.string(), user: z.string(), employee: z.string(), employee_name: z.string(), month: z.string(), title: z.string(), status: z.enum(['draft', 'submitted', 'returned', 'validated', 'reimbursed', 'cancelled']), validator: z.string(), validator_name: z.string(), supplement_of: z.string(), total: z.number(), tax: z.number(), reimbursable_total: z.number(), currency: z.literal('EUR'), notes: z.string(), return_reason: z.string(), submitted_at: z.string(), validated_at: z.string(), validated_by: z.string(), reimbursed_at: z.string(), reimbursement_date: z.string(), reimbursement_reference: z.string(), archived_at: z.string(), created: z.string(), updated: z.string(), lines: z.array(lineSchema), history: z.array(z.object({ id: z.string(), body: z.string(), created: z.string(), author_name: z.string(), metadata: z.record(z.string(), z.unknown()) })) })
const option = z.object({ id: z.string(), label: z.string() })
export const choicesSchema = z.object({ employee: z.string(), employee_name: z.string(), default_validator: z.string(), validators: z.array(option), vehicles: z.array(option).default([]), categories: z.array(categorySchema), companies: z.array(option), contacts: z.array(option.extend({ company: z.string() })), opportunities: z.array(option.extend({ number: z.string().default(''), company: z.string(), contact: z.string() })), can_team: z.boolean().default(false), can_review: z.boolean(), can_reimburse: z.boolean(), global: z.boolean() })
export const listSchema = z.object({ items: z.array(reportSchema), page: z.number(), totalItems: z.number(), totalPages: z.number(), summary: z.record(z.string(), z.number()) })
export type ExpenseReport = z.infer<typeof reportSchema>
export type ExpenseLine = z.infer<typeof lineSchema>
export type ExpenseInput = z.infer<typeof lineInputSchema>
export type ExpenseChoices = z.infer<typeof choicesSchema>
export type ExpenseCategory = z.infer<typeof categorySchema>
export type ReportInput = { month: string; notes: string; validator: string; supplement_of: string; creation_key: string }
export function monthLabel(month: string) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(month + '-01T12:00:00Z')) : month }
export function emptyExpense(month: string): ExpenseInput { return { date: month + '-01', category: '', description: '', company: '', contact: '', opportunity: '', internal: false, guests: [], internal_guests: '', route: '', vehicle: '', vehicle_record: '', payment_method: 'personal', amount: 0, tax_amount: 0 } }
export function expenseInput(line: ExpenseInput): ExpenseInput { const { date, category, description, company, contact, opportunity, internal, guests, internal_guests, route, vehicle, vehicle_record, payment_method, amount, tax_amount } = line; return { date, category, description, company, contact, opportunity, internal, guests, internal_guests, route, vehicle, vehicle_record, payment_method, amount, tax_amount } }

export const overviewStates = { ...states, missing: 'Non reçue', future: 'À venir', off: '—', mixed: 'Plusieurs états' } as const
const overviewReportSchema = z.object({ id: z.string(), status: reportSchema.shape.status, total: z.number(), supplement: z.boolean() })
export const overviewCellSchema = z.object({ month: z.string(), status: z.enum(['draft', 'submitted', 'returned', 'validated', 'reimbursed', 'cancelled', 'missing', 'future', 'off', 'mixed']), total: z.number(), reports: z.array(overviewReportSchema) })
export const overviewRowSchema = z.object({ employee: z.string(), employee_name: z.string(), team: z.string(), team_name: z.string(), cells: z.array(overviewCellSchema), total: z.number() })
export const overviewSchema = z.object({ view: z.enum(['month', 'quarter', 'year']), start: z.string(), end: z.string(), periods: z.array(z.string()), items: z.array(overviewRowSchema), page: z.number(), totalItems: z.number(), totalPages: z.number(), global: z.boolean(), summary: z.object({ submitted: z.number(), returned: z.number(), validated: z.number(), reimbursed: z.number(), missing: z.number(), total: z.number() }) })
export type ExpenseOverviewCell = z.infer<typeof overviewCellSchema>
export type ExpenseOverviewRow = z.infer<typeof overviewRowSchema>
export function expensePeriod(month: string, view: 'month' | 'quarter' | 'year', delta = 0) {
  const year = Number(month.slice(0, 4)), number = Number(month.slice(5)) - 1, first = view === 'year' ? 0 : view === 'quarter' ? Math.floor(number / 3) * 3 : number
  return new Date(Date.UTC(year, first + delta * (view === 'year' ? 12 : view === 'quarter' ? 3 : 1), 1)).toISOString().slice(0, 7)
}
