import { HFieldLabel } from '../../shared/ui/HFieldLabel'
import { useState, useSyncExternalStore } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router'
import { LogIn } from 'lucide-react'
import { sessionService } from '../../core/auth/services/session'
import { AuthError } from '../../core/auth/services/AuthError'
import { loginSchema, type LoginInput } from '../../core/auth/schemas/auth'
import { environment } from '../../core/config/environment'
import { HorizonMark } from '../../shared/branding/HorizonMark'
import { HButton } from '../../shared/ui/HButton'
import { HInput } from '../../shared/ui/HInput'
import { z } from 'zod'

const returnStateSchema = z.object({ returnTo: z.string().regex(/^\/(?!\/)[^\\]*$/) })

export function LoginPage() {
  const session = useSyncExternalStore(sessionService.subscribe, sessionService.getSnapshot)
  const { state } = useLocation()
  const returnState = returnStateSchema.safeParse(state)
  const destination = returnState.success && !returnState.data.returnTo.startsWith('/login') ? returnState.data.returnTo : '/'
  const [error, setError] = useState<string | undefined>(session.status === 'anonymous' ? session.error : undefined)
  const { register, handleSubmit, setError: setFieldError, resetField, formState: { errors, isSubmitting } } = useForm<LoginInput>({ defaultValues: { email: '', password: '' } })
  if (session.status === 'authenticated') return <Navigate to={destination} replace />

  async function submit(values: LoginInput) {
    setError(undefined)
    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field === 'email' || field === 'password') setFieldError(field, { message: issue.message }, { shouldFocus: true })
      }
      return
    }
    try { await sessionService.signIn(parsed.data) }
    catch (error) {
      setError(error instanceof AuthError ? error.message : 'La connexion a échoué. Réessayez dans un instant.')
      resetField('password')
    }
  }
  return (
    <main className="login-page">
      <svg className="login-landscape" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="login-horizon" x1="0" y1="0" x2="1" y2="0">
            <stop stopColor="#7B3FC7" stopOpacity="0" />
            <stop offset=".35" stopColor="#A56BEA" />
            <stop offset=".65" stopColor="#F52F96" />
            <stop offset="1" stopColor="#FF5AAE" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="login-terrain" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#091C3A" />
            <stop offset="1" stopColor="#031C2C" />
          </linearGradient>
        </defs>
        <path d="M-100 780 C250 790 440 560 800 630 S1350 820 1700 600 V1100 H-100Z" fill="url(#login-terrain)" />
        <path d="M-100 780 C250 790 440 560 800 630 S1350 820 1700 600" fill="none" stroke="url(#login-horizon)" strokeWidth="2" />
        <path d="M-100 925 C360 655 680 910 1100 780 S1470 760 1700 840" fill="none" stroke="#A56BEA" strokeOpacity=".12" />
        <path d="M-100 970 C360 700 680 955 1100 825 S1470 805 1700 885" fill="none" stroke="#A56BEA" strokeOpacity=".07" />
      </svg>
      <header className="login-header">
        <div className="login-brand"><HorizonMark /><span>HORIZON</span></div>
        <span className="login-company">CVS ENGINEERING</span>
      </header>
      <div className="login-content">
        <div className="login-intro">
          <p className="login-kicker">UN HORIZON COMMUN</p>
          <p className="login-headline">Vos équipes.<br />Vos projets.<br /><span>Un même espace.</span></p>
          <p className="login-intro-description">Le quotidien de CVS Engineering,<br />connecté dans Horizon.</p>
        </div>
        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-body">
            <p className="login-kicker">VOTRE ESPACE DE TRAVAIL</p>
            <h1 id="login-title">Connexion à Horizon</h1>
            <p className="login-description">Retrouvez votre espace de travail.</p>
            {!environment.pocketBaseUrl && <p role="status" className="login-notice">La connexion n’est pas encore configurée.</p>}
            <form onSubmit={handleSubmit(submit)} noValidate>
              <label htmlFor="login-email"><HFieldLabel required>Adresse e-mail</HFieldLabel></label>
              <HInput id="login-email" required type="email" autoComplete="username" autoCapitalize="none" {...register('email')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} disabled={isSubmitting} />
              {errors.email && <p className="field-error" id="email-error">{errors.email.message}</p>}
              <label htmlFor="login-password"><HFieldLabel required>Mot de passe</HFieldLabel></label>
              <HInput id="login-password" required type="password" autoComplete="current-password" {...register('password')} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} disabled={isSubmitting} />
              {errors.password && <p className="field-error" id="password-error">{errors.password.message}</p>}
              {error && <p className="field-error login-error" role="alert">{error}</p>}
              <HButton type="submit" variant="primary" disabled={isSubmitting || !environment.pocketBaseUrl}><LogIn size={16} />{isSubmitting ? 'Connexion…' : 'Se connecter'}</HButton>
            </form>
            <p className="login-support">Pour obtenir un accès, contactez votre administrateur.</p>
          </div>
        </section>
      </div>
      <footer className="login-footer">Horizon · CVS Engineering</footer>
    </main>
  )
}
