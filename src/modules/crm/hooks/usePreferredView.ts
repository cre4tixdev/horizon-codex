import { useState } from 'react'
type View = 'kanban' | 'list'
function read(key: string): View | undefined {
  try { const value = localStorage.getItem(key); return value === 'kanban' || value === 'list' ? value : undefined }
  catch { return undefined }
}
/** Préférence de présentation locale, distincte du réglage global administré. */
export function usePreferredView(userId: string) {
  const key = `horizon.crm.view.${userId}`
  const [stored, setStored] = useState(() => ({ key, view: read(key) }))
  const preferredView = stored.key === key ? stored.view : read(key)
  function rememberView(view: View) {
    setStored({ key, view })
    try { localStorage.setItem(key, view) }
    catch { console.warn('[crm] View preference could not be stored; kept for this session.') }
  }
  return { preferredView, rememberView }
}
