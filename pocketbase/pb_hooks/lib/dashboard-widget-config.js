// Stored configuration never grants access: each source still runs through its owning module.
const object = (value) => value && typeof value === 'object' && !Array.isArray(value)
const keys = (value, allowed) => object(value) && Object.keys(value).every((key) => allowed.includes(key))
const text = (value, max) => typeof value === 'string' && value.length <= max && [...value].every((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)
const states = { opportunities: ['', 'open', 'won', 'completed', 'lost', 'cancelled'], quotes: ['', 'draft', 'validated', 'sent', 'rejected', 'cancelled'], orders: ['', 'confirmed', 'in_progress', 'completed'], invoices: ['', 'draft', 'validated', 'unpaid', 'overdue', 'cancelled'] }
const periods = ['dashboard', 'month', 'quarter', 'year', 'all']
const links = ['crm', 'quotes', 'orders', 'billing', 'time', 'leave', 'expenses', 'documents', 'calendar']
const data = (value) => keys(value, ['title', 'source', 'scope', 'status', 'search', 'company', 'companyLabel', 'period', 'presentation', 'limit']) && text(value.title, 80) && Object.hasOwn(states, value.source) && ['own', 'accessible'].includes(value.scope) && !(value.source === 'invoices' && value.scope === 'own') && states[value.source].includes(value.status) && text(value.search, 200) && typeof value.company === 'string' && /^([a-z0-9]{15})?$/.test(value.company) && text(value.companyLabel, 200) && periods.includes(value.period) && ['list', 'table', 'count'].includes(value.presentation) && Number.isInteger(value.limit) && value.limit >= 3 && value.limit <= 20
const validate = (value) => {
  if (!keys(value, ['title', 'period', 'data', 'pages', 'automatic', 'interval', 'scope', 'links']) || !text(value.title, 80) || !periods.includes(value.period) || !data(value.data) || !Array.isArray(value.pages) || !value.pages.length || value.pages.length > 12 || !value.pages.every(data) || typeof value.automatic !== 'boolean' || !Number.isInteger(value.interval) || value.interval < 5 || value.interval > 120 || !['own', 'team', 'company'].includes(value.scope) || !Array.isArray(value.links) || value.links.length > 9 || value.links.some((item) => !links.includes(item)) || new Set(value.links).size !== value.links.length) throw new BadRequestError('Configuration de widget invalide. Vérifiez ses données et ses pages.')
  return value
}

const defaultData = { title: '', source: 'opportunities', scope: 'accessible', status: '', search: '', company: '', companyLabel: '', period: 'all', presentation: 'list', limit: 7 }
const defaultPages = [['Opportunités', 'opportunities'], ['Devis', 'quotes'], ['Commandes clients', 'orders'], ['Factures', 'invoices']].map(([title, source]) => ({ ...defaultData, title, source }))
const defaultConfig = { title: '', period: 'dashboard', data: defaultData, pages: defaultPages, automatic: true, interval: 10, scope: 'own', links: ['crm', 'quotes', 'calendar'] }
const equals = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const compactData = (value) => Object.fromEntries(Object.entries(value).filter(([key, item]) => !equals(item, defaultData[key])))
// Persist only overrides: twelve ordinary dashboards must fit in the existing 64 KiB JSON field.
module.exports = (input) => {
  if (!keys(input, Object.keys(defaultConfig)) || input.data !== undefined && !keys(input.data, Object.keys(defaultData)) || Array.isArray(input.pages) && input.pages.some((page) => !keys(page, Object.keys(defaultData)))) throw new BadRequestError('Configuration de widget invalide.')
  const value = validate({ ...defaultConfig, ...input, data: { ...defaultData, ...input.data }, pages: Array.isArray(input.pages) ? input.pages.map((page) => ({ ...defaultData, ...page })) : input.pages === undefined ? defaultPages : input.pages }), output = {}
  for (const [key, item] of Object.entries(value)) {
    if (key === 'data') { const data = compactData(item); if (Object.keys(data).length) output.data = data }
    else if (key === 'pages') { if (item.length !== defaultPages.length || item.some((page, index) => Object.keys(defaultData).some((field) => page[field] !== defaultPages[index]?.[field]))) output.pages = item.map(compactData) }
    else if (!equals(item, defaultConfig[key])) output[key] = item
  }
  return output
}
