const keys = ['quote', 'sales_order', 'purchase_order', 'delivery_note']
const tokens = { number: 80, date: 10, company: 80, client: 80, opportunity: 40, opportunity_number: 20, title: 40, owner: 40, contact: 40 }
const tokenPattern = /\{(number|date|company|client|opportunity|opportunity_number|title|owner|contact)\}/g
const control = (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 || char.codePointAt(0) >= 0xd800 && char.codePointAt(0) <= 0xdfff
const byteLength = (value) => encodeURIComponent(value).replace(/%[0-9A-F]{2}/g, 'x').length
const clean = (value, limit) => {
  const valueClean = [...String(value || '')].map((char) => control(char) ? '-' : char).join('').replace(/[\\/<>:"|?*]/g, '-').replace(/\s+/g, ' ').replace(/^[. ]+|[. ]+$/g, '')
  let result = ''
  for (const char of valueClean) { if (byteLength(result + char) > limit) break; result += char }
  return result
}
module.exports = {
  validate(patterns) {
    if (!patterns || Array.isArray(patterns) || Object.keys(patterns).length !== keys.length || keys.some((key) => typeof patterns[key] !== 'string')) throw new BadRequestError('Formats de noms invalides.')
    const result = {}
    for (const key of keys) {
      const pattern = patterns[key].trim().replace(/\.pdf$/i, '')
      if (!pattern || pattern.length > 120 || (/[\\/<>:"|?*]/.test(pattern) || [...pattern].some(control)) || !pattern.includes('{number}') || /[{}]/.test(pattern.replace(tokenPattern, '')) || byteLength(pattern.replace(tokenPattern, (_, token) => token === 'number' ? 'x'.repeat(tokens.number) : '')) > 220) throw new BadRequestError('Chaque format doit contenir {number}. Champs autorisés : {number}, {date}, {company}, {client}, {opportunity}, {opportunity_number}, {title}, {owner}, {contact}, sans caractère de chemin (220 octets maximum après remplacement).')
      result[key] = pattern
    }
    return result
  },
  filename(app, type, fields) {
    if (!keys.includes(type)) throw new BadRequestError('Type de pièce non pris en charge.')
    const patterns = this.validate(JSON.parse(app.findFirstRecordByData('settings_document_files', 'key', 'default').getString('patterns')))
    const source = { ...fields, client: fields.client || fields.company, company: fields.company || fields.client }
    const values = Object.fromEntries(Object.entries(tokens).map(([token, limit]) => [token, clean(source[token], limit)]))
    if (!values.number) throw new BadRequestError('La pièce ne possède pas de numéro.')
    // Reserve the complete document number even when it is placed at the end.
    // Share the remaining UTF-8 budget between the descriptive fields if necessary.
    const pattern = patterns[type]
    const descriptive = [...pattern.matchAll(tokenPattern)].map((match) => match[1]).filter((token) => token !== 'number')
    const fixed = byteLength(pattern.replace(tokenPattern, (_, token) => token === 'number' ? values.number : ''))
    const size = descriptive.reduce((total, token) => total + byteLength(values[token]), 0)
    if (size > 220 - fixed) for (const token of new Set(descriptive)) values[token] = clean(values[token], Math.floor(byteLength(values[token]) * (220 - fixed) / size))
    return clean(pattern.replace(tokenPattern, (_, token) => values[token]), 220) + '.pdf'
  },
}
