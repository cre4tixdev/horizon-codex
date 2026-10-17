import { z } from 'zod'
import { activitySourceHrefSchema as sourceHrefSchema } from '../../../core/activity/types/activity'
const metricTrendSchema = z.object({ step: z.enum(['day', 'week', 'month']), dates: z.array(z.iso.date()), series: z.array(z.object({ currency: z.string().regex(/^[A-Z]{3}$/), values: z.array(z.number().finite()) })) }).refine((trend) => trend.series.every((series) => series.values.length === trend.dates.length), 'Courbe incomplète.')
const metricSchema = z.object({ values: z.array(z.object({ currency: z.string().regex(/^[A-Z]{3}$/), amount: z.number(), count: z.number().int().nonnegative(), percent: z.number().nullable() })), description: z.string(), missing: z.number().int().nonnegative(), trend: metricTrendSchema.optional() })
export type DashboardMetric = z.infer<typeof metricSchema>
export const dashboardMetricsSchema = z.object({ from: z.string(), to: z.string(), forecast: metricSchema.nullable(), ordered: metricSchema.nullable(), margin: metricSchema.nullable(), committed: metricSchema.nullable() })
export const dashboardActivitySchema = z.object({ items: z.array(z.object({ id: z.string(), type: z.string(), body: z.string(), author: z.string(), created: z.string(), source: z.string(), href: sourceHrefSchema })) })

export const dashboardTasksSchema = z.object({ items: z.array(z.object({ id: z.string(), title: z.string(), due_date: z.string(), source: z.string(), href: sourceHrefSchema })) })
