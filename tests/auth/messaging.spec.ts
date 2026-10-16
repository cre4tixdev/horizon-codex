import { test, expect } from '@playwright/test'
test('E-mails : expéditeur autorisé, modèle, brouillon, pièces jointes et archivage', async ({ page }) => {
  test.setTimeout(90_000); page.setDefaultTimeout(10_000)
  const errors: string[] = []; page.on('pageerror', (e) => errors.push(e.message))
  await page.setViewportSize({ width: 1600, height: 1000 }); await page.goto('/login')
  await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid'); await page.getByLabel('Mot de passe', { exact: true }).fill('Local-Horizon-test-only-2026!'); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).not.toHaveURL(/\/login/)
  await page.goto('/settings/emails?tab=mailboxes'); await page.getByRole('button', { name: 'Ajouter un expéditeur', exact: true }).click()
  let dialog = page.getByRole('dialog'); await dialog.getByLabel('Nom', { exact: true }).fill('Commercial recette'); await dialog.getByLabel('Adresse d’expédition', { exact: true }).fill('commercial@example.invalid'); await dialog.getByRole('checkbox', { name: /erp-admin@local.invalid/ }).check(); await dialog.getByRole('checkbox', { name: 'Recevoir les réponses dans Horizon', exact: true }).check(); await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Mail.Read · reconnectez la boîte', { exact: true })).toBeVisible()
  await page.screenshot({ path: '/private/tmp/horizon-mail-settings-light.png', fullPage: true })
  await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click(); await page.screenshot({ path: '/private/tmp/horizon-mail-reception-settings-dark.png', fullPage: true }); await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: '/private/tmp/horizon-mail-reception-settings-mobile.png', fullPage: true }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); await page.setViewportSize({ width: 1600, height: 1000 }); await page.getByRole('button', { name: 'Passer en mode clair', exact: true }).click()
  await page.getByRole('tab', { name: 'Modèles', exact: true }).click(); await page.getByRole('button', { name: 'Modifier Envoi de devis', exact: true }).click(); dialog=page.getByRole('dialog'); await dialog.getByRole('button', { name: 'Aperçu avec des données d’exemple', exact: true }).click(); const preview=page.getByRole('dialog', { name: 'Aperçu de l’e-mail', exact: true }); await expect(preview).toContainText('DEV-EXEMPLE'); await preview.getByRole('button', { name: 'Fermer', exact: true }).last().click(); await dialog.getByRole('button', { name: 'Fermer', exact: true }).last().click()
  await page.goto('/settings/achats'); await expect(page.getByRole('button', { name: 'Enregistrer', exact: true })).toBeVisible(); await page.screenshot({ path: '/private/tmp/horizon-mail-settings-reference.png', fullPage: true })
  await page.goto('/messaging'); await page.getByRole('button', { name: 'Nouvel e-mail', exact: true }).click(); dialog = page.getByRole('dialog')
  await dialog.getByLabel('À', { exact: true }).fill('destinataire@example.invalid'); await dialog.getByLabel('Objet de l’e-mail', { exact: true }).fill('Recette e-mails Horizon')
  await dialog.getByRole('textbox', { name: 'Message de l’e-mail', exact: true }).fill('Bonjour, voici notre message de recette.')
  await dialog.getByRole('tab', { name: /Pièces jointes/ }).click(); await dialog.getByLabel('Ajouter des pièces jointes', { exact: true }).setInputFiles({ name: 'justificatif.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') }); await expect(dialog.getByRole('button', { name: 'Afficher justificatif.png', exact: true })).toBeVisible(); await dialog.getByRole('tab', { name: 'Message', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'Envoyer', exact: true })).toBeDisabled()
  await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(dialog.getByRole('button', { name: 'Enregistrer', exact: true })).toBeDisabled()
  await page.screenshot({ path: '/private/tmp/horizon-mail-composer-light.png', fullPage: true })
  await dialog.getByRole('button', { name: 'Fermer', exact: true }).last().click(); await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('row').filter({ hasText: 'Recette e-mails Horizon' })).toBeVisible(); await page.reload(); await page.getByRole('row').filter({ hasText: 'Recette e-mails Horizon' }).click(); dialog=page.getByRole('dialog'); await expect(dialog.getByLabel('Objet de l’e-mail')).toHaveValue('Recette e-mails Horizon')
  await dialog.getByRole('button', { name: 'Actions de la fiche', exact: true }).click(); await page.getByRole('menuitem', { name: 'Archiver', exact: true }).click(); const confirmation=page.getByRole('alertdialog'); await confirmation.getByRole('textbox').fill('ARCHIVER'); await confirmation.getByRole('button', { name: 'Archiver', exact: true }).click(); await expect(confirmation).toHaveCount(0); await dialog.getByRole('button', { name: 'Fermer', exact: true }).last().click()
  await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click(); await page.screenshot({ path: '/private/tmp/horizon-mail-list-dark.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 }); await page.getByRole('button', { name: 'Nouvel e-mail', exact: true }).click(); await expect(page.getByRole('dialog').getByRole('button', { name: 'Fermer', exact: true }).last()).toBeVisible(); await page.screenshot({ path: '/private/tmp/horizon-mail-composer-mobile.png', fullPage: true }); expect(errors).toEqual([])
  await page.goto('/settings/emails?tab=mailboxes'); await expect(page.getByRole('button', { name: 'Ajouter un expéditeur', exact: true })).toBeVisible(); await page.screenshot({ path: '/private/tmp/horizon-mail-settings-mobile-dark.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.setViewportSize({ width: 1600, height: 1000 }); await page.screenshot({ path: '/private/tmp/horizon-mail-settings-dark.png', fullPage: true })
})

test('Connexion Microsoft : état lié à l’onglet, retour nettoyé et déconnexion confirmée', async ({ page }) => {
  // Microsoft navigation and callback are simulated; backend OAuth is tested on real PocketBase separately.
  await page.goto('/login')
  await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid'); await page.getByLabel('Mot de passe', { exact: true }).fill('Local-Horizon-test-only-2026!'); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).not.toHaveURL(/\/login/)
  let callbacks = 0, connected = false, disconnections = 0
  const state = 'a'.repeat(64)
  await page.route('**/api/horizon/messaging/settings', async (route) => {
    if (route.request().method() !== 'GET') { await route.continue(); return }
    const response = await route.fetch(), data = await response.json()
    data.configured = true
    data.mailboxes = [{ id: 'mailboxlocal001', name: 'Boîte de recette', address: 'commercial@example.invalid', active: true, allowed_users: [], updated: '', connection: { status: connected ? 'connected' : 'disconnected', address: connected ? 'commercial@example.invalid' : '', connected_at: '' } }]
    await route.fulfill({ response, json: data })
  })
  await page.route('**/api/horizon/messaging/oauth/callback', async (route) => {
    callbacks++; expect(route.request().postDataJSON()).toEqual({ state, code: 'fictional-code' }); connected = true
    await route.fulfill({ json: { connected: true } })
  })
  await page.goto('/messaging/oauth/callback?state=forged&code=fictional-code')
  await expect(page.getByRole('alert')).toContainText('Connexion annulée'); await expect(page).toHaveURL(/\/messaging\/oauth\/callback$/); expect(callbacks).toBe(0)
  let redirectOrigin = 'http://localhost:9999'
  await page.route('**/api/horizon/messaging/oauth/start', (route) => route.fulfill({ json: { url: `https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize?state=${state}&redirect_uri=${encodeURIComponent(redirectOrigin + '/messaging/oauth/callback')}` } }))
  await page.route('https://login.microsoftonline.com/**', (route) => route.fulfill({ status: 302, headers: { Location: `http://127.0.0.1:4174/messaging/oauth/callback?state=${state}&code=fictional-code` }, body: '' }))
  await page.goto('/settings/emails?tab=mailboxes'); await page.getByRole('button', { name: 'Connecter commercial@example.invalid', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Ouvrez Horizon depuis http://localhost:9999'); await expect(page).toHaveURL(/settings\/emails/); expect(callbacks).toBe(0)
  redirectOrigin = 'http://127.0.0.1:4174'; await page.getByRole('button', { name: 'Connecter commercial@example.invalid', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'La boîte Microsoft est connectée' })).toBeVisible(); expect(callbacks).toBe(1)
  await expect(page).toHaveURL(/\/messaging\/oauth\/callback$/)
  expect(await page.evaluate(() => sessionStorage.getItem('horizon-mail-oauth-state'))).toBeNull()
  await page.getByRole('link', { name: 'Revenir aux expéditeurs' }).click(); await expect(page.getByText('Connectée', { exact: true })).toBeVisible()
  await page.route('**/api/horizon/messaging/oauth/disconnect', (route) => { disconnections++; connected = false; return route.fulfill({ json: { disconnected: true } }) })
  await page.getByRole('button', { name: 'Déconnecter commercial@example.invalid', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('brouillons et l’historique'); expect(disconnections).toBe(0)
  await page.getByRole('dialog').getByRole('button', { name: 'Déconnecter', exact: true }).click()
  await expect(page.getByText('Non connectée', { exact: true })).toBeVisible(); expect(disconnections).toBe(1)
})

test('Envoi immédiat : le compositeur affiche directement le résultat accepté', async ({ page }) => {
  // Only the HTTP transition is simulated; immediate worker/Graph behavior is
  // exercised separately against disposable PocketBase and fake Microsoft.
  const { messageSchema } = await import('../../src/modules/messaging/schemas/mail')
  let draft: ReturnType<typeof messageSchema.parse> | undefined, submissions = 0
  await page.goto('/login')
  await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid'); await page.getByLabel('Mot de passe', { exact: true }).fill('Local-Horizon-test-only-2026!'); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).not.toHaveURL(/\/login/)
  await page.goto('/settings/emails?tab=mailboxes'); await page.getByRole('button', { name: 'Ajouter un expéditeur', exact: true }).click()
  const sender = page.getByRole('dialog'); await sender.getByLabel('Nom', { exact: true }).fill('Recette immédiate'); await sender.getByLabel('Adresse d’expédition', { exact: true }).fill('immediate@example.invalid'); await sender.getByRole('checkbox', { name: /erp-admin@local.invalid/ }).check(); await sender.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(sender).toHaveCount(0)
  await page.route('**/api/horizon/messaging/choices?**', async (route) => {
    const response = await route.fetch(), data = await response.json()
    data.configured = true
    for (const box of data.mailboxes) box.connection.status = 'connected'
    await route.fulfill({ response, json: data })
  })
  await page.route('**/api/horizon/messaging/messages', async (route) => {
    if (route.request().method() !== 'POST') { await route.continue(); return }
    const response = await route.fetch(); draft = messageSchema.parse(await response.json()); await route.fulfill({ response, json: draft })
  })
  await page.route('**/api/horizon/messaging/messages/*/transition', async (route) => {
    expect(route.request().postDataJSON().action).toBe('enqueue'); expect(draft).toBeDefined(); submissions++
    await route.fulfill({ json: { ...draft, status: 'sent', sent_at: new Date().toISOString() } })
  })
  await page.goto('/messaging'); await page.getByRole('button', { name: 'Nouvel e-mail', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Préparer un e-mail' })
  await dialog.getByLabel('À', { exact: true }).fill('destinataire@example.invalid'); await dialog.getByLabel('Objet de l’e-mail', { exact: true }).fill('Envoi immédiat simulé')
  await dialog.getByRole('textbox', { name: 'Message de l’e-mail', exact: true }).fill('Bonjour, essai local du retour immédiat.')
  await dialog.getByRole('button', { name: 'Envoyer', exact: true }).click()
  await page.getByRole('dialog', { name: 'Envoyer cet e-mail ?' }).getByRole('button', { name: 'Confirmer l’envoi' }).click()
  const sent = page.getByRole('dialog', { name: 'Envoi immédiat simulé' })
  await expect(sent.getByText('Envoyé', { exact: true })).toBeVisible(); await expect(sent.getByText(/Accepté par Microsoft 365 le/)).toBeVisible()
  await expect(sent.getByRole('button', { name: 'Envoyer', exact: true })).toHaveCount(0); expect(submissions).toBe(1)
})
