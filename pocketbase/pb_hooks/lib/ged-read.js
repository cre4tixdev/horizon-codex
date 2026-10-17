const c = require(`${__hooks}/lib/ged-common.js`)
module.exports = {
  list(e) {
    c.guard(e.app, e.auth)
    const q = e.requestInfo().query, space = String(q.space || 'internal'), state = String(q.state || 'active'), search = String(q.q || '').trim(), page = Number(q.page || 1), sort = String(q.sort || '-updated'), group = String(q.group || 'source'), category = String(q.category || '').split(',').filter(Boolean), kinds = String(q.kind || '').split(',').filter(Boolean)
    if (space !== 'all' && !c.spaces[space] || !['active', 'archived'].includes(state) || !['none', 'source', 'theme', 'category', 'folder', 'kind', 'author', 'affair', 'company'].includes(group) || !['name', '-name', 'updated', '-updated', 'created', '-created', 'size', '-size', 'category_name', '-category_name', 'type_label', '-type_label', 'author', '-author', 'number', '-number'].includes(sort) || !Number.isInteger(page) || page < 1 || page > 1000000 || search.length > 200 || category.some((id) => !/^[a-z0-9]{15}$/.test(id)) || kinds.some((v) => !['pdf', 'image', 'office', 'text'].includes(v))) throw new BadRequestError('Critères GED invalides.')
    if (q.folder) { const folder = c.folder(e.app, e.auth, String(q.folder)); if (space !== 'all' && folder.getString('space') !== space) throw new BadRequestError('Dossier d’un autre espace.') }
    const scope = require(`${__hooks}/lib/ged-scope.js`).scope(e, q)
    const records = require(`${__hooks}/lib/ged-scope.js`).manual(e, scope, q)
    const rows = [], candidates = []
    const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[_-]+/g, ' ')
    const words = normalize(search).split(/\s+/).filter(Boolean)
    const classification = require(`${__hooks}/lib/ged-classification.js`), classificationCache = new Map()
    const themes = Object.keys(classification.labels), selectedThemes = String(q.theme || '').split(',').filter(Boolean)
    if (selectedThemes.some((v) => !themes.includes(v))) throw new BadRequestError('Thème documentaire invalide.')
    for (const r of records) {
      try { c.read(e, r.id) } catch (err) { if (c.denied(err)) continue; throw err }
      candidates.push(c.dto(e, r))
    }
    if (!q.folder) candidates.push(...require(`${__hooks}/lib/ged-business.js`).list(e, scope))
    if (candidates.length > 10000) throw new BadRequestError('Trop de documents pour la bibliothèque. Choisissez un dossier.')
    for (const row of candidates) {
      if (!scope.active && !q.folder && space !== 'internal' && space !== 'all' && row.space !== space || (state === 'archived') !== Boolean(row.archived_at) || category.length && !category.includes(row.category)) continue
      const ext = row.current.filename.split('.').pop().toLowerCase()
      row.kind = ext === 'pdf' ? 'pdf' : ['png', 'jpg', 'jpeg', 'webp'].includes(ext) ? 'image' : ['txt', 'csv'].includes(ext) ? 'text' : 'office'
      classification.classify(e, row, classificationCache)
      const haystack = normalize([row.name, row.description, row.author, row.current.filename, row.category_name, row.folder_name, row.source_label, ...row.tags, ...row.links.map((l) => l.label)].join(' '))
      if (kinds.length && !kinds.includes(row.kind) || selectedThemes.length && !selectedThemes.includes(row.theme) || !words.every((word) => haystack.includes(word))) continue
      rows.push(row)
    }
    const field = sort.replace(/^-/, ''), value = (r) => field === 'size' ? r.current.size : field === 'number' ? r.current.number : r[field]
    rows.sort((a, b) => { const x = value(a), y = value(b); return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'fr', { sensitivity: 'base', numeric: true })) * (sort.startsWith('-') ? -1 : 1) || a.id.localeCompare(b.id) })
    const groups = {}
    for (const r of rows) {
      const affair = r.links.find((l) => l.entity === 'crm_opportunities'), company = r.links.find((l) => l.entity === 'contacts_companies')
      const identity = group === 'source' ? [r.source_key, r.source_label] : group === 'affair' ? [affair?.id || 'affair:none', affair?.label || 'Sans affaire'] : group === 'company' ? [company?.id || 'company:none', company?.label || 'Sans société'] : group === 'theme' ? [r.theme, r.theme] : group === 'category' ? [r.category || 'category:none', r.category_name] : group === 'folder' ? [r.folder || 'folder:root', r.folder_name] : group === 'kind' ? [r.kind, r.kind] : [r.created_by || 'author:none', r.author]
      r.group_key = identity[0]; r.group_label = identity[1]; groups[r.group_key] = (groups[r.group_key] || 0) + 1
    }
    return e.json(200, { items: rows.slice((page - 1) * 20, page * 20), totalItems: rows.length, totalPages: Math.ceil(rows.length / 20), page, groups })
  },
  context(e) { c.guard(e.app, e.auth); const q = e.requestInfo().query; if (!['crm_opportunities', 'contacts_companies'].includes(String(q.entity))) throw new BadRequestError('Contexte documentaire invalide.'); return e.json(200, c.describe(e, String(q.entity), String(q.id))) },
  record(e) { const id = e.request.pathValue('id'); return e.json(200, id.startsWith('linked-') ? require(`${__hooks}/lib/ged-business.js`).read(e, id).dto : c.dto(e, c.read(e, id), true)) },
  file(e) {
    if (e.request.pathValue('id').startsWith('linked-')) return require(`${__hooks}/lib/ged-business.js`).file(e, e.request.pathValue('id'), e.request.pathValue('version'))
    const r = c.read(e, e.request.pathValue('id')), v = c.get(e.app, 'documents_file_versions', e.request.pathValue('version'))
    if (v.getString('document') !== r.id) throw new ApiError(404, 'Version introuvable.')
    e.response.header().set('Cache-Control', 'no-store'); e.response.header().set('X-Content-Type-Options', 'nosniff')
    const fs = e.app.newFilesystem()
    try { return fs.serve(e.response, e.request, v.baseFilesPath() + '/' + v.getString('file'), v.getString('original_name')) } finally { fs.close() }
  },
  choices(e) {
    c.guard(e.app, e.auth)
    const folders = e.app.findRecordsByFilter('documents_folders', '', 'name,id', 1001, 0)
    if (folders.length > 1000) throw new BadRequestError('Trop de dossiers pour afficher l’arborescence.')
    const visible = folders.filter((r) => { try { c.folder(e.app, e.auth, r.id); return true } catch (err) { if (c.denied(err)) return false; throw err } })
    return e.json(200, { folders: visible.map((r) => ({ id: r.id, name: r.getString('name'), space: r.getString('space'), parent: r.getString('parent'), visibility: r.getString('visibility'), readers: Array.from(r.getStringSlice('readers')), active: r.getBool('active'), reader_names: Array.from(r.getStringSlice('readers')).map((id) => ({ value: id, label: require(`${__hooks}/lib/activity.js`).author(e.app, id).name })), created_by: r.getString('created_by'), updated: r.getString('updated') })), categories: e.app.findRecordsByFilter('documents_categories', '', 'name,id', 1001, 0).map((r) => ({ id: r.id, name: r.getString('name'), active: r.getBool('active'), updated: r.getString('updated') })) })
  },
  search(e) {
    c.guard(e.app, e.auth)
    const q = e.requestInfo().query, term = String(q.q || '').trim(), kind = String(q.kind || '')
    if (term.length > 100) throw new BadRequestError('Recherche trop longue.')
    if (kind === 'users') {
      const users = e.app.findRecordsByFilter('core_users', 'active = true && role.active = true && role.permissions ~ {:permission} && name ~ {:q}', 'name,id', 20, 0, { permission: '"documents.read"', q: term })
      return e.json(200, { items: users.map((r) => ({ value: r.id, label: r.getString('name') })) })
    }
    const sources = { crm_opportunities: ['title', 'opportunity_number'], contacts_companies: ['name'], sales_quotes: ['title', 'quote_number'], purchasing_requests: ['title', 'request_number'], purchasing_orders: ['order_number'], inventory_operations: ['number'], billing_invoices: ['title', 'number'], billing_supplier_invoices: ['title', 'number', 'supplier_invoice_number'], billing_credit_notes: ['title', 'number'], billing_supplier_credit_notes: ['title', 'number', 'supplier_invoice_number'] }, fields = sources[kind]
    if (!fields) throw new BadRequestError('Type de rattachement invalide.')
    const rows = e.app.findRecordsByFilter(kind, fields.map((f) => `${f} ~ {:q}`).join(' || '), '-created,id', 200, 0, { q: term }), items = []
    for (const r of rows) { try { const s = c.describe(e, kind, r.id); items.push({ value: s.id, label: s.label }) } catch (err) { if (!c.denied(err)) throw err }; if (items.length === 20) break }
    return e.json(200, { items })
  },
}
