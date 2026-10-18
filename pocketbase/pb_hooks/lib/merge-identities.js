// Pure identity hints: suggestions never authorize a merge.
const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\w\u00c0-\uffff]+/g, ' ').replace(/_/g, ' ').trim()
const hints = (kind, r) => {
  const keys = []
  const add = (reason, value) => { const key = reason === 'Même e-mail' ? String(value || '').trim().toLowerCase() : normalize(value); if (key) keys.push({ key: reason + ':' + key, reason }) }
  if (kind === 'companies') {
    add('Même SIREN', r.siren || r.siret?.slice(0, 9))
    add('Nom ou raison sociale identique', r.name); add('Nom ou raison sociale identique', r.legal_name)
  } else if (kind === 'people') {
    add('Même e-mail', r.email)
    if (r.first_name && r.last_name) add('Même nom et société', `${r.first_name} ${r.last_name} ${r.company || 'sans société'}`)
  } else {
    if (r.brand && r.manufacturer_ref) add('Même marque et référence fabricant', `${r.brand} ${r.manufacturer_ref}`)
    if (r.name) add('Même désignation et marque', `${r.name} ${r.brand} ${r.kind} ${r.base_unit}`)
  }
  return [...new Map(keys.map((hint) => [hint.key, hint])).values()]
}
const suggestions = (kind, records) => {
  const buckets = new Map(), pairs = new Map()
  for (const record of records) for (const hint of hints(kind, record)) {
    const bucket = buckets.get(hint.key) || { reason: hint.reason, records: [] }
    bucket.records.push(record); buckets.set(hint.key, bucket)
  }
  for (const [group, bucket] of buckets) {
    if (bucket.records.length < 2) continue
    const [anchor, ...others] = bucket.records
    for (const other of others) {
      const id = [anchor.id, other.id].sort().join(':')
      const pair = pairs.get(id) || { id, group, left: anchor, right: other, reasons: [], members: bucket.records.length }
      if (!pair.reasons.includes(bucket.reason)) pair.reasons.push(bucket.reason)
      pair.members = Math.max(pair.members, bucket.records.length); pairs.set(id, pair)
    }
  }
  return [...pairs.values()]
}
module.exports = { normalize, suggestions }
