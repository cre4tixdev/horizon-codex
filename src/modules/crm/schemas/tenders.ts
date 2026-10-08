import { z } from 'zod'
export const timezones = ['Europe/Paris', 'UTC', 'Europe/London', 'America/New_York', 'America/Montreal', 'Asia/Dubai', 'Asia/Tokyo', 'Africa/Casablanca'] as const
const id = z.string().regex(/^[a-z0-9]{15}$/)
const instant = z.iso.datetime({ precision: 3 }).or(z.literal(''))
const storedDate = z.string().transform((value) => value ? new Date(value.replace(' ', 'T')).toISOString() : '')
export const tenderInputSchema = z.object({ reference: z.string().trim().max(160), consultation_url: z.url({ protocol: /^https?$/ }).or(z.literal('')), status: id, publication_date: instant, submission_deadline: instant, timezone: z.enum(timezones), expected_result_date: instant, visit_required: z.boolean(), tags: z.array(id).max(50) })
export const tenderSchema = tenderInputSchema.extend({ id, opportunity: id.or(z.literal('')), archived_at: storedDate.default(''), order: z.number(), publication_date: storedDate, submission_deadline: storedDate, expected_result_date: storedDate, created: z.string(), updated: z.string() })
export const appointmentInputSchema = z.object({ kind: z.enum(['visit', 'hearing']), start: z.iso.datetime({ precision: 3 }), end: instant, timezone: z.enum(timezones), location: z.string().trim().max(500), notes: z.string().trim().max(5000), participants: z.array(id).max(50), status: z.enum(['planned', 'done', 'cancelled']) }).refine((value) => !value.end || value.end > value.start, { path: ['end'], message: 'La fin doit suivre le début.' })
export const appointmentSchema = appointmentInputSchema.safeExtend({ id, tender: id, start: storedDate, end: storedDate, created: z.string(), updated: z.string() })
export const depositedFileSchema = z.object({ event_id: id, filename: z.string().min(1) })
export const submissionInputSchema = z.object({ submitted_at: z.iso.datetime({ precision: 3 }), timezone: z.enum(timezones), notes: z.string().trim().max(5000), documents: z.array(depositedFileSchema).min(1, 'Sélectionnez les pièces déposées.').max(100) })
export const submissionSchema = submissionInputSchema.extend({ id, tender: id, version: z.number().int(), submitted_at: storedDate, submitted_by: id, created: z.string() })
export type Tender = z.infer<typeof tenderSchema>
export type TenderInput = z.infer<typeof tenderInputSchema>
export type Appointment = z.infer<typeof appointmentSchema>
export type AppointmentInput = z.infer<typeof appointmentInputSchema>
export type Submission = z.infer<typeof submissionSchema>
export type SubmissionInput = z.infer<typeof submissionInputSchema>
export const emptyTender = (): TenderInput => ({ reference: '', consultation_url: '', status: '', publication_date: '', submission_deadline: '', expected_result_date: '', timezone: 'Europe/Paris', visit_required: false, tags: [] })
export function tenderDraft(record?: Tender): TenderInput { return record ? tenderInputSchema.parse(record) : emptyTender() }
