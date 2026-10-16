// Read side of MailProvider. No Outlook mutation, only explicitly enabled mailboxes.
const oauth = require(`${__hooks}/lib/messaging-oauth.js`)
const query = (path, values) => path + '?' + Object.entries(values).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
const failure = (code, message) => Object.assign(new Error(message), { receiveCode: code })
const headers = 'id,internetMessageId,conversationId,internetMessageHeaders,from,sender,subject,receivedDateTime,isDraft'
const get = (app, box, generation, path) => {
  const origin = oauth.testOrigin() || 'https://graph.microsoft.com/v1.0'
  const connection = oauth.checkConnection(app, box, generation)
  const { url, reason } = require(`${__hooks}/lib/mail-pagination.js`).inspect(origin, path, connection.getString('account_id'), connection.getString('account_address'))
  if (!url) { const error = failure('pagination_rejected', `Pagination Microsoft refusée [P2:${reason}]. La relève reprendra depuis le début de la conversation.`); error.invalidCursor = true; throw error }
  const token = oauth.accessToken(app, box, generation)
  if (!(JSON.parse(connection.getString('granted_scopes') || '[]') || []).includes('Mail.Read')) throw failure('read_consent_missing', 'Autorisation Mail.Read manquante. Reconnectez cette boîte Microsoft.')
  let response
  try { response = $http.send({ url, method: 'GET', headers: { Authorization: `Bearer ${token}`, Prefer: 'IdType="ImmutableId", outlook.body-content-type="text"' }, timeout: 15 }) }
  catch { throw failure('network_unavailable', 'Microsoft ne répond pas à la relève. Nouvelle tentative automatique ; vérifiez la connexion réseau du serveur si cela persiste.') }
  if (response.statusCode === 401) oauth.reconnect(app, box, generation)
  if (response.statusCode !== 200) {
    const error = failure('graph_http', response.statusCode === 401 ? 'Connexion Microsoft expirée ou révoquée. Reconnectez cette boîte.' : response.statusCode === 403 ? 'Lecture Microsoft refusée. Vérifiez Mail.Read et reconnectez la boîte.' : `Relève Microsoft interrompue (HTTP ${response.statusCode}).`)
    error.httpStatus = response.statusCode
    const requestId = String(response.headers['Request-Id']?.[0] || response.headers['request-id']?.[0] || '')
    if (/^[a-f\d-]{36}$/i.test(requestId)) error.requestId = requestId
    error.invalidCursor = response.statusCode === 410
    const raw = response.headers['Retry-After']?.[0] || response.headers['retry-after']?.[0]
    error.delay = response.statusCode === 429 ? Math.max(60, /^\d+$/.test(raw || '') ? Number(raw) : Math.ceil((Date.parse(raw) - Date.now()) / 1000) || 60) : 120
    throw error
  }
  return response.json
}
module.exports = {
  discovery(app, box, generation, message, cursor) {
    const since = new Date(new Date(message.getString('queued_at') || message.getString('created')).getTime() - 86400000).toISOString()
    const until = new Date(new Date(message.getString('sent_at') || message.getString('updated')).getTime() + 86400000).toISOString()
    return get(app, box, generation, cursor || query('/me/mailFolders/sentitems/messages', { '$filter': `sentDateTime ge ${since} and sentDateTime le ${until}`, '$select': headers, '$top': '25' }))
  },
  conversation(app, box, generation, id, cursor) { return get(app, box, generation, cursor || query('/me/messages', { '$filter': `conversationId eq '${id.replace(/'/g, "''")}'`, '$select': headers, '$top': '25' })) },
  message(app, box, generation, id) { return get(app, box, generation, query('/me/messages/' + encodeURIComponent(id), { '$select': 'id,internetMessageId,from,sender,subject,receivedDateTime,body,hasAttachments,isDraft' })) },
  attachments(app, box, generation, id) { return get(app, box, generation, query('/me/messages/' + encodeURIComponent(id) + '/attachments', { '$select': 'id,name,size,contentType,isInline', '$top': '11' })) },
  attachment(app, box, generation, id, file) { return get(app, box, generation, '/me/messages/' + encodeURIComponent(id) + '/attachments/' + encodeURIComponent(file)) },
}
