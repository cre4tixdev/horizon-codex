const policy = require(`${__hooks}/lib/access-policy.js`)
const spaces = { affairs: 'Affaires', customers: 'Clients', suppliers: 'Fournisseurs', internal: 'Interne' }
const get = (app, table, id) => { if (typeof id !== 'string' || !/^[a-z0-9]{15}$/.test(id)) throw new BadRequestError('Référence GED invalide.'); try { return app.findRecordById(table, id) } catch { throw new ApiError(404, 'Document ou dossier introuvable.') } }
const guard = (app, user, action = 'read') => {
  const rights = policy.permissions(app, user)
  if (!rights.includes('documents.read') || action !== 'read' && (user.getString('erp_profile') === 'viewer' || !rights.includes(`documents.${action}`)) || action === 'settings' && !policy.settings(app, user)) throw new ForbiddenError('Accès à la GED refusé.')
}
const exact = (body, keys) => { if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((k) => !keys.includes(k))) throw new BadRequestError('Champs GED invalides.') }
const text = (v, max, required = false) => { if (typeof v !== 'string' || v.length > max || required && !v.trim()) throw new BadRequestError('Renseignez les informations du document.'); return v.trim() }
const revision = (r, updated) => { if (r.getString('updated') !== updated) throw new ApiError(409, 'Ce document a changé. Rechargez-le avant de continuer.') }
const acl = (user, r) => r.getString('visibility') === 'team' || r.getString('created_by') === user.id || r.getStringSlice('readers').includes(user.id)
const folder = (app, user, id, writable = false) => {
  if (!id) return null
  let current = get(app, 'documents_folders', id), first = current; const seen = new Set()
  while (current) {
    if (seen.has(current.id) || seen.size >= 8) throw new BadRequestError('Arborescence de dossiers invalide.')
    seen.add(current.id)
    if (!acl(user, current)) throw new ForbiddenError('Dossier hors de votre périmètre.')
    if (writable && !current.getBool('active')) throw new BadRequestError('Ce dossier est archivé.')
    current = current.getString('parent') ? get(app, 'documents_folders', current.getString('parent')) : null
  }
  return first
}
const links = (app, id) => { const rows = app.findRecordsByFilter('documents_links', 'document = {:id}', 'created,id', 11, 0, { id }); if (rows.length > 10) throw new BadRequestError('Trop de rattachements sur ce document.'); return rows }
const describe = (e, entity, id) => require(`${__hooks}/lib/activity-feed.js`).describeSource(e, entity, id)
const read = (e, id) => {
  guard(e.app, e.auth)
  const r = get(e.app, 'documents_files', id)
  if (!acl(e.auth, r)) throw new ForbiddenError('Document hors de votre périmètre.')
  folder(e.app, e.auth, r.getString('folder'))
  for (const link of links(e.app, r.id)) describe(e, link.getString('source_entity'), link.getString('source_record_id'))
  return r
}
const edit = (e, r, archive = false) => {
  guard(e.app, e.auth, 'write')
  if (r.getString('created_by') !== e.auth.id && !policy.permissions(e.app, e.auth).includes('documents.manage')) throw new ForbiddenError('Seul l’auteur ou un gestionnaire peut modifier ce document.')
  if (!archive && (r.getString('archived_at') || r.getBool('locked'))) throw new BadRequestError('Ce document est archivé ou figé.')
}
const author = (app, id) => require(`${__hooks}/lib/activity.js`).author(app, id).name
const versionDTO = (app, r) => ({ id: r.id, number: r.getInt('number'), filename: r.getString('original_name'), size: r.getInt('size'), note: r.getString('note'), author: author(app, r.getString('created_by')), created: r.getString('created') })
const folderPath = (app, id) => { const parts = []; for (let n = 0; id && n < 8; n++) { const r = get(app, 'documents_folders', id); parts.unshift(r.getString('name')); id = r.getString('parent') }; return parts.join(' / ') || 'Racine' }
const uniqueName = (app, table, name, id = '', space = '', parent = '') => {
  if (!['documents_categories', 'documents_folders'].includes(table)) throw new BadRequestError('Référentiel invalide.')
  const count = new DynamicModel({ total: 0 })
  app.db().newQuery(`SELECT COUNT(*) AS total FROM ${table} WHERE lower(name) = lower({:name}) AND id != {:id}${table === 'documents_folders' ? ' AND space = {:space} AND parent = {:parent}' : ''}`).bind({ name, id, space, parent }).one(count)
  if (count.total) throw new ApiError(409, 'Ce nom existe déjà dans ce classement.')
}
const dto = (e, r, detail = false) => {
  const category = r.getString('category') ? get(e.app, 'documents_categories', r.getString('category')).getString('name') : 'Sans catégorie'
  const v = get(e.app, 'documents_file_versions', r.getString('current_version'))
  if (v.getString('document') !== r.id) throw new BadRequestError('Version incohérente.')
  const result = { id: r.id, name: r.getString('name'), space: r.getString('space'), folder: r.getString('folder'), folder_name: folderPath(e.app, r.getString('folder')), category: r.getString('category'), category_name: category, tags: JSON.parse(r.getString('tags') || '[]'), description: r.getString('description'), visibility: r.getString('visibility'), readers: Array.from(r.getStringSlice('readers')), reader_names: Array.from(r.getStringSlice('readers')).map((id) => ({ value: id, label: author(e.app, id) })), created_by: r.getString('created_by'), author: author(e.app, r.getString('created_by')), locked: r.getBool('locked'), archived_at: r.getString('archived_at'), created: r.getString('created'), updated: r.getString('updated'), current: versionDTO(e.app, v), links: links(e.app, r.id).map((l) => describe(e, l.getString('source_entity'), l.getString('source_record_id'))) }
  if (detail) { const versions = e.app.findRecordsByFilter('documents_file_versions', 'document = {:id}', '-number', 1001, 0, { id: r.id }); if (versions.length > 1000) throw new BadRequestError('Trop de versions pour afficher cet historique.'); result.versions = versions.map((v) => versionDTO(e.app, v)) }
  return result
}
const denied = (err) => err.status === 403 || err.status === 404
const snapshot = (app, r) => ({ ...r.publicExport(), links: links(app, r.id).map((l) => ({ entity: l.getString('source_entity'), id: l.getString('source_record_id'), label: l.getString('label') })) })
const event = (e, r, before, message) => { policy.audit(e.app, 'documents_files', r.id, e.auth.id, before, snapshot(e.app, r), before ? 'update' : 'create'); require(`${__hooks}/lib/activity.js`).publish(e.app, r, e.auth.id, !before || before.current_version !== r.getString('current_version') ? 'document' : 'change', message, {}) }
module.exports = { policy, spaces, get, guard, exact, text, revision, uniqueName, acl, folder, links, describe, read, edit, dto, denied, snapshot, event }
