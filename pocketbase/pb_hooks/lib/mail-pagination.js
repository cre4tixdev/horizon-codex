// Validate the destination only. Graph's query/skip token must remain byte-for-byte intact.
const inspect = (origin, input, accountId, address) => {
  const reject = (reason) => ({ url: null, reason })
  if (typeof input !== 'string' || !input) return reject('input')
  if (input.length > 10000) return reject('length')
  const url = input.startsWith('/') ? origin + input : input
  if (!url.startsWith(origin + '/')) return reject('origin')
  if (url.includes('#')) return reject('fragment')
  if (url.includes('\\') || Array.from(url).some((v) => v.charCodeAt(0) < 32 || v.charCodeAt(0) === 127)) return reject('control')
  let parts
  try { parts = url.slice(origin.length).split('?')[0].split('/').slice(1).map(decodeURIComponent) } catch { return reject('encoding') }
  if (parts.at(-1) === '') parts.pop()
  if (!parts.length) return reject('path')
  if (parts.some((v) => !v || Array.from(v).some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127) || /[\\?#%]/.test(v) || v.split('/').some((p) => p === '.' || p === '..'))) return reject('segments')
  const unquote = (v) => v.replace(/''/g, "'")
  const first = parts.shift()
  if (first.toLowerCase() !== 'me') {
    const odata = /^users\('((?:[^']|'')+)'\)$/i.exec(first)
    const user = /^users$/i.test(first) ? parts.shift() : odata ? unquote(odata[1]) : ''
    if (!/^users$/i.test(first) && !odata) return reject('principal_format')
    if (!user || !(user === accountId || /^[a-f\d-]{36}$/i.test(accountId || '') && user.toLowerCase() === accountId.toLowerCase() || address && user.toLowerCase() === address.toLowerCase())) return reject('mailbox')
  }
  const resource = parts[0]?.toLowerCase()
  if (resource === 'messages') {
    if (parts.length > 4 || parts.length > 2 && parts[2].toLowerCase() !== 'attachments') return reject('resource')
  } else if (resource === 'mailfolders') {
    if (parts.length !== 3 || parts[2].toLowerCase() !== 'messages') return reject('resource')
  } else if (/^mailfolders\('(?:[^']|'')+'\)$/i.test(parts[0] || '')) {
    if (parts.length !== 2 || parts[1].toLowerCase() !== 'messages') return reject('resource')
  } else return reject('resource')
  return { url, reason: '' }
}
module.exports = Object.assign((origin, input, accountId, address) => inspect(origin, input, accountId, address).url, { inspect })
