import { useState } from 'react'
function read(key: string): Set<string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || '[]')
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && /^[a-z0-9]{15}$/.test(id)).slice(0, 100) : [])
  } catch { return new Set() /* An unavailable or malformed preference never prevents opening CRM. */ }
}
/** Presentation only, scoped to the authenticated user and this browser. */
export function useCollapsedStages(userId: string) {
  const key = `horizon.crm.collapsed-stages.${userId}`
  const [stored, setStored] = useState(() => ({ key, ids: read(key) }))
  const collapsed = stored.key === key ? stored.ids : read(key)
  function update(id: string, expand: boolean) {
    setStored((current) => {
      const next = new Set(current.key === key ? current.ids : read(key))
      if (expand || next.has(id)) next.delete(id); else next.add(id)
      try { localStorage.setItem(key, JSON.stringify([...next])) } catch { console.warn('[crm] Column preference could not be stored; kept for this session.') }
      return { key, ids: next }
    })
  }
  function toggleCollapsed(id: string) { update(id, false) }
  function expandCollapsed(id: string) { update(id, true) }
  return { collapsed, toggleCollapsed, expandCollapsed }
}
