import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { filenameExample, type FileSettings } from './fileSettings'
type Patterns = FileSettings['patterns']
const filenames = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/document-filenames.js', 'utf8') + '\nmodule.exports', { module: { exports: {} }, BadRequestError: Error }) as { validate: (patterns: Patterns) => Patterns; filename: (app: unknown, type: string, fields: { number: string; date: string; company: string; opportunity?: string; opportunity_number?: string; title?: string; owner?: string; contact?: string }) => string }
const defaults: Patterns = { quote: 'Devis_{number}', sales_order: 'Commande_{number}', purchase_order: 'Achat_{number}', delivery_note: 'BL_{number}' }
function app(patterns: Patterns) { return { findFirstRecordByData: () => ({ getString: () => JSON.stringify(patterns) }) } }
describe('Noms des pièces PDF — règles serveur', () => {
  it('remplace les champs publics et conserve le numéro de pièce', () => {
    const patterns = { ...defaults, quote: 'Devis_{number}_{company}_{date}.pdf' }
    expect(filenames.filename(app(patterns), 'quote', { number: '00001-1', company: 'Société / Test', date: '2026-10-09' })).toBe('Devis_00001-1_Société - Test_2026-10-09.pdf')
    expect(filenames.filename(app(defaults), 'sales_order', { number: 'C00001', company: '', date: '' })).toBe('Commande_C00001.pdf')
  })
  it.each(['Devis', 'Devis_{secret}', '../{number}', 'Devis\n{number}', '{number}{number}{number}'])('refuse un format invalide : %s', (quote) => {
    expect(() => filenames.validate({ ...defaults, quote })).toThrow()
  })
  it('compose le nom avec client, opportunité et autres champs publics', () => {
    const patterns = { ...defaults, quote: 'Devis_{number}_{client}_{opportunity}_{date}' }
    expect(filenames.filename(app(patterns), 'quote', { number: '00001-1', company: 'EUROSPORT', date: '2026-10-09', opportunity: 'Nouvelle régie' })).toBe('Devis_00001-1_EUROSPORT_Nouvelle régie_2026-10-09.pdf')
    expect(filenames.filename(app({ ...defaults, quote: '{number}_{opportunity_number}_{title}_{owner}_{contact}' }), 'quote', { number: '00001-1', company: '', date: '', opportunity_number: '00001', title: 'Devis vidéo', owner: 'Alice', contact: 'Bob' })).toBe('00001-1_00001_Devis vidéo_Alice_Bob.pdf')
    expect(filenameExample('Offre_{number}_{client}_{opportunity}', 'quote')).toBe('Offre_00001-1_CVS_Studio broadcast.pdf')
  })
  it('borne les valeurs UTF-8 sans couper un caractère ni le numéro', () => {
    const result = filenames.filename(app({ ...defaults, quote: 'Devis_{number}_{company}' }), 'quote', { number: '00001-1', company: 'É'.repeat(100), date: '' })
    expect(result).toBe('Devis_00001-1_' + 'É'.repeat(40) + '.pdf')
    expect(Buffer.byteLength(result, 'utf8')).toBeLessThanOrEqual(224)
  })
  it('accepte plusieurs champs descriptifs longs et préserve le numéro placé à la fin', () => {
    const number = '1'.repeat(80)
    const result = filenames.filename(app({ ...defaults, quote: '{client}_{opportunity}_{title}_{number}' }), 'quote', { number, company: 'É'.repeat(100), opportunity: 'O'.repeat(100), title: 'T'.repeat(100), date: '' })
    expect(result.endsWith('_' + number + '.pdf')).toBe(true)
    expect(Buffer.byteLength(result, 'utf8')).toBeLessThanOrEqual(224)
  })
  it('refuse une pièce sans numéro et un type arbitraire', () => {
    expect(() => filenames.filename(app(defaults), 'quote', { number: '', company: '', date: '' })).toThrow()
    expect(() => filenames.filename(app(defaults), 'other', { number: '1', company: '', date: '' })).toThrow()
  })
})
