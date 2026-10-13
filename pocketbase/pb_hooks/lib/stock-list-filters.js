const values = (input, allowed, label) => {
  if (!input) return []
  const result = String(input).split(',')
  if (result.length > 50 || new Set(result).size !== result.length || result.some((item) => Array.isArray(allowed) ? !allowed.includes(item) : !allowed(item))) throw new BadRequestError(`${label} invalide.`)
  return result
}
module.exports = { values }
