import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { expect, it } from 'vitest'

type Snapshot = { status: string; record_id: string; fingerprint: string; before: Record<string, string | boolean> }
const compare = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/import-comparison.js', 'utf8') + '; module.exports', { module: { exports: {} } }) as (expected: Snapshot, actual: Snapshot) => null | { reason: string; fields: string[]; message: string }
const expected: Snapshot = { status: 'update', record_id: 'existing', fingerprint: 'before', before: { email: 'old@example.invalid', phone: '01', updated: 'initial' } }

it('distingue action, cible et snapshot sans exposer les valeurs des fiches', () => {
  expect(compare(expected, expected)).toBeNull()
  expect(compare(expected, { ...expected, status: 'conflict' })?.message).toContain('À résoudre')
  expect(compare(expected, { ...expected, record_id: 'other' })?.reason).toBe('target')
  const diff = compare(expected, { ...expected, fingerprint: 'after', before: { ...expected.before, email: 'new@example.invalid' } })
  expect(diff?.fields).toEqual(['email'])
  expect(diff?.message).toContain('E-mail')
  expect(diff?.message).not.toMatch(/old@|new@/)
})

it('signale une ancienne empreinte sans inventer une modification de champ', () => {
  const diff = compare(expected, { ...expected, fingerprint: 'after' })
  expect(diff?.fields).toEqual([])
  expect(diff?.message).toContain('empreinte')
})
