import { useDisplayPreferences } from '../../core/preferences/displayPreferencesContext'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../core/theme/theme'
import { HButton } from '../../shared/ui/HButton'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const { changeTheme, themeSaving } = useDisplayPreferences()
  const label = theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'
  return <HButton variant="ghost" size="icon" className="theme-toggle" aria-label={label} title={label} disabled={themeSaving} onClick={() => changeTheme ? changeTheme(theme === 'dark' ? 'light' : 'dark') : toggle()}>
    {theme === 'dark' ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
  </HButton>
}
