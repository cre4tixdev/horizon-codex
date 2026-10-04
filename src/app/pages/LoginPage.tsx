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
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand"><HorizonMark /><span>HORIZON</span></div>
        <div className="login-body">
          <p className="eyebrow">CVS ENGINEERING</p>
          <h1 id="login-title">Connexion à Horizon</h1>
          <p className="login-description">Retrouvez votre espace de travail.</p>
          {!environment.pocketBaseUrl && <p role="status" className="login-notice">La connexion n’est pas encore configurée.</p>}
          <form onSubmit={handleSubmit(submit)} noValidate>
            <label htmlFor="login-email">Adresse e-mail</label>
            <HInput id="login-email" type="email" autoComplete="username" autoCapitalize="none" {...register('email')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} disabled={isSubmitting} />
            {errors.email && <p className="field-error" id="email-error">{errors.email.message}</p>}
            <label htmlFor="login-password">Mot de passe</label>
            <HInput id="login-password" type="password" autoComplete="current-password" {...register('password')} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'password-error' : undefined} disabled={isSubmitting} />
            {errors.password && <p className="field-error" id="password-error">{errors.password.message}</p>}
            {error && <p className="field-error login-error" role="alert">{error}</p>}
            <HButton type="submit" variant="primary" disabled={isSubmitting || !environment.pocketBaseUrl}><LogIn size={16} />{isSubmitting ? 'Connexion…' : 'Se connecter'}</HButton>
          </form>
          <p className="login-support">Pour obtenir un accès, contactez votre administrateur.</p>
        </div>
      </section>
    </main>
  )
}
