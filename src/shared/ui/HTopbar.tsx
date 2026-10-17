import type { ReactNode } from 'react'
export function HTopbar({ navigation, search, actions }: { navigation: ReactNode; search: ReactNode; actions: ReactNode }) {
  return <header className="topbar">{navigation}{search}<div className="topbar-context">{actions}</div></header>
}
