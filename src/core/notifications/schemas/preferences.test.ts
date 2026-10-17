import { expect, it } from 'vitest'
import { notificationTopics, notificationPreferencesSchema } from './preferences'
const input = { version: 'revision', items: Object.keys(notificationTopics).map((event_type) => ({ event_type, in_app: true })) }
it('valide tous les événements sans accepter de doublon ou d’écriture de tiers/canal', () => {
  expect(notificationPreferencesSchema.safeParse(input).success).toBe(true)
  for (const invalid of [{ ...input, user: 'other' }, { ...input, items: [...input.items.slice(1), input.items[1]] }, { ...input, items: input.items.map((v) => ({ ...v, email: true })) }, { ...input, items: input.items.map((v) => ({ ...v, in_app: 'true' })) }]) expect(notificationPreferencesSchema.safeParse(invalid).success).toBe(false)
})
