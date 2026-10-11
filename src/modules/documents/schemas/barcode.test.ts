import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
const module = { exports: {} }
runInNewContext(readFileSync('pocketbase/pb_hooks/lib/document-barcode.js', 'utf8'), { module, BadRequestError: Error })
const barcode = module.exports as { encode: (value: string) => number[]; svg: (value: string, width: number, height: number) => string }
describe('Code 128', () => {
  it('uses B for printable ASCII and C for paired digits, with weighted modulo 103 checksum', () => {
    expect(barcode.encode('ABC')).toEqual([104, 33, 34, 35, 1, 106])
    expect(barcode.encode('001234')).toEqual([105, 0, 12, 34, 25, 106])
    expect(barcode.encode('1')[0]).toBe(104)
  })
  it('preserves leading digits, quiet zones and escapes text in SVG', () => {
    expect(barcode.svg('001234', 249, 50)).toContain('viewBox="0 0 88 100"')
    expect(barcode.svg('A<&', 249, 50)).toContain('aria-label="A&lt;&amp;"')
    expect(barcode.svg('ABC', 249, 50)).toContain('<rect x="10"')
  })
  it('rejects unsupported characters and bars too small to print reliably', () => {
    expect(() => barcode.encode('é')).toThrow()
    expect(() => barcode.encode('')).toThrow()
    expect(() => barcode.encode('A\nB')).toThrow()
    expect(() => barcode.svg('012345678901', 40, 50)).toThrow(/Agrandissez/)
  })
})
