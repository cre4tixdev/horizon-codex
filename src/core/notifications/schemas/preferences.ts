import { z } from 'zod'
export const notificationTopics = {
  mentions: { label: 'Mentions', description: 'Lorsqu’un collègue vous mentionne dans une fiche.' },
  tasks: { label: 'Tâches assignées', description: 'Une tâche vous est confiée ou réaffectée.' },
  email_replies: { label: 'Réponses aux e-mails', description: 'Une réponse à un e-mail envoyé depuis Horizon est reçue.' },
  time_requests: { label: 'Temps à valider', description: 'Une feuille de temps attend votre validation.' },
  time_updates: { label: 'Suivi des temps', description: 'Validation, retour pour correction ou réouverture de vos feuilles.' },
  leave_requests: { label: 'Congés à valider', description: 'Une demande de congé ou d’annulation attend votre décision.' },
  leave_updates: { label: 'Suivi des congés', description: 'Décisions sur vos demandes et déclarations transmises aux RH.' },
  expense_requests: { label: 'Notes de frais à valider', description: 'Une note de frais attend votre décision.' },
  expense_updates: { label: 'Suivi des notes de frais', description: 'Validation, retour ou remboursement de vos notes.' },
  other_activity: { label: 'Autres alertes métier', description: 'Autres événements signalés par Horizon.' },
} as const
export const notificationTopicSchema = z.enum(['mentions', 'tasks', 'email_replies', 'leave_requests', 'leave_updates', 'expense_requests', 'expense_updates', 'time_requests', 'time_updates', 'other_activity'])
export const preferenceItemSchema = z.object({ event_type: notificationTopicSchema, in_app: z.boolean() }).strict()
export const notificationPreferencesSchema = z.object({ version: z.string(), items: z.array(preferenceItemSchema).length(notificationTopicSchema.options.length) }).strict().refine((v) => new Set(v.items.map((i) => i.event_type)).size === notificationTopicSchema.options.length, 'Préférences incomplètes.')
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>
