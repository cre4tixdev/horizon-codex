const base64 = (bytes) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', result = []
  for (let i = 0; i < bytes.length; i += 3) { const n = bytes[i] * 65536 + (bytes[i + 1] || 0) * 256 + (bytes[i + 2] || 0); result.push(chars[n >>> 18], chars[(n >>> 12) & 63], i + 1 < bytes.length ? chars[(n >>> 6) & 63] : '=', i + 2 < bytes.length ? chars[n & 63] : '=') }
  return result.join('')
}
module.exports = { base64 }
