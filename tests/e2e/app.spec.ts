import { expect, test } from '@playwright/test'

test('le socle charge sans erreur ni requête PocketBase', async ({ page }) => {
  const errors: string[] = []
  const backendRequests: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (request.url().includes('172.30.10.10:50190')) {
      backendRequests.push(request.url())
    }
  })

  await page.goto('/')
  await expect(page).toHaveTitle('Horizon — CVS Engineering')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  expect(await page.locator('html').getAttribute('lang')).toBe('fr')
  expect(errors).toEqual([])
  expect(backendRequests).toEqual([])
})

test('une adresse inconnue permet de revenir à l’accueil', async ({ page }) => {
  await page.goto('/page-inconnue')
  await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible()
  await page.getByRole('link', { name: 'Revenir à l’accueil' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
})

test('la navigation et le fil d’Ariane restent cohérents en mode réduit', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Réduire la navigation' }).click()
  await expect(page.getByRole('button', { name: 'Développer la navigation' })).toHaveAttribute('aria-expanded', 'false')
  await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Contacts', exact: true }).click()
  await expect(page).toHaveURL('/contacts')
  await expect(page.getByRole('heading', { name: 'Contacts', exact: true })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Fil d’Ariane' }).getByText('Contacts')).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'Contacts', exact: true })).toHaveAttribute('aria-current', 'page')
})

test('la recherche clavier filtre les espaces et ouvre le bon écran', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Rechercher un espace…' }).focus()
  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog', { name: 'Rechercher un espace', exact: true })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('textbox')).toBeFocused()
  await dialog.getByRole('textbox').fill('depenses')
  await expect(dialog.getByRole('link')).toHaveCount(1)
  await dialog.getByRole('link').click()
  await expect(page).toHaveURL('/expenses')
  await expect(dialog).not.toBeVisible()
  await expect(page.getByRole('heading', { name: 'Dépenses', exact: true })).toBeVisible()
})

test('la recherche sans résultat se ferme avec Échap et restitue le focus', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Rechercher un espace…' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Rechercher un espace', exact: true })
  await dialog.getByRole('textbox').fill('inexistant')
  await expect(dialog.getByText('Aucun espace trouvé. Essayez un autre terme.')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('l’aide ouvre un dialogue accessible et se ferme', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Aide et raccourcis' }).click()
  const dialog = page.getByRole('dialog', { name: 'Bienvenue dans Horizon' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Fermer' }).click()
  await expect(dialog).not.toBeVisible()
})

test('le layout reste lisible sur desktop et mobile sans débordement horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await page.screenshot({ path: '/private/tmp/horizon-layout-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: '/private/tmp/horizon-layout-mobile.png', fullPage: true })
})
