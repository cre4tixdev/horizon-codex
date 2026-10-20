import { createContext, useContext } from 'react'
import { defaultDisplayPreference, type DisplayPreference } from './displayPreferences'
export const displayPreferencesKey = (userId: string) => ['display-preferences', userId]
export const DisplayPreferencesContext = createContext<{ preference: DisplayPreference; pending: boolean; changeTheme?: ((theme: 'light' | 'dark') => void) | undefined; themeSaving?: boolean }>({ preference: defaultDisplayPreference, pending: false })
export function useDisplayPreferences() { return useContext(DisplayPreferencesContext) }
