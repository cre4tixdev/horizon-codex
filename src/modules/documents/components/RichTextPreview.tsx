import { createElement, type ReactNode } from 'react'
import type { RichTextNode } from '../../../shared/schemas/richText'
import { textStyle } from './textStyle'
import type { TextStyle } from '../schemas/templates'
export function RichTextPreview({ content, headings }: { content: RichTextNode; headings: TextStyle[] }) {
  function render(node: RichTextNode, key: number): ReactNode {
    if (node.type === 'text') return (node.marks || []).reduce<ReactNode>((value, mark) => createElement(({ bold: 'strong', italic: 'em', underline: 'u', strike: 's' })[mark.type] || 'span', { key: mark.type }, value), node.text)
    const children = node.content?.map(render)
    if (node.type === 'doc') return children
    if (node.type === 'hardBreak') return <br key={key} />
    if (node.type === 'horizontalRule') return <hr key={key} />
    const tag = ({ paragraph: 'p', heading: `h${node.attrs?.level || 2}`, bulletList: 'ul', orderedList: 'ol', listItem: 'li', blockquote: 'blockquote' })[node.type] || 'span'
    const heading = node.type === 'heading' ? headings[(node.attrs?.level || 2) - 1] : undefined
    return createElement(tag, { key, ...(heading ? { style: textStyle(heading) } : {}), ...(node.type === 'orderedList' ? { start: node.attrs?.start, type: node.attrs?.type || undefined } : {}) }, children)
  }
  return <>{render(content, 0)}</>
}
