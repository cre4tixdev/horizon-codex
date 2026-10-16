// Closed structured content: variables are text, never executable markup or URLs.
const variables = ['contact.prenom', 'contact.nom', 'societe.nom', 'affaire.titre', 'affaire.code', 'piece.numero', 'piece.titre', 'piece.montant', 'piece.devise', 'utilisateur.nom', 'expediteur.adresse']
const escape = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const replace = (s, values) => String(s).replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_, key) => { if (!variables.includes(key)) throw new BadRequestError(`Variable inconnue : ${key}`); return values ? String(values[key] || '') : `{{${key}}}` })
const validate = (doc) => { if (!doc || typeof doc !== 'object' || Array.isArray(doc)) throw new BadRequestError('Contenu du message invalide.'); return require(`${__hooks}/lib/rich-text.js`)(doc) }
const resolve = (doc, values) => { validate(doc); return JSON.parse(JSON.stringify(doc), (key, value) => key === 'text' ? replace(value, values) : value) }
const render = (doc) => {
  const text = validate(doc)
  const visit = (n) => {
    if (n.type === 'text') return (n.marks || []).reduce((v, mark) => { const tag = { bold: 'strong', italic: 'em', underline: 'u', strike: 's' }[mark.type]; return `<${tag}>${v}</${tag}>` }, escape(n.text || ''))
    if (n.type === 'hardBreak') return '<br>'
    if (n.type === 'horizontalRule') return '<hr>'
    const html = (n.content || []).map(visit).join(''), tag = { paragraph: 'p', heading: `h${n.attrs?.level || 1}`, bulletList: 'ul', orderedList: 'ol', listItem: 'li', blockquote: 'blockquote' }[n.type]
    return tag ? `<${tag}>${html || '<br>'}</${tag}>` : html
  }
  return { html: visit(doc), text }
}
const email = (v) => typeof v === 'string' && v.length <= 254 && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(v)
const recipients = (list) => { if (!Array.isArray(list) || list.length > 50 || list.some((v) => !email(v))) throw new BadRequestError('Adresses e-mail invalides (50 destinataires maximum).'); return [...new Set(list.map((v) => v.toLowerCase()))] }
module.exports = { variables, replace, resolve, render, email, recipients }
