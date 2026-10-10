import { createContext } from 'react'

export const BreadcrumbActionsContext = createContext<{ actions: HTMLElement | null; workflow: HTMLElement | null; navigation: HTMLElement | null; related: HTMLElement | null; trail: HTMLElement | null }>({ actions: null, workflow: null, navigation: null, related: null, trail: null })
