// Explicit allowlists only; never interpolate a requested field into SQL.
function selection(input, allowed, fallback) {
  const value = String(input || fallback), field = value.replace(/^-/, '')
  return allowed.includes(field) ? { field, descending: value.startsWith('-') } : selection(fallback, allowed, fallback)
}
function sql(input, allowed, fallback) {
  const sort = selection(input, allowed, fallback)
  return (sort.descending ? '-' : '') + sort.field
}
function compare(left, right, descending) {
  const empty = (value) => value === null || value === undefined || value === ''
  if (empty(left) || empty(right)) return empty(left) === empty(right) ? 0 : empty(left) ? 1 : -1
  const order = typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'fr', { numeric: true, sensitivity: 'base' })
  return descending ? -order : order
}
function rows(items, input, allowed, fallback, value = (item, field) => item[field]) {
  const sort = selection(input, allowed, fallback)
  return items.sort((a, b) => compare(value(a, sort.field), value(b, sort.field), sort.descending) || String(a.id || '').localeCompare(String(b.id || '')))
}
function text(values) { return [...new Set(values.filter(Boolean).map(String))].sort((a, b) => compare(a, b, false)).join(' · ') }
module.exports = { selection, sql, compare, rows, text }
