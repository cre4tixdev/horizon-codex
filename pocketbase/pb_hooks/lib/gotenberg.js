module.exports = (event, layout, rendered, filename) => {
  const url = $os.getenv('HORIZON_GOTENBERG_URL').replace(/\/$/, '')
  if (!/^https?:\/\/[a-zA-Z0-9.:[\]-]+$/.test(url)) throw new ApiError(503, 'La génération PDF n’est pas configurée sur le serveur.')
  const body = new FormData()
  for (const [name, html] of [['index.html', rendered.body], ['header.html', rendered.header], ['footer.html', rendered.footer]]) body.append('files', $filesystem.fileFromBytes(html, name))
  const inches = (pixels) => String(pixels / 96)
  for (const [key, value] of Object.entries({ paperWidth: '8.2677', paperHeight: '11.6929', landscape: String(layout.orientation === 'landscape'), marginLeft: String(layout.margin / 25.4), marginRight: String(layout.margin / 25.4), marginTop: inches(layout.margin * 96 / 25.4 + layout.headerHeight), marginBottom: inches(layout.margin * 96 / 25.4 + layout.footerHeight), printBackground: 'true' })) body.append(key, value)
  let response
  try { response = $http.send({ url: `${url}/forms/chromium/convert/html`, method: 'POST', body, timeout: 65 }) } catch (error) {
    event.app.logger().error('Gotenberg conversion failed', 'error', String(error).slice(0, 250))
    throw new ApiError(503, 'Le service PDF est indisponible. Réessayez.')
  }
  if (response.statusCode !== 200 || String(response.headers['Content-Type']?.[0] || '').split(';')[0].trim().toLowerCase() !== 'application/pdf' || response.body.length > 25000000 || response.body.slice(0, 5).map((byte) => String.fromCharCode(byte)).join('') !== '%PDF-') {
    event.app.logger().error('Gotenberg invalid response', 'status', response.statusCode)
    throw new ApiError(502, 'Le service PDF n’a pas produit un document valide.')
  }
  const fallback = filename.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]|["\\]/g, '_')
  const encoded = encodeURIComponent(filename).replace(/['()*]/g, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase())
  event.response.header().set('Content-Disposition', `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`)
  event.response.header().set('Access-Control-Expose-Headers', 'Content-Disposition')
  event.response.header().set('Cache-Control', 'no-store')
  return event.blob(200, 'application/pdf', response.body)
}
