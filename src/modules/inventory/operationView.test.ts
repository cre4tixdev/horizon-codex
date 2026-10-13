import { describe, expect, it } from 'vitest'
import { operationView, changeOperationView } from './operationView'
describe('présentation des opérations', () => {
  it('ouvre le dashboard par défaut et reprend les anciens liens filtrés en liste', () => {
    expect(operationView(new URLSearchParams())).toBe('dashboard')
    expect(operationView(new URLSearchParams('kind=IN&status=open'))).toBe('list')
    expect(operationView(new URLSearchParams('view=dashboard&kind=IN'))).toBe('dashboard')
    expect(operationView(new URLSearchParams('view=list'))).toBe('list')
  })
  it('conserve les critères en changeant de présentation et remet la pagination à zéro', () => {
    const next = changeOperationView(new URLSearchParams('q=Studio&kind=IN&state=archived&sort=number&group=status&page=3'), 'dashboard')
    expect(next.get('q')).toBe('Studio'); expect(next.get('kind')).toBe('IN'); expect(next.get('state')).toBe('archived'); expect(next.get('sort')).toBe('number'); expect(next.get('group')).toBe('status'); expect(next.has('page')).toBe(false)
    expect(operationView(changeOperationView(next, 'list'))).toBe('list')
  })
})
