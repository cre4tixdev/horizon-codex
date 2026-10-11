import { z } from 'zod'
import { tagToneSchema } from '../../../shared/schemas/tagTone'
export const manualEventInputSchema = z.object({
  title: z.string().trim().min(1, 'Indiquez un titre.').max(200), description: z.string().max(5000),
  start: z.iso.datetime(), end: z.iso.datetime().or(z.literal('')), all_day: z.boolean(),
  timezone: z.enum(['Europe/Paris', 'Europe/London', 'UTC', 'America/New_York', 'Asia/Dubai']),
  location: z.string().max(500), visibility: z.enum(['private', 'team']), tone: tagToneSchema, color: z.string().regex(/^#[0-9a-fA-F]{6}$/).or(z.literal('')),
}).refine((input) => !input.end || Date.parse(input.end) > Date.parse(input.start), { message: 'La fin doit être après le début.', path: ['end'] })
export const manualEventSchema = z.object({ id: z.string(), title: z.string(), description: z.string(), start: z.string(), end: z.string(), all_day: z.boolean(), timezone: manualEventInputSchema.shape.timezone, location: z.string(), visibility: z.enum(['private', 'team']), tone: tagToneSchema, color: z.string(), owner: z.string(), updated: z.string(), editable: z.boolean() })
export type ManualEventInput = z.infer<typeof manualEventInputSchema>
export type ManualEvent = z.infer<typeof manualEventSchema>
