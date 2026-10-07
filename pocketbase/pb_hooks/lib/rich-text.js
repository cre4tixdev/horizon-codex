// Only the editor's structured content is stored; no arbitrary HTML or URL attributes.
module.exports = (document) => {
  if (JSON.stringify(document).length > 100000 || document.type !== 'doc') throw new BadRequestError('Description invalide ou trop longue.')
  let count = 0
  const nodes = ['doc', 'paragraph', 'text', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'hardBreak', 'horizontalRule']
  const visit = (node, depth) => {
    if (!node || typeof node !== 'object' || Array.isArray(node) || depth > 20 || ++count > 3000 || !nodes.includes(node.type) || Object.keys(node).some((key) => !['type', 'content', 'text', 'attrs', 'marks'].includes(key))) throw new BadRequestError('Description invalide.')
    if (node.text !== undefined && (node.type !== 'text' || typeof node.text !== 'string')) throw new BadRequestError('Texte invalide.')
    if (node.attrs) {
      if (typeof node.attrs !== 'object' || Array.isArray(node.attrs) || Object.keys(node.attrs).some((key) => !['level', 'start', 'type'].includes(key))) throw new BadRequestError('Attribut de description interdit.')
      if (node.attrs.level !== undefined && (node.type !== 'heading' || ![1, 2, 3].includes(node.attrs.level))) throw new BadRequestError('Titre invalide.')
      if (node.attrs.type !== undefined && (node.type !== 'orderedList' || ![null, '1', 'a', 'A', 'i', 'I'].includes(node.attrs.type))) throw new BadRequestError('Style de liste invalide.')
      if (node.attrs.start !== undefined && (node.type !== 'orderedList' || !Number.isInteger(node.attrs.start) || node.attrs.start < 1)) throw new BadRequestError('Liste invalide.')
    }
    if (node.marks !== undefined && (!Array.isArray(node.marks) || node.marks.length > 4 || node.marks.some((mark) => !mark || !['bold', 'italic', 'strike', 'underline'].includes(mark.type) || Object.keys(mark).some((key) => key !== 'type')))) throw new BadRequestError('Mise en forme invalide.')
    if (node.content !== undefined) {
      if (!Array.isArray(node.content)) throw new BadRequestError('Description invalide.')
      node.content.forEach((child) => visit(child, depth + 1))
    }
  }
  visit(document, 0)
  const blocks = []
  const inline = (node) => node.type === 'hardBreak' ? '\n' : node.text || (node.content || []).map(inline).join('')
  const text = (node) => { if (node.type === 'paragraph' || node.type === 'heading') blocks.push(inline(node)); else (node.content || []).forEach(text) }
  text(document)
  return blocks.join('\n').trim()
}
