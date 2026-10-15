import { describe, expect, it } from 'vitest'
import { operationState } from './operationPresentation'
describe('Présentation des états Stock', () => {
  it('distingue le brouillon de la réception fournisseur en attente', () => {
    const draft = { status: 'draft', kind: 'IN', purchase_order: '', archived_at: '' } as const
    expect(operationState(draft)).toEqual({ label: 'Brouillon', tone: 'violet' })
    expect(operationState({ ...draft, purchase_order: 'order' })).toEqual({ label: 'En attente', tone: 'amber' })
    expect(operationState({ ...draft, kind: 'OUT', purchase_order: 'order' })).toEqual({ label: 'Brouillon', tone: 'violet' })
  })
  it('conserve les couleurs des réalisations et archives', () => {
    const receipt = { status: 'done', kind: 'IN', purchase_order: 'order', archived_at: '' } as const
    expect(operationState(receipt)).toEqual({ label: 'Réalisée', tone: 'green' })
    expect(operationState({ ...receipt, archived_at: '2026-10-15' })).toEqual({ label: 'Archivée', tone: 'navy' })
  })
})
