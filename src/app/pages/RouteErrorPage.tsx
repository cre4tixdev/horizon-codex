import { useEffect } from 'react'
import { useRouteError } from 'react-router'

export function RouteErrorPage() {
  const error = useRouteError()

  useEffect(() => {
    console.error('Erreur de navigation Horizon', error)
  }, [error])

  return (
    <main className="min-h-screen bg-horizon-background p-6" aria-labelledby="error-title">
      <h1 id="error-title">La page n’a pas pu être affichée</h1>
      <p className="mt-2 text-horizon-muted">Réessaie en revenant à l’accueil.</p>
      <a href="/" className="mt-4 inline-block text-horizon-magenta underline underline-offset-4">
        Revenir à l’accueil
      </a>
    </main>
  )
}
