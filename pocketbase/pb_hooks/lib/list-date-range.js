module.exports = (from, to) => {
  const valid = (value) => typeof value === 'string' && /^20\d{2}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
  if ((!from && !to)) return null
  if (!valid(from) || !valid(to) || to < from) throw new BadRequestError('Période de recherche invalide.')
  return { from, to: to + ' 23:59:59.999Z' }
}
