const base = (brand, reference) => brand.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s/g, '').slice(0, 3).toUpperCase() + reference.trim()
const allocate = (requested, exists) => {
  for (let suffix = 0; suffix <= 10000; suffix++) {
    const ending = suffix ? String(suffix) : '', candidate = requested.slice(0, 100 - ending.length) + ending
    if (!exists(candidate)) return candidate
  }
  throw new BadRequestError('Impossible d’allouer un code-barres unique. Choisissez un autre code.')
}
module.exports = { base, allocate }
