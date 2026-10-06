import { createContext } from 'react'

export const BreadcrumbActionsContext = createContext<{ navigation: HTMLElement | null; related: HTMLElement | null; trail: HTMLElement | null }>({ navigation: null, related: null, trail: null })
