import { expect, it } from 'vitest'
import { organisationTree } from './organisation'
import { employeeSchema, emptyEmployee } from './employees'
const employee = (id: string, manager = '') => employeeSchema.parse({ ...emptyEmployee, id, first_name: id, last_name: 'Test', manager, collectionId: 'hr', avatar: '', updated: '', account_id: '', has_account: false, account_active: false })
it('relie les ressources sans compte et garde une racine si le responsable est hors périmètre', () => {
  const tree = organisationTree([employee('manager'), employee('child', 'manager'), employee('external', 'outside')])
  expect(tree.map((item) => item.employee.id)).toEqual(['manager', 'external'])
  expect(tree[0]?.children[0]?.employee.id).toBe('child')
})
it('rend un historique cyclique une seule fois sans boucle infinie', () => {
  const tree = organisationTree([employee('a', 'b'), employee('b', 'a')])
  expect(tree).toHaveLength(1)
  expect(tree[0]?.children[0]?.children).toEqual([])
})
