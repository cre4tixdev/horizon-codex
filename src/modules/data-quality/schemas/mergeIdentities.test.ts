import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
type Identity = Record<string, string>
const matcher = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/merge-identities.js', 'utf8') + '; module.exports', { module: { exports: {} } }) as { normalize: (value: string) => string; suggestions: (kind: string, rows: Identity[]) => { id: string; reasons: string[]; members: number }[] }
describe('Suggestions de fusion', () => {
  it('rapproche nom usuel et raison sociale malgré casse et accents', () => {
    const groups = matcher.suggestions('companies', [{ id: '1', name: 'M6', legal_name: 'METROPOLE TELEVISION' }, { id: '2', name: 'Métropole Télévision' }])
    expect(groups).toHaveLength(1); expect(groups[0]?.reasons).toContain('Nom ou raison sociale identique')
  })
  it('ne crée ni auto-rapprochement ni paire répétée pour des indices multiples', () => {
    expect(matcher.suggestions('companies', [{ id: '1', name: 'Même nom', legal_name: 'Même nom' }])).toHaveLength(0)
    const rows = ['1', '2'].map((id) => ({ id, name: 'Même nom', legal_name: 'Même nom', siren: '123456789' }))
    const pairs = matcher.suggestions('companies', rows); expect(pairs).toHaveLength(1); expect(pairs[0]?.reasons).toHaveLength(2)
  })
  it('contextualise le nom des personnes par société mais conserve l’indice e-mail', () => {
    const rows = [{ id: '1', first_name: 'Alice', last_name: 'Martin', company: 'a' }, { id: '2', first_name: 'Alice', last_name: 'Martin', company: 'b' }]
    expect(matcher.suggestions('people', rows)).toHaveLength(0)
    expect(matcher.suggestions('people', rows.map((r) => ({ ...r, email: 'alice@example.invalid' })))).toHaveLength(1)
  })
  it('conserve les noms internationaux dans les indices et recherches', () => {
    expect(matcher.normalize('東京')).toBe('東京')
    expect(matcher.suggestions('companies', [{ id: '1', name: '東京' }, { id: '2', name: '東京' }])).toHaveLength(1)
  })
  it('préserve la ponctuation des adresses e-mail', () => {
    expect(matcher.suggestions('people', [{ id: '1', email: 'alice.martin@example.invalid' }, { id: '2', email: 'alice-martin@example.invalid' }])).toHaveLength(0)
  })
  it('distingue les marques et propose une référence fabricant commune', () => {
    const rows = [{ id: '1', name: 'Produit', brand: 'a', manufacturer_ref: 'REF-123', kind: 'equipment', base_unit: 'u' }, { id: '2', name: 'Autre nom', brand: 'a', manufacturer_ref: 'ref 123', kind: 'equipment', base_unit: 'u' }]
    expect(matcher.suggestions('products', rows)[0]?.reasons).toContain('Même marque et référence fabricant')
    expect(matcher.suggestions('products', [rows[0]!, { ...rows[1]!, brand: 'b' }])).toHaveLength(0)
  })
  it('garde un nombre linéaire de comparaisons pour un grand groupe', () => {
    const rows = Array.from({ length: 600 }, (_, id) => ({ id: String(id), name: 'Homonyme' }))
    const pairs = matcher.suggestions('companies', rows); expect(pairs).toHaveLength(599); expect(pairs[0]?.members).toBe(600)
  })
})
