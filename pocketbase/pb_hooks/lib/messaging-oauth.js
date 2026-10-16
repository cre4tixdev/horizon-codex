// Confidential delegated OAuth: credentials and tokens stay in PocketBase.
const c = require(`${__hooks}/lib/messaging-common.js`)
const scopes = (receive = false) => 'offline_access https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Send' + (receive ? ' https://graph.microsoft.com/Mail.Read' : '')
const form = (values) => Object.entries(values).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
const testOrigin = () => $os.getenv('HORIZON_TEST_MODE') === '1' && /^http:\/\/127\.0\.0\.1:\d+$/.test($os.getenv('HORIZON_MAIL_TEST_ORIGIN')) ? $os.getenv('HORIZON_MAIL_TEST_ORIGIN') : ''
const config = () => {
  const tenant = $os.getenv('HORIZON_MAIL_TENANT_ID'), client = $os.getenv('HORIZON_MAIL_CLIENT_ID'), secret = $os.getenv('HORIZON_MAIL_CLIENT_SECRET'), key = $os.getenv('HORIZON_MAIL_ENCRYPTION_KEY'), redirect = $os.getenv('HORIZON_MAIL_REDIRECT_URI')
  if (!/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(tenant) || !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(client) || !secret || !/^[\x21-\x7e]{32}$/.test(key) || !/^(https:\/\/[a-z\d.-]+(?::\d+)?|http:\/\/(127\.0\.0\.1|localhost):\d+)\/messaging\/oauth\/callback$/i.test(redirect)) throw new ApiError(503, 'Configurez la connexion Microsoft et la clé de chiffrement côté serveur.')
  return { tenant, client, secret, key, redirect, tokenURL: testOrigin() ? `${testOrigin()}/token` : `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token` }
}
const configured = () => { try { config(); return true } catch { return false } }
const connection = (app, box) => app.findRecordsByFilter('messaging_oauth_connections', 'mailbox = {:box}', '', 1, 0, { box })[0]
const decrypt = (cipher, key) => { const value = $security.decrypt(cipher, key); return typeof value === 'string' ? value : String.fromCharCode(...value) }
const transportError = (message, retry = false, delay = 60) => { const error = new Error(message); error.uncertain = false; error.retry = retry; error.delay = delay; return error }
const tokenRequest = (cfg, values) => {
  let response
  try { response = $http.send({ url: cfg.tokenURL, method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form({ client_id: cfg.client, client_secret: cfg.secret, ...values }), timeout: 20 }) }
  catch { throw transportError('Connexion Microsoft indisponible avant envoi.', true) }
  if (response.statusCode !== 200) { const error = transportError('Microsoft demande une reconnexion ou une correction de la configuration.', response.statusCode === 429 || response.statusCode >= 500); error.reconnect = response.json?.error === 'invalid_grant' || response.json?.error === 'interaction_required'; throw error }
  const t = response.json, granted = String(t.scope || '').split(' ').map((s) => s.replace('https://graph.microsoft.com/', ''))
  if (typeof t.access_token !== 'string' || !t.access_token || !granted.includes('Mail.Send') || !granted.includes('User.Read') || t.token_type?.toLowerCase() !== 'bearer' || !Number.isFinite(t.expires_in) || t.expires_in < 60) throw transportError('Réponse OAuth invalide ou autorisation d’envoi manquante.')
  return t
}
const identity = (token) => {
  let response
  try { response = $http.send({ url: testOrigin() ? `${testOrigin()}/me` : 'https://graph.microsoft.com/v1.0/me?$select=id,mail,userPrincipalName', method: 'GET', headers: { Authorization: `Bearer ${token}` }, timeout: 20 }) }
  catch { throw transportError('Identité Microsoft indisponible. Recommencez la connexion.') }
  const me = response.json
  if (response.statusCode !== 200 || typeof me?.id !== 'string' || !me.id || !c.content.email(me.mail || me.userPrincipalName)) throw transportError('Impossible de vérifier la boîte Microsoft connectée.')
  return { id: me.id, address: (me.mail || me.userPrincipalName).toLowerCase() }
}
const checkConnection = (app, box, generation) => {
  const cfg = config(), b = c.get(app, 'messaging_mailboxes', box), r = connection(app, box)
  if (!b.getBool('active') || !r || !['connected', 'refreshing'].includes(r.getString('status')) || r.getString('tenant_id') !== cfg.tenant || r.getString('client_id') !== cfg.client || r.getString('account_address') !== b.getString('address') || generation && r.getString('generation') !== generation) throw transportError('Connectez ou reconnectez cette adresse dans Paramètres → E-mails.')
  return r
}
const store = (r, t, cfg) => {
  r.set('granted_scopes', String(t.scope || '').split(' ').map((s) => s.replace('https://graph.microsoft.com/', '')))
  r.set('access_cipher', $security.encrypt(t.access_token, cfg.key))
  if (t.refresh_token) r.set('refresh_cipher', $security.encrypt(t.refresh_token, cfg.key))
  r.set('expires_at', new Date(Date.now() + Math.min(t.expires_in, 86400) * 1000).toISOString()); r.set('status', 'connected'); r.set('refresh_claim', ''); r.set('refresh_claimed_at', '')
}
module.exports = {
  configured, config, connection, checkConnection, transportError, testOrigin,
  summary(app, box) {
    const r = connection(app, box), cfg = configured() ? config() : null, b = c.get(app, 'messaging_mailboxes', box)
    const valid = r && cfg && r.getString('tenant_id') === cfg.tenant && r.getString('client_id') === cfg.client && r.getString('account_address') === b.getString('address')
    return { status: valid ? r.getString('status') : 'disconnected', address: valid ? r.getString('account_address') : '', connected_at: valid ? r.getString('created') : '', can_receive: Boolean(valid && c.json(r, 'granted_scopes').includes('Mail.Read')), reception: require(`${__hooks}/lib/messaging-inbound.js`).summary(app, box) }
  },
  start(e) {
    c.guard(e.app, e.auth, 'settings'); const b = e.requestInfo().body; c.exact(b, ['mailbox']); const cfg = config(), box = c.get(e.app, 'messaging_mailboxes', b.mailbox)
    if (!box.getBool('active')) throw new BadRequestError('Réactivez cet expéditeur avant de le connecter.')
    const state = $security.randomString(64), verifier = $security.randomString(64)
    const bytes = $security.sha256(verifier).match(/../g).map((v) => parseInt(v, 16)), challenge = require(`${__hooks}/lib/mail-encoding.js`).base64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const r = new Record(e.app.findCollectionByNameOrId('messaging_oauth_states'))
    for (const [k, v] of Object.entries({ state_hash: $security.sha256(state), verifier_cipher: $security.encrypt(verifier, cfg.key), owner: e.auth.id, mailbox: box.id, mailbox_version: box.getString('updated'), connection_generation: connection(e.app, box.id)?.getString('generation') || '', tenant_id: cfg.tenant, client_id: cfg.client, redirect_uri: cfg.redirect, expires_at: new Date(Date.now() + 600000).toISOString(), consumed: false, receive_enabled: box.getBool('receive_enabled') })) r.set(k, v)
    e.app.save(r); e.response.header().set('Cache-Control', 'no-store')
    return e.json(200, { url: `https://login.microsoftonline.com/${cfg.tenant}/oauth2/v2.0/authorize?${form({ client_id: cfg.client, response_type: 'code', redirect_uri: cfg.redirect, response_mode: 'query', scope: scopes(box.getBool('receive_enabled')), state, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account', login_hint: box.getString('address') })}` })
  },
  callback(e) {
    c.guard(e.app, e.auth, 'settings'); const b = e.requestInfo().body; c.exact(b, ['state', 'code']); const cfg = config()
    if (!/^[a-zA-Z\d]{64}$/.test(b.state || '') || typeof b.code !== 'string' || !b.code || b.code.length > 10000) throw new BadRequestError('Retour Microsoft invalide.')
    let state
    e.app.runInTransaction((app) => {
      const r = app.findRecordsByFilter('messaging_oauth_states', 'state_hash = {:hash}', '', 1, 0, { hash: $security.sha256(b.state) })[0]
      if (!r || r.getBool('consumed') || r.getString('owner') !== e.auth.id || new Date(r.getString('expires_at')).getTime() <= Date.now() || r.getString('tenant_id') !== cfg.tenant || r.getString('client_id') !== cfg.client || r.getString('redirect_uri') !== cfg.redirect) throw new BadRequestError('Connexion expirée ou déjà utilisée. Recommencez depuis les paramètres.')
      state = { box: r.getString('mailbox'), version: r.getString('mailbox_version'), generation: r.getString('connection_generation'), verifier: decrypt(r.getString('verifier_cipher'), cfg.key), receive: r.getBool('receive_enabled') }
      r.set('consumed', true); r.set('verifier_cipher', ''); app.save(r)
    })
    let tokens, me
    try {
      tokens = tokenRequest(cfg, { grant_type: 'authorization_code', code: b.code, redirect_uri: cfg.redirect, code_verifier: state.verifier })
      if (typeof tokens.refresh_token !== 'string' || !tokens.refresh_token) throw transportError('Microsoft n’a pas accordé d’accès renouvelable.')
      if (state.receive && !String(tokens.scope || '').split(' ').some((v) => v.replace('https://graph.microsoft.com/', '') === 'Mail.Read')) throw transportError('Autorisation Mail.Read manquante. Accordez le consentement Microsoft puis reconnectez la boîte.')
      me = identity(tokens.access_token)
    } catch (error) { e.app.logger().warn('Messaging OAuth connection refused', 'user_id', e.auth.id); throw new BadRequestError(error.message) }
    e.app.runInTransaction((app) => {
      c.guard(app, c.get(app, 'core_users', e.auth.id), 'settings'); const box = c.get(app, 'messaging_mailboxes', state.box)
      if (!box.getBool('active') || box.getString('updated') !== state.version || box.getBool('receive_enabled') !== state.receive || box.getString('address') !== me.address) throw new BadRequestError('La boîte connectée doit correspondre exactement à l’expéditeur sélectionné. Les boîtes partagées ne sont pas prises en charge dans ce lot.')
      const existing = connection(app, box.id)
      if ((existing?.getString('generation') || '') !== state.generation) throw new BadRequestError('La connexion a été modifiée ou déconnectée. Recommencez depuis les paramètres.')
      const r = existing || new Record(app.findCollectionByNameOrId('messaging_oauth_connections'))
      for (const [k, v] of Object.entries({ mailbox: box.id, tenant_id: cfg.tenant, client_id: cfg.client, account_id: me.id, account_address: me.address, connected_by: e.auth.id, generation: $security.randomString(40) })) r.set(k, v)
      store(r, tokens, cfg); app.save(r); c.audit(app, e.auth, r, 'oauth_connected')
    }); return e.json(200, { connected: true })
  },
  disconnect(e) {
    c.guard(e.app, e.auth, 'settings'); const b = e.requestInfo().body; c.exact(b, ['mailbox'])
    e.app.runInTransaction((app) => {
      c.guard(app, c.get(app, 'core_users', e.auth.id), 'settings'); c.get(app, 'messaging_mailboxes', b.mailbox)
      const r = connection(app, b.mailbox) || new Record(app.findCollectionByNameOrId('messaging_oauth_connections')); r.set('mailbox', b.mailbox)
      for (const key of ['access_cipher', 'refresh_cipher', 'refresh_claim', 'refresh_claimed_at', 'expires_at']) r.set(key, '')
      r.set('generation', $security.randomString(40)); r.set('status', 'disconnected'); app.save(r)
      for (const s of app.findRecordsByFilter('messaging_oauth_states', 'mailbox = {:box} && consumed = false', '', 1000, 0, { box: b.mailbox })) { s.set('consumed', true); s.set('verifier_cipher', ''); app.save(s) }
      c.audit(app, e.auth, r, 'oauth_disconnected')
    }); return e.json(200, { disconnected: true })
  },
  accessToken(app, box, generation) {
    const cfg = config(); let r = checkConnection(app, box, generation)
    if (r.getString('status') === 'connected' && new Date(r.getString('expires_at')).getTime() > Date.now() + 120000) return decrypt(r.getString('access_cipher'), cfg.key)
    let claim, refresh, id
    app.runInTransaction((tx) => {
      r = checkConnection(tx, box, generation)
      if (r.getString('status') === 'refreshing') {
        if (new Date(r.getString('refresh_claimed_at')).getTime() > Date.now() - 120000) throw transportError('Renouvellement Microsoft en cours.', true)
        // A refresh response may have been lost: no blind reuse of a rotated token.
        r.set('status', 'reconnect'); r.set('access_cipher', ''); r.set('refresh_cipher', ''); tx.save(r); return
      }
      claim = $security.randomString(40); id = r.id; refresh = decrypt(r.getString('refresh_cipher'), cfg.key)
      r.set('status', 'refreshing'); r.set('refresh_claim', claim); r.set('refresh_claimed_at', new Date().toISOString()); tx.save(r)
    })
    if (!claim) throw transportError('Renouvellement interrompu. Reconnectez la boîte Microsoft.')
    let t
    try { t = tokenRequest(cfg, { grant_type: 'refresh_token', refresh_token: refresh, scope: scopes(c.json(r, 'granted_scopes').includes('Mail.Read')) }) }
    catch (error) {
      app.runInTransaction((tx) => { const current = c.get(tx, 'messaging_oauth_connections', id); if (current.getString('refresh_claim') !== claim) return; current.set('status', error.retry ? 'connected' : 'reconnect'); current.set('refresh_claim', ''); current.set('refresh_claimed_at', ''); if (!error.retry) { current.set('access_cipher', ''); current.set('refresh_cipher', '') } tx.save(current) })
      throw error
    }
    app.runInTransaction((tx) => {
      const current = checkConnection(tx, box, generation)
      if (current.getString('refresh_claim') !== claim) throw transportError('Connexion modifiée pendant son renouvellement.')
      store(current, t, cfg); tx.save(current)
    }); return t.access_token
  },
  reconnect(app, box, generation) {
    app.runInTransaction((tx) => { const r = connection(tx, box); if (r && r.getString('generation') === generation) { r.set('status', 'reconnect'); r.set('access_cipher', ''); r.set('refresh_cipher', ''); tx.save(r) } })
  },
}
