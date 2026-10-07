import { describe, expect, it } from 'vitest'
import { documentText, plainTextDocument, richTextSchema } from './richText'
describe('Structured descriptions', () => {
  it('preserves existing text, line breaks and literal markup without rendering HTML', () => {
    const text = 'Studio <script>alert(1)</script>\nDeuxième ligne'
    expect(documentText(plainTextDocument(text))).toBe(text)
  })
  it('projects formatted paragraphs and nested lists into readable text', () => {
    expect(documentText(richTextSchema.parse({ type: 'doc', content: [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Besoins', marks: [{ type: 'bold' }] }] }, { type: 'orderedList', attrs: { start: 1, type: null }, content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Caméras' }] }] }] }] }))).toBe('Besoins\nCaméras')
  })
  it('rejects raw HTML, remote images and arbitrary mark attributes', () => {
    expect(richTextSchema.safeParse({ type: 'image', attrs: { src: 'https://example.com' } }).success).toBe(false)
    expect(richTextSchema.safeParse({ type: 'text', text: 'x', marks: [{ type: 'bold', attrs: { onclick: 'alert(1)' } }] }).success).toBe(false)
  })
})
