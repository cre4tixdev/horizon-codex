const policy = require(`${__hooks}/lib/access-policy.js`)
const current = (app, auth) => {
  if (!auth || auth.collection().name !== 'core_users') throw new ApiError(401, 'Connexion nécessaire.')
  const user = app.findRecordById('core_users', auth.id)
  if (!user.getBool('active') || !app.findRecordById('core_roles', user.getString('role')).getBool('active')) throw new ForbiddenError('Compte indisponible.')
  return user
}
const exact = (input, fields) => { if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some((key) => !fields.includes(key))) throw new BadRequestError('Champs non autorisés.') }
const dto = (app, user) => ({ id: user.id, collectionId: user.collection().id, updated: user.getString('updated'), name: user.getString('name'), first_name: user.getString('first_name'), last_name: user.getString('last_name'), email: user.getString('email'), public_email: user.getString('public_email'), avatar: require(`${__hooks}/lib/identity-photo.js`).source(app, user).getString('avatar'), employee_id: user.getString('employee'), presence: user.getString('presence') || 'available', role_label: app.findRecordById('core_roles', user.getString('role')).getString('label'), erp_profile: user.getString('erp_profile') })
const personal = (user) => Object.fromEntries(['name', 'first_name', 'last_name', 'public_email', 'avatar', 'presence'].map((key) => [key, user.getString(key)]))
module.exports = {
  avatar(event) {
    const actor = current(event.app, event.auth)
    const id = event.request.pathValue('id')
    if (id !== actor.id && !policy.admin(event.app, actor)) throw new ForbiddenError('Photo hors de votre périmètre.')
    if (!/^[a-z0-9]{15}$/.test(id)) throw new BadRequestError('Compte invalide.')
    const user = event.app.findRecordById('core_users', id)
    return require(`${__hooks}/lib/identity-photo.js`).serve(event, user)
  },
  read(event) { return event.json(200, dto(event.app, current(event.app, event.auth))) },
  save(event) {
    const body = event.requestInfo().body; exact(body, ['updated', 'input', 'remove_avatar'])
    const input = typeof body.input === 'string' ? JSON.parse(body.input) : body.input; exact(input, ['name', 'first_name', 'last_name', 'public_email', 'presence'])
    for (const [key, max] of [['name', 160], ['first_name', 80], ['last_name', 80]]) if (typeof input[key] !== 'string' || !input[key].trim() || input[key].trim().length > max) throw new BadRequestError('Renseignez votre prénom, nom et nom affiché.')
    if (input.presence !== undefined && !['available', 'away', 'busy', 'offline'].includes(input.presence)) throw new BadRequestError('Présence invalide.')
    if (typeof input.public_email !== 'string' || input.public_email.length > 254 || input.public_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.public_email)) throw new BadRequestError('Adresse e-mail de contact invalide.')
    if (body.remove_avatar !== undefined && ![true, false, 'true', 'false'].includes(body.remove_avatar)) throw new BadRequestError('Photo invalide.')
    let files = []
    if (event.request.header.get('Content-Type').startsWith('multipart/form-data')) { try { files = event.findUploadedFiles('avatar') } catch (error) { if (!String(error).endsWith('http: no such file')) throw error } }
    if (files.length || body.remove_avatar === true || body.remove_avatar === 'true') throw new BadRequestError('La photo se gère sur la fiche Employé associée.')
    let saved
    event.app.runInTransaction((app) => {
      const user = current(app, event.auth)
      if (user.getString('updated') !== body.updated) throw new ApiError(409, 'Votre profil a changé. Actualisez la page avant de réessayer.')
      const before = personal(user)
      for (const key of ['name', 'first_name', 'last_name', 'public_email']) user.set(key, input[key].trim())
      if (input.presence !== undefined) user.set('presence', input.presence)
      app.save(user); policy.audit(app, 'core_users', user.id, user.id, before, personal(user), 'profile_update'); saved = dto(app, user)
    })
    return event.json(200, saved)
  },
  presence(event) {
    const body = event.requestInfo().body; exact(body, ['presence'])
    if (!['available', 'away', 'busy', 'offline'].includes(body.presence)) throw new BadRequestError('Présence invalide.')
    let saved
    event.app.runInTransaction((app) => { const user = current(app, event.auth), before = personal(user); user.set('presence', body.presence); app.save(user); policy.audit(app, 'core_users', user.id, user.id, before, personal(user), 'presence_update'); saved = dto(app, user) })
    return event.json(200, saved)
  },
  password(event) {
    const body = event.requestInfo().body; exact(body, ['current_password', 'password', 'password_confirm'])
    if (typeof body.current_password !== 'string' || !body.current_password || body.current_password.length > 1024 || typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 1024 || body.password !== body.password_confirm) throw new BadRequestError('Le nouveau mot de passe doit contenir au moins 12 caractères et correspondre à la confirmation.')
    event.app.runInTransaction((app) => {
      const user = current(app, event.auth)
      if (!user.validatePassword(body.current_password)) throw new BadRequestError('Le mot de passe actuel est incorrect.')
      if (body.password === body.current_password) throw new BadRequestError('Choisissez un mot de passe différent du mot de passe actuel.')
      user.setPassword(body.password); app.save(user)
      policy.audit(app, 'core_users', user.id, user.id, null, { password_changed: true }, 'password_change')
    })
    return event.json(200, { changed: true })
  },
}
