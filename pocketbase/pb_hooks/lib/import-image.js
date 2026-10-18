// Contacts import accepts raster images only, never HTML/SVG or remote URLs.
const digest = (bytes) => $security.sha256(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
const decode = (input) => {
  if (typeof input !== 'string' || input.length > 200000) throw new BadRequestError('Image base64 trop volumineuse (200 000 caractères maximum).')
  const value = input.replace(/^data:image\/(?:png|jpeg|webp);base64,/, '').replace(/\s/g, '')
  if (!value || value.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw new BadRequestError('Image base64 invalide : utilisez PNG, JPEG ou WebP.')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', bytes = []
  for (let i = 0; i < value.length; i += 4) {
    const n = (chars.indexOf(value[i]) << 18) | (chars.indexOf(value[i + 1]) << 12) | ((chars.indexOf(value[i + 2]) & 63) << 6) | (chars.indexOf(value[i + 3]) & 63)
    bytes.push((n >>> 16) & 255); if (value[i + 2] !== '=') bytes.push((n >>> 8) & 255); if (value[i + 3] !== '=') bytes.push(n & 255)
  }
  const ext = bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10' ? 'png' : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'jpg' : bytes.slice(0, 4).join(',') === '82,73,70,70' && bytes.slice(8, 12).join(',') === '87,69,66,80' ? 'webp' : ''
  if (!ext) throw new BadRequestError('Image invalide : seuls PNG, JPEG et WebP sont acceptés.')
  return { value, bytes, ext, hash: digest(bytes) }
}
module.exports = { decode,
  current(app, record) {
    const filename = record.getString(record.collection().name === 'contacts_companies' ? 'logo' : 'avatar')
    if (!filename) return { image_hash: '', image_filename: '' }
    const fs = app.newFilesystem()
    try { const reader = fs.getReader(record.baseFilesPath() + '/' + filename); try { return { image_hash: digest(toBytes(reader)), image_filename: filename } } finally { reader.close() } } finally { fs.close() }
  },
  file(value) { const image = decode(value); return $filesystem.fileFromBytes(image.bytes, 'import.' + image.ext) },
}
