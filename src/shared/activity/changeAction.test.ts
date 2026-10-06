import { expect, it } from 'vitest'
import { changeAction } from './changeAction'

it('ne confond pas un ancien retrait de rôle avec l’archivage de la fiche', () => {
  expect(changeAction({ body: 'Fiche archivée', metadata: { author: { name: 'Test', initials: 'T' }, action: 'archive', changes: [{ field: 'role_supplier', label: 'Relation Fournisseur', before: 'Oui', after: 'Non' }] } })).toBe('a modifié la fiche')
})

it('précise la création et les transitions de la fiche elle-même', () => {
  const metadata = { author: { name: 'Test', initials: 'T' }, action: 'update' }
  expect(changeAction({ body: 'Fiche créée', metadata })).toBe('a créé la fiche')
  for (const [after, label] of [['Archivé', 'a archivé la fiche'], ['Actif', 'a réactivé la fiche']]) {
    expect(changeAction({ body: 'Fiche mise à jour', metadata: { ...metadata, changes: [{ field: 'active', label: 'Statut', before: '', after: after! }] } })).toBe(label)
  }
})
