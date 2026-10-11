import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
const module = { exports: {} }
runInNewContext(readFileSync('pocketbase/pb_hooks/lib/catalog-barcode.js', 'utf8'), { module, BadRequestError: Error })
const barcode = module.exports as { base: (brand: string, reference: string) => string; allocate: (requested: string, exists: (code: string) => boolean) => string }
describe('Product barcode allocation', () => {
  it('takes three brand characters without spaces and preserves the reference', () => {
    expect(barcode.base('RS PRO', '178-8331')).toBe('RSP178-8331')
    expect(barcode.base(' n e u trik ', ' BNC-12G ')).toBe('NEUBNC-12G')
    expect(barcode.base('Éléctro', '0001')).toBe('ELE0001')
    expect(barcode.base('3M', 'abc')).toBe('3Mabc')
  })
  it('uses the first free suffix, including existing numbered codes', () => {
    expect(barcode.allocate('ABC', () => false)).toBe('ABC')
    expect(barcode.allocate('ABC', (code) => ['ABC', 'ABC1', 'ABC3'].includes(code))).toBe('ABC2')
    const code = 'A'.repeat(100)
    expect(barcode.allocate(code, (candidate) => candidate === code)).toBe('A'.repeat(99) + '1')
    expect(() => barcode.allocate('ABC', () => true)).toThrow(/unique/)
  })
})
