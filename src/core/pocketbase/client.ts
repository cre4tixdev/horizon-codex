import PocketBase, { BaseAuthStore } from 'pocketbase'

export const sessionTokenKey = 'horizon.auth.token'

// Only the token survives reloads in this tab; user data is fetched from the server.
export function createPocketBaseClient(url: string) {
  const store = new BaseAuthStore()
  try {
    const token = window.sessionStorage.getItem(sessionTokenKey)
    if (token) store.save(token)
    if (!store.isValid) { store.clear(); window.sessionStorage.removeItem(sessionTokenKey) }
  } catch { console.error('[auth] Session storage unavailable') }
  store.onChange((token) => {
    try {
      if (token) window.sessionStorage.setItem(sessionTokenKey, token)
      else window.sessionStorage.removeItem(sessionTokenKey)
    } catch { console.error('[auth] Session storage unavailable') }
  })
  return new PocketBase(url, store)
}
