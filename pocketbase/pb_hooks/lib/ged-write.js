const c = require(`${__hooks}/lib/ged-common.js`)
const metadataKeys = ['name', 'space', 'folder', 'category', 'tags', 'description', 'visibility', 'readers', 'links']
const input = (e, raw, currentCategory = '') => {
  c.exact(raw, metadataKeys)
  const space = String(raw.space || ''), visibility = String(raw.visibility || '')
  if (!c.spaces[space] || !['team', 'restricted'].includes(visibility) || !Array.isArray(raw.readers) || raw.readers.length > 100 || !Array.isArray(raw.tags) || raw.tags.length > 10 || !Array.isArray(raw.links) || raw.links.length > 10) throw new BadRequestError('Classement ou accès invalide.')
  const folder = c.folder(e.app, e.auth, raw.folder || '', true)
  if (folder && folder.getString('space') !== space) throw new BadRequestError('Le dossier appartient à un autre espace.')
  if (raw.category && raw.category !== currentCategory && !c.get(e.app, 'documents_categories', raw.category).getBool('active')) throw new BadRequestError('Cette catégorie est archivée.')
  const readers = [...new Set(raw.readers)]
  for (const id of readers) { const u = c.get(e.app, 'core_users', id); c.guard(e.app, u) }
  const links = raw.links.map((l) => { c.exact(l, ['entity', 'id']); return c.describe(e, l.entity, l.id) })
  if (new Set(links.map((l) => `${l.entity}:${l.id}`)).size !== links.length) throw new BadRequestError('Rattachement en double.')
  return { values: { name: c.text(raw.name, 255), space, folder: folder?.id || '', category: raw.category || '', tags: [...new Set(raw.tags.map((v) => c.text(v, 40, true)))], description: c.text(raw.description || '', 4000), visibility, readers }, links }
}
const upload = (e, single = false) => {
  const files = e.findUploadedFiles('files')
  if (!files.length || files.length > (single ? 1 : 10) || files.reduce((sum, f) => sum + f.size, 0) > 25165824 || files.some((f) => f.size > 10485760 || f.originalName.length > 255 || Array.from(f.originalName).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127 || char === '/' || char === '\\') || !/\.(pdf|png|jpe?g|webp|txt|csv|docx?|xlsx?|pptx?)$/i.test(f.originalName))) throw new BadRequestError('Choisissez 1 à 10 fichiers autorisés, 10 Mo chacun et 24 Mo au total.')
  return files
}
const addVersion = (e, r, file, note) => {
  const latest = e.app.findRecordsByFilter('documents_file_versions', 'document = {:id}', '-number', 1, 0, { id: r.id })[0]
  const v = new Record(e.app.findCollectionByNameOrId('documents_file_versions'))
  for (const [key, value] of Object.entries({ document: r.id, number: (latest?.getInt('number') || 0) + 1, file, original_name: file.originalName, size: file.size, note, created_by: e.auth.id })) v.set(key, value)
  e.app.save(v); r.set('current_version', v.id); e.app.save(r)
}
const setLinks = (e, r, links) => {
  for (const old of c.links(e.app, r.id)) e.app.delete(old)
  for (const link of links) { const l = new Record(e.app.findCollectionByNameOrId('documents_links')); for (const [k, v] of Object.entries({ document: r.id, source_module: link.module, source_entity: link.entity, source_record_id: link.id, label: link.label })) l.set(k, v); e.app.save(l) }
}
module.exports = {
  upload(e) {
    c.guard(e.app, e.auth, 'write'); const body = e.requestInfo().body; c.exact(body, ['input'])
    let raw; try { raw = JSON.parse(body.input) } catch { throw new BadRequestError('Informations du dépôt invalides.') }
    const files = upload(e), saved = []
    e.app.runInTransaction((app) => {
      const tx = { app, auth: e.auth, requestInfo: () => e.requestInfo() }, parsed = input(tx, raw)
      for (const file of files) {
        const r = new Record(app.findCollectionByNameOrId('documents_files'))
        for (const [key, value] of Object.entries({ ...parsed.values, name: files.length === 1 && parsed.values.name ? parsed.values.name : file.originalName, created_by: e.auth.id, locked: false })) r.set(key, value)
        app.save(r); addVersion(tx, r, file, 'Dépôt initial'); setLinks(tx, r, parsed.links); c.event(tx, r, null, 'Document ajouté à la GED'); saved.push(c.dto(tx, r, true))
      }
    })
    return e.json(200, { items: saved })
  },
  save(e) {
    const b = e.requestInfo().body; c.exact(b, ['updated', 'input']); let saved
    e.app.runInTransaction((app) => {
      const tx = { app, auth: e.auth, requestInfo: () => e.requestInfo() }, r = c.read(tx, e.request.pathValue('id')); c.edit(tx, r); c.revision(r, b.updated)
      const before = c.snapshot(app, r), parsed = input(tx, b.input, r.getString('category'))
      if (!parsed.values.name) throw new BadRequestError('Le nom du document est obligatoire.')
      for (const [key, value] of Object.entries(parsed.values)) r.set(key, value)
      app.save(r); setLinks(tx, r, parsed.links); c.event(tx, r, before, 'Classement ou accès du document mis à jour'); saved = c.dto(tx, r, true)
    }); return e.json(200, saved)
  },
  version(e) {
    const b = e.requestInfo().body; c.exact(b, ['updated', 'note']); const file = upload(e, true)[0], note = c.text(b.note || '', 1000, true); let saved
    e.app.runInTransaction((app) => { const tx = { app, auth: e.auth, requestInfo: () => e.requestInfo() }, r = c.read(tx, e.request.pathValue('id')); c.edit(tx, r); c.revision(r, b.updated); c.folder(app, e.auth, r.getString('folder'), true); const before = c.snapshot(app, r); addVersion(tx, r, file, note); c.event(tx, r, before, 'Nouvelle version du document'); saved = c.dto(tx, r, true) }); return e.json(200, saved)
  },
  archive(e) {
    const b = e.requestInfo().body; c.exact(b, ['updated', 'archived']); if (typeof b.archived !== 'boolean') throw new BadRequestError('Archivage invalide.'); let saved
    e.app.runInTransaction((app) => { const tx = { app, auth: e.auth, requestInfo: () => e.requestInfo() }, r = c.read(tx, e.request.pathValue('id')); c.edit(tx, r, true); c.revision(r, b.updated); const before = c.snapshot(app, r); if (!b.archived) c.folder(app, e.auth, r.getString('folder'), true); r.set('archived_at', b.archived ? new Date().toISOString() : ''); app.save(r); c.event(tx, r, before, b.archived ? 'Document archivé' : 'Document réactivé'); saved = c.dto(tx, r, true) }); return e.json(200, saved)
  },
  folder(e) {
    c.guard(e.app, e.auth, 'write'); const b = e.requestInfo().body; c.exact(b, ['id', 'updated', 'name', 'space', 'parent', 'visibility', 'readers', 'active']); let saved
    e.app.runInTransaction((app) => {
      const tx = { app, auth: e.auth, requestInfo: () => e.requestInfo() }, parsed = input(tx, { name: b.name, space: b.space, folder: b.parent || '', category: '', tags: [], description: '', visibility: b.visibility, readers: b.readers, links: [] })
      const r = b.id ? c.folder(app, e.auth, b.id) : new Record(app.findCollectionByNameOrId('documents_folders')), before = b.id ? r.publicExport() : null
      if (b.id) { c.revision(r, b.updated); if (r.getString('created_by') !== e.auth.id && !c.policy.permissions(app, e.auth).includes('documents.manage')) throw new ForbiddenError('Gestion du dossier refusée.'); if (r.getString('space') !== b.space || r.getString('parent') !== (b.parent || '')) throw new BadRequestError('L’espace et le parent du dossier sont conservés.') }
      const name = c.text(b.name, 120, true); c.uniqueName(app, 'documents_folders', name, b.id || '', b.space, b.parent || '')
      if (typeof b.active !== 'boolean') throw new BadRequestError('État de dossier invalide.')
      if (!b.active && b.id && (app.findRecordsByFilter('documents_files', 'folder = {:id} && archived_at = ""', '', 1, 0, { id: r.id }).length || app.findRecordsByFilter('documents_folders', 'parent = {:id} && active = true', '', 1, 0, { id: r.id }).length)) throw new ApiError(409, 'Ce dossier contient encore des documents ou sous-dossiers actifs.')
      for (const [key, value] of Object.entries({ name, space: b.space, parent: b.parent || '', visibility: parsed.values.visibility, readers: parsed.values.readers, active: b.active })) r.set(key, value)
      if (!b.id) r.set('created_by', e.auth.id)
      app.save(r); c.folder(app, e.auth, r.id); c.policy.audit(app, 'documents_folders', r.id, e.auth.id, before, r.publicExport(), before ? 'update' : 'create'); saved = r.publicExport()
    }); return e.json(200, saved)
  },
  category(e) {
    c.guard(e.app, e.auth, 'settings'); const b = e.requestInfo().body; c.exact(b, ['id', 'updated', 'name', 'active']); let saved
    e.app.runInTransaction((app) => { const r = b.id ? c.get(app, 'documents_categories', b.id) : new Record(app.findCollectionByNameOrId('documents_categories')), before = b.id ? r.publicExport() : null; if (b.id) c.revision(r, b.updated); if (typeof b.active !== 'boolean') throw new BadRequestError('État de catégorie invalide.'); const name = c.text(b.name, 80, true); c.uniqueName(app, 'documents_categories', name, b.id || ''); r.set('name', name); r.set('active', b.active); app.save(r); c.policy.audit(app, 'documents_categories', r.id, e.auth.id, before, r.publicExport(), before ? 'update' : 'create'); saved = r.publicExport() }); return e.json(200, saved)
  },
}
