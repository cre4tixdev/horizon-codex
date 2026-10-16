import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import type { RichTextNode } from '../../../shared/schemas/richText'
const rich = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/rich-text.js', 'utf8') + '; module.exports', { module: { exports: {} }, BadRequestError: Error })
const content = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/messaging-content.js', 'utf8') + '; module.exports', { module: { exports: {} }, BadRequestError: Error, __hooks: '', require: () => rich }) as { resolve: (doc: RichTextNode, values: Record<string, string>) => RichTextNode; render: (doc: unknown) => { html: string; text: string }; recipients: (list: string[]) => string[]; replace: (value: string, values?: Record<string, string>) => string }
const provider = runInNewContext(readFileSync('pocketbase/pb_hooks/lib/mail-encoding.js', 'utf8') + '; module.exports', { module: { exports: {} } }) as { base64: (bytes: number[]) => string }
const doc = (text: string): RichTextNode => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })
describe('Messaging structured content', () => {
  it('resolves allowlisted variables as escaped text without executing HTML', () => {
    const resolved = content.resolve(doc('Bonjour {{ contact.prenom }}'), { 'contact.prenom': '<img src=x onerror=alert(1)> & CVS' })
    expect(content.render(resolved).html).toBe('<p>Bonjour &lt;img src=x onerror=alert(1)&gt; &amp; CVS</p>')
    expect(() => content.replace('{{utilisateur.secret}}')).toThrow('Variable inconnue')
    expect(() => content.render({ type: 'doc', content: [{ type: 'image', attrs: { src: 'javascript:alert(1)' } }] })).toThrow()
    expect(() => content.render(null)).toThrow('Contenu du message invalide')
  })
  it('rejects recipient header injection and normalizes duplicate addresses', () => {
    expect(content.recipients(['Client@Example.com', 'client@example.com'])).toEqual(['client@example.com'])
    expect(() => content.recipients(['client@example.com\r\nBcc: intrus@example.com'])).toThrow()
    expect(() => content.recipients(Array(51).fill('client@example.com'))).toThrow()
  })
  it('encodes attachment bytes exactly including binary zeros and final padding', () => {
    for (const bytes of [[], [0], [0, 255], [0, 255, 128], [1, 2, 3, 4, 250]]) expect(provider.base64(bytes)).toBe(Buffer.from(bytes).toString('base64'))
  })
})
