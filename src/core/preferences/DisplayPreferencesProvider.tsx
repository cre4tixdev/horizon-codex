import { applyTheme, deviceTheme } from '../theme/theme'
import { DisplayPreferencesContext, displayPreferencesKey } from './displayPreferencesContext'
import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionService } from '../auth/services/session'
import { accountService } from '../auth/services/AccountService'
import { defaultDisplayPreference } from './displayPreferences'
import { HButton } from '../../shared/ui/HButton'

export function DisplayPreferencesProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const userId = session.status === 'authenticated' ? session.user.id : ''
  const client = useQueryClient()
  const query = useQuery({ queryKey: displayPreferencesKey(userId), queryFn: accountService.displayPreferences, enabled: Boolean(userId), retry: false, staleTime: 60_000 })
  const themeSave = useMutation({ mutationFn: async (theme: 'light' | 'dark') => {
    if (!query.data) throw new Error('Rechargez vos préférences avant de changer le thème.')
    const owner = userId, data = await accountService.saveDisplayPreferences({ ...query.data, preference: { ...query.data.preference, theme } })
    return { owner, data }
  }, onSuccess: ({ owner, data }) => client.setQueryData(displayPreferencesKey(owner), data) })
  const theme = query.data?.preference.theme
  useEffect(() => {
    applyTheme(userId && theme && theme !== 'default' ? theme : deviceTheme())
    return () => { applyTheme(deviceTheme()) }
  }, [userId, theme])
  return <DisplayPreferencesContext.Provider value={{ preference: query.data?.preference || defaultDisplayPreference, pending: Boolean(userId) && query.isPending, changeTheme: userId && query.data ? (next) => themeSave.mutate(next) : undefined, themeSaving: Boolean(userId) && (query.isPending || themeSave.isPending) }}>
    {query.error && <p role="alert" className="login-notice">Préférences d’affichage indisponibles. {query.error.message}<HButton onClick={() => void query.refetch()}>Réessayer</HButton></p>}
    {themeSave.error && <p role="alert" className="login-notice">{themeSave.error.message}<HButton onClick={() => { themeSave.reset(); void query.refetch() }}>Recharger les préférences</HButton></p>}
    {children}
  </DisplayPreferencesContext.Provider>
}
