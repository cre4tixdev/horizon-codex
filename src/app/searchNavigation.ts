import { navigationItems } from './navigation'

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

export function searchNavigation(query: string) {
  const needle = normalize(query)
  return navigationItems.filter((item) => normalize(`${item.label} ${item.description}`).includes(needle))
}
