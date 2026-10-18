import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { expect, it } from 'vitest'

const nameKey = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/imports.js', 'utf8') + '; nameKey', { module: { exports: {} } }) as (type: string, plan: { data: Record<string, string>; before?: Record<string, string> }) => string

it('repère les homonymes malgré des e-mails différents sans confondre les sociétés des personnes', () => {
  expect(nameKey('companies', { data: { name: 'Même nom', email: 'a@example.invalid' } })).toBe(nameKey('companies', { data: { name: 'Même nom', email: 'b@example.invalid' } }))
  expect(nameKey('people', { data: { first_name: 'Alice', last_name: 'Martin', company: 'a' } })).not.toBe(nameKey('people', { data: { first_name: 'Alice', last_name: 'Martin', company: 'b' } }))
  expect(nameKey('people', { data: { first_name: 'Alice' }, before: { last_name: 'Martin', company: 'a' } })).toBe(nameKey('people', { data: { first_name: 'Alice', last_name: 'Martin', company: 'a' } }))
  expect(nameKey('companies', { data: {} })).toBe('')
})
