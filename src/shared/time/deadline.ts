export function deadlineState(value: string, now = Date.now()) {
  if (!value) return 'unset'
  const remaining = Date.parse(value.replace(' ', 'T')) - now
  if (remaining < 0) return 'past'
  if (remaining <= 48 * 60 * 60 * 1000) return 'urgent'
  return remaining <= 7 * 24 * 60 * 60 * 1000 ? 'soon' : 'scheduled'
}
