import { describe, expect, it } from 'vitest'
import { activitySourcePaths } from '../../../core/activity/types/activity'
import { dashboardActivitySchema } from './dashboard'
const event = { id: 'event', type: 'document', body: 'Document ajouté', author: 'Utilisateur', created: '2026-10-17 10:00:00Z', source: 'Pièce', href: '' }
describe('Activité récente du dashboard', () => {
  it.each(Object.entries(activitySourcePaths))('accepte les liens autorisés du fil %s', (_, prefix) => {
    const href = `${prefix}abcdefghijklmno`
    expect(dashboardActivitySchema.parse({ items: [{ ...event, href }] }).items[0]?.href).toBe(href)
  })
  it.each(['https://example.com/documents/abcdefghijklmno', '//example.com/abcdefghijklmno', '/documents/../settings', '/documents/abcdefghijklmno/extra', '/unknown/abcdefghijklmno', '/documents/abcdefghijklmno?token=secret'])('refuse une destination invalide %s', (href) => {
    expect(dashboardActivitySchema.safeParse({ items: [{ ...event, href }] }).success).toBe(false)
  })
  it('préserve le résumé complet lorsqu’un dépôt GED suit une activité CRM', () => {
    expect(dashboardActivitySchema.parse({ items: [{ ...event, href: '/crm/opportunities/abcdefghijklmno' }, { ...event, href: '/documents/abcdefghijklmno' }] }).items).toHaveLength(2)
  })
})
