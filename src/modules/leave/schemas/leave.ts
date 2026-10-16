import { z } from 'zod'
export const leaveStates = { draft: 'Brouillon', submitted: 'À valider', approved: 'Validé', rejected: 'Refusé', cancel_requested: 'Annulation demandée', cancelled: 'Annulé' }
export const leaveKinds = { paid: 'Congés payés', sick: 'Congés maladie', unpaid: 'Sans solde', recovery: 'Récupération', family: 'Événement familial' }
export const leaveTypeSchema = z.object({ id: z.string(), code: z.enum(['paid', 'sick', 'unpaid', 'recovery', 'family']), label: z.string(), tracked: z.boolean(), receipt_required: z.boolean() })
export const policySchema = z.object({ id: z.string(), updated: z.string(), weekdays: z.array(z.number()), holidays: z.array(z.string()), holiday_calendar: z.enum(['metropole', 'none']), working_holidays: z.array(z.string()) })
export const balanceSchema = z.object({ type: z.string(), label: z.string(), year: z.number(), allocated: z.number(), used: z.number(), pending: z.number(), remaining: z.number(), available: z.number() })
const choice = z.object({ id: z.string(), label: z.string() })
export const choicesSchema = z.object({ direct_declaration: z.boolean(), employee: z.string(), employee_name: z.string(), default_manager: z.string(), managers: z.array(choice), types: z.array(leaveTypeSchema), policy: policySchema, can_review: z.boolean(), can_allocate: z.boolean(), can_settings: z.boolean() })
export const inputSchema = z.object({ type: z.string().min(1), start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), start_half: z.enum(['am', 'pm']), end_half: z.enum(['am', 'pm']), reason: z.string().max(3000), manager: z.string() })
export const requestSchema = z.object({ id: z.string(), collectionId: z.string(), direct_declaration: z.boolean(), user: z.string(), employee: z.string(), employee_name: z.string(), manager_name: z.string(), type_label: z.string(), ...inputSchema.shape, duration: z.number(), breakdown: z.record(z.string(), z.number()), status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'cancel_requested', 'cancelled']), decision_reason: z.string(), attachments: z.array(z.string()), updated: z.string(), archived_at: z.string(), actions: z.array(z.string()), managers: z.array(choice) })
export const previewSchema = requestSchema.pick({ duration: true, breakdown: true })
export const listSchema = z.object({ items: z.array(requestSchema), page: z.number(), totalPages: z.number(), totalItems: z.number(), summary: z.record(z.string(), z.number()), balances: z.array(balanceSchema) })
export const allocationSchema = z.object({ id: z.string(), employee: z.string(), employee_name: z.string(), type: z.string(), type_label: z.string(), year: z.number(), days: z.number(), reason: z.string(), author_name: z.string(), created: z.string() })
export const allocationsSchema = z.object({ page: z.number(), totalItems: z.number(), totalPages: z.number(), employees: z.array(choice.extend({ active: z.boolean() })), items: z.array(allocationSchema), balances: z.array(balanceSchema) })
export const calendarSchema = z.object({ items: z.array(z.object({ id: z.string(), employee_name: z.string(), start_date: z.string(), end_date: z.string(), start_half: z.enum(['am', 'pm']), end_half: z.enum(['am', 'pm']), pending: z.boolean(), href: z.string() })) })
export type LeaveRequest = z.infer<typeof requestSchema>
export type LeaveInput = z.infer<typeof inputSchema>
export type LeaveChoices = z.infer<typeof choicesSchema>
export type LeaveBalance = z.infer<typeof balanceSchema>
export type AllocationInput = { employee: string; type: string; year: number; days: number; reason: string; creation_key: string }
export type PolicyInput = z.infer<typeof policySchema> & { types: { id: string; receipt_required: boolean }[] }
export const displayDays = (value: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)} j`
export const displayDate = (value: string) => new Date(value + 'T12:00:00Z').toLocaleDateString('fr-FR')
export const stateTone = (state: LeaveRequest['status']) => ({ draft: 'violet', submitted: 'amber', approved: 'green', rejected: 'pink', cancel_requested: 'amber', cancelled: 'navy' } as const)[state]
