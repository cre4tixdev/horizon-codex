const identities = require(`${__hooks}/lib/merge-identities.js`)
const list = (e) => {
  const q = e.requestInfo().query, kind = q.kind || 'companies', rights = require(`${__hooks}/lib/access-policy.js`).permissions(e.app, e.auth)
  if (!['companies', 'people', 'products'].includes(kind)) throw new BadRequestError('Domaine de fusion invalide.')
  const domain = kind === 'products' ? 'inventory' : 'contacts'
  if (e.auth.getString('erp_profile') === 'viewer' || ['read', 'write', 'merge'].some((action) => !rights.includes(`${domain}.${action}`))) throw new ForbiddenError('La consultation, la modification et la fusion de ce domaine sont nécessaires.')
  const mode = q.mode || 'manual', page = Number(q.page || 1), sort = q.sort || 'name:asc'
  if (!['manual', 'duplicates'].includes(mode) || !Number.isInteger(page) || page < 1 || page > 100000 || !['name:asc', 'name:desc'].includes(sort) || Object.keys(q).some((key) => !['kind', 'mode', 'page', 'q', 'sort'].includes(key))) throw new BadRequestError('Critères de recherche invalides.')
  const adapter = require(`${__hooks}/lib/${kind === 'products' ? 'catalog' : 'contact'}-merge.js`)
  const records = adapter.identities(e.app, kind), needle = String(q.q || '').slice(0, 200).split(/\s+/).map(identities.normalize).filter(Boolean)
  const text = (r) => identities.normalize([r.label, r.detail, r.name, r.legal_name, r.email, r.manufacturer_ref, r.manufacturer, r.sku, r.siren, r.siret].filter(Boolean).join(' '))
  const matches = (value) => needle.every((word) => value.includes(word))
  const publicIdentity = (r) => ({ id: r.id, collectionId: r.collectionId, label: r.label, detail: r.detail })
  let result = mode === 'manual' ? records.filter((r) => matches(text(r))).map((r) => ({ id: r.id, left: publicIdentity(r), right: null, reasons: [], members: 1 })) : identities.suggestions(kind, records).filter((pair) => matches(text(pair.left) + ' ' + text(pair.right))).map((pair) => ({ id: pair.id, left: publicIdentity(pair.left), right: publicIdentity(pair.right), reasons: pair.reasons, members: pair.members }))
  result.sort((a, b) => (identities.normalize(a.left.label).localeCompare(identities.normalize(b.left.label)) || a.id.localeCompare(b.id)) * (sort === 'name:desc' ? -1 : 1))
  const totalItems = result.length, totalPages = Math.max(1, Math.ceil(totalItems / 25))
  return e.json(200, { items: result.slice((page - 1) * 25, page * 25), totalItems, totalPages, page, mode })
}
module.exports = { list }
