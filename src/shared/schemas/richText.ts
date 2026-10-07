import { z } from 'zod'
export type RichTextNode = { type: string; text?: string | undefined; attrs?: { level?: number | undefined; start?: number | undefined; type?: '1' | 'a' | 'A' | 'i' | 'I' | null | undefined } | undefined; marks?: { type: string }[] | undefined; content?: RichTextNode[] | undefined }
export const richTextSchema: z.ZodType<RichTextNode> = z.lazy(() => z.object({
  type: z.enum(['doc', 'paragraph', 'text', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'hardBreak', 'horizontalRule']),
  text: z.string().optional(), attrs: z.object({ level: z.number().int().min(1).max(3).optional(), start: z.number().int().min(1).optional(), type: z.enum(['1', 'a', 'A', 'i', 'I']).nullable().optional() }).strict().optional(),
  marks: z.array(z.object({ type: z.enum(['bold', 'italic', 'strike', 'underline']) }).strict()).max(4).optional(), content: z.array(richTextSchema).optional(),
}).strict())
export function plainTextDocument(text: string): RichTextNode { return { type: 'doc', content: text.split('\n').map((line) => ({ type: 'paragraph', ...(line ? { content: [{ type: 'text', text: line }] } : {}) })) } }

export function documentText(document: RichTextNode): string {
  const blocks: string[] = []
  const inline = (node: RichTextNode): string => node.type === 'hardBreak' ? '\n' : node.text || (node.content || []).map(inline).join('')
  const visit = (node: RichTextNode) => { if (node.type === 'paragraph' || node.type === 'heading') blocks.push(inline(node)); else node.content?.forEach(visit) }
  visit(document)
  return blocks.join('\n').trim()
}
