import { useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'
const storageKey = 'horizon.theme'
const changeEvent = 'horizon:theme-change'
const getSnapshot = (): Theme => document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
  window.dispatchEvent(new Event(changeEvent))
}
function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) apply(event.newValue === 'dark' ? 'dark' : 'light')
  }
  window.addEventListener(changeEvent, listener)
  window.addEventListener('storage', onStorage)
  return () => { window.removeEventListener(changeEvent, listener); window.removeEventListener('storage', onStorage) }
}
function toggle() {
  const next = getSnapshot() === 'dark' ? 'light' : 'dark'
  try { localStorage.setItem(storageKey, next) } catch { /* The theme remains usable when browser storage is unavailable. */ }
  apply(next)
}
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, (): Theme => 'light')
  return { theme, toggle }
}
