import { createContext } from 'react'

export const BreadcrumbActionsContext = createContext<{ navigation: HTMLElement | null; related: HTMLElement | null }>({ navigation: null, related: null })
