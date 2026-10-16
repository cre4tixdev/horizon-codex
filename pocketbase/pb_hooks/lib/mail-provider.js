// MailProvider boundary: delegated Graph only. No client_credentials fallback.
const oauth = require(`${__hooks}/lib/messaging-oauth.js`)
const base64 = require(`${__hooks}/lib/mail-encoding.js`).base64
module.exports = {
  configured: oauth.configured, base64, reader: require(`${__hooks}/lib/mail-reader.js`),
  send(app, r, job) {
    let token, payload
    const generation = job.getString('connection_generation'), box = r.getString('mailbox')
    try {
      if (job.getString('transport_version') !== 'graph-delegated-v1' || !generation) throw oauth.transportError('Ancienne file non compatible. Préparez explicitement un nouvel envoi.')
      token = oauth.accessToken(app, box, generation)
      const fs = app.newFilesystem(), attachments = []
      try {
        for (const name of r.getStringSlice('attachments')) { const reader = fs.getReader(r.baseFilesPath() + '/' + name); try { attachments.push({ '@odata.type': '#microsoft.graph.fileAttachment', name, contentBytes: base64(toBytes(reader)) }) } finally { reader.close() } }
      } finally { fs.close() }
      const list = (key) => JSON.parse(r.getString(key) || '[]').map((address) => ({ emailAddress: { address } }))
      payload = { message: { subject: r.getString('subject'), body: { contentType: 'HTML', content: r.getString('html') }, from: { emailAddress: { address: r.getString('from_address') } }, toRecipients: list('to'), ccRecipients: list('cc'), bccRecipients: list('bcc'), internetMessageHeaders: [{ name: 'X-Horizon-Message', value: r.id }], attachments }, saveToSentItems: true }
      oauth.checkConnection(app, box, generation)
    } catch (error) { error.uncertain = false; throw error }
    let response
    try { response = $http.send({ url: oauth.testOrigin() ? `${oauth.testOrigin()}/send` : 'https://graph.microsoft.com/v1.0/me/sendMail', method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), timeout: 45 }) }
    catch { const error = new Error('Réponse Microsoft incertaine. Vérifiez les éléments envoyés avant tout nouvel envoi.'); error.uncertain = true; throw error }
    if (response.statusCode === 202) return { requestId: String(response.headers['Request-Id']?.[0] || response.headers['request-id']?.[0] || '') }
    if (response.statusCode === 401) oauth.reconnect(app, box, generation)
    if (response.statusCode === 429) {
      const raw = response.headers['Retry-After']?.[0] || response.headers['retry-after']?.[0], seconds = /^\d+$/.test(raw || '') ? Number(raw) : (Date.parse(raw) - Date.now()) / 1000
      throw oauth.transportError('Microsoft limite temporairement les envois. Nouvelle tentative planifiée.', true, Number.isFinite(seconds) ? Math.max(60, Math.ceil(seconds)) : 60)
    }
    const uncertain = response.statusCode >= 500 || response.statusCode === 408 || response.statusCode >= 200 && response.statusCode < 300
    const error = new Error(uncertain ? 'Réponse Microsoft incertaine. Vérifiez les éléments envoyés.' : `Envoi refusé par Microsoft 365 (HTTP ${response.statusCode}). Vérifiez la connexion et les autorisations.`)
    error.uncertain = uncertain; throw error
  },
}
