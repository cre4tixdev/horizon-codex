import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'

// The full Chromium build renders the native PDF viewer; headless shell does not.
test.use({ channel: 'chromium' })

function pdfFixture() {
  const stream = 'BT /F1 18 Tf 24 120 Td (Devis Horizon) Tj ET'
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 160] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']
  let pdf = '%PDF-1.4\n'; const offsets: number[] = []
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${index + 1} 0 obj\n${object}\nendobj\n` })
  const xref = Buffer.byteLength(pdf)
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.map((offset) => String(offset).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(pdf)
}

test('Fil e-mail : destinataires, miniatures, loupe et aperçu sans navigation', async ({ page, request }) => {
  const api = 'http://127.0.0.1:18090/api'
  // Real business source; mail event and binaries simulated here. The complete
  // projection and protected download policy are tested on real PocketBase separately.
  const authResponse = await request.post(api + '/collections/core_users/auth-with-password', { data: { identity: 'erp-admin@local.invalid', password: 'Local-Horizon-test-only-2026!' } })
  expect(authResponse.ok()).toBe(true)
  const auth = await authResponse.json(), headers = { Authorization: auth.token }
  const companyResponse = await request.post(api + '/collections/contacts_companies/records', { headers, data: { name: 'Client aperçu e-mail', active: true } }); expect(companyResponse.ok()).toBe(true)
  const company = await companyResponse.json(), stagesResponse = await request.get(api + '/collections/crm_stages/records?filter=active%3Dtrue&sort=sort_order', { headers }), stages = await stagesResponse.json()
  const opportunityResponse = await request.post(api + '/horizon/crm/save', { headers, data: { creation_key: 'feed-opp-' + crypto.randomUUID(), input: { title: 'Affaire aperçu e-mail', company: company.id, contact: '', owner: auth.record.id, stage: stages.items[0].id, estimated_value: 100, estimated_cost: 50, currency: 'EUR', probability: 30, expected_date: '2026-12-01', description: '', status: 'open' } } }); expect(opportunityResponse.ok()).toBe(true)
  const opportunity = await opportunityResponse.json()
  const quoteResponse = await request.post(api + '/horizon/sales/quotes/save', { headers, data: { creation_key: 'feed-quote-' + crypto.randomUUID(), input: { opportunity: opportunity.id, title: 'Devis aperçu e-mail', quote_date: '2026-10-16', valid_until: '2026-11-16', notes: '', lines: [{ description: 'Prestation', quantity: 1, unit: 'h', unit_price: 100 }] } } }); expect(quoteResponse.ok()).toBe(true)
  const quote = await quoteResponse.json(), eventId = 'mailfeed0000001'
  const files = ['Devis_abcdefghij.pdf', 'Paysage_abcdefghij.webp']
  const text = 'Bonjour, voici notre proposition et les documents associés.\n' + 'Détail de la proposition commerciale. '.repeat(12)
  await page.route('**/api/horizon/activity/events?**', (route) => route.fulfill({ json: { items: [{ id: eventId, collectionId: 'core_activity_events', type: 'change', author: auth.record.id, body: 'Devis envoyé à destinataire@example.invalid', created: '2026-10-16 12:00:00.000Z', attachments: [], metadata: { author: { name: 'Utilisateur test', initials: 'UT' }, email: { to: ['destinataire@example.invalid'], from: 'commercial@example.invalid', subject: 'Votre proposition Horizon', text, attachments: files } } }], page: 1, totalItems: 1, totalPages: 1 } }))
  await page.route('**/api/horizon/activity/events/*/email-attachment?**', async (route) => {
    expect(route.request().headers()['authorization']).toBeTruthy()
    const file = new URL(route.request().url()).searchParams.get('filename')
    await route.fulfill({ contentType: file?.endsWith('.pdf') ? 'application/pdf' : 'image/webp', body: file?.endsWith('.pdf') ? pdfFixture() : await readFile('src/app/assets/login-landscape.webp') })
  })
  await page.goto('/login'); await page.getByLabel('Adresse e-mail', { exact: true }).fill('erp-admin@local.invalid'); await page.getByLabel('Mot de passe', { exact: true }).fill('Local-Horizon-test-only-2026!'); await page.getByRole('button', { name: 'Se connecter', exact: true }).click(); await expect(page).not.toHaveURL(/\/login/)
  await page.setViewportSize({ width: 1600, height: 1000 }); await page.goto('/sales/quotes/' + quote.id + '#activity')
  const feed = page.getByRole('region', { name: 'Fil d’activité' })
  await expect(feed.getByText('a envoyé un e-mail', { exact: true })).toBeVisible(); await expect(feed.getByText('Votre proposition Horizon', { exact: true })).toBeVisible(); await expect(feed.getByText('destinataire@example.invalid', { exact: true })).toBeVisible(); await expect(feed.getByText('commercial@example.invalid', { exact: true })).toBeVisible(); await feed.getByRole('button', { name: 'Voir le message', exact: true }).click(); await expect(feed.getByRole('button', { name: 'Réduire', exact: true })).toHaveAttribute('aria-expanded', 'true'); await feed.getByRole('button', { name: 'Réduire', exact: true }).click()
  const image = feed.getByRole('button', { name: 'Aperçu Paysage.webp', exact: true }), pdf = feed.getByRole('button', { name: 'Aperçu Devis.pdf', exact: true })
  await expect(image).toBeVisible(); await expect(pdf).toBeVisible(); await expect(image.locator('.h-file-thumbnail-zoom')).toBeVisible(); await expect(feed.getByRole('button', { name: /Supprimer la pièce jointe/ })).toHaveCount(0)
  await expect(image.locator('img')).toHaveJSProperty('complete', true); await expect(pdf.locator('iframe')).toHaveAttribute('src', /^blob:/)
  expect(await pdf.locator('iframe').evaluate(async (frame) => (await (await fetch(frame.getAttribute('src')!)).blob()).type)).toBe('application/pdf')
  await page.waitForTimeout(600) // Allow the native PDF viewer to paint the first page.
  const cardWidthRatio = () => feed.locator('.activity-mail-message').evaluate((card) => { const parent = card.parentElement!, style = getComputedStyle(parent); return card.getBoundingClientRect().width / (parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)) })
  expect(await cardWidthRatio()).toBeLessThanOrEqual(0.651)
  await feed.screenshot({ path: '/private/tmp/horizon-mail-feed-light.png' })
  const before = page.url(), pages = page.context().pages().length
  await image.click(); let viewer = page.getByRole('dialog', { name: 'Paysage.webp', exact: true }); await expect(viewer.getByRole('img', { name: 'Paysage.webp' })).toBeVisible(); await viewer.getByRole('button', { name: 'Fermer', exact: true }).click(); await expect(image).toBeFocused()
  await pdf.focus(); await page.keyboard.press('Enter'); viewer = page.getByRole('dialog', { name: 'Devis.pdf', exact: true }); await expect(viewer.locator('iframe')).toHaveAttribute('src', /^blob:/); await page.waitForTimeout(600); /* Native PDF renderer exposes no ready event. */ await page.screenshot({ path: '/private/tmp/horizon-mail-feed-pdf.png' }); await page.keyboard.press('Escape'); await expect(pdf).toBeFocused(); expect(page.url()).toBe(before); expect(page.context().pages()).toHaveLength(pages)
  await feed.getByRole('button', { name: 'Documents', exact: true }).click(); await expect(pdf).toBeVisible()
  await page.getByRole('button', { name: 'Passer en mode sombre', exact: true }).click(); await feed.screenshot({ path: '/private/tmp/horizon-mail-feed-dark.png' })
  await page.setViewportSize({ width: 390, height: 844 }); await feed.scrollIntoViewIfNeeded(); await expect(pdf).toBeVisible(); expect(await cardWidthRatio()).toBeGreaterThan(0.99); await feed.screenshot({ path: '/private/tmp/horizon-mail-feed-mobile.png' }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  // Replies share the compact card, and external content stays escaped text.
  await page.route('**/api/horizon/activity/events?**', (route) => route.fulfill({ json: { items: [{ id: eventId, collectionId: 'core_activity_events', type: 'message', author: '', body: 'Merci, accord pour la proposition.', created: '2026-10-16 12:10:00.000Z', attachments: [], metadata: { author: { name: 'Camille Client', initials: 'CC' }, email: { direction: 'received', received_at: '2026-10-16 12:05:00.000Z', to: [], from: 'client@example.invalid', name: 'Camille Client', subject: 'Re: Votre proposition Horizon', text: 'Merci, accord pour la proposition. <img src=x onerror="alert(1)">', attachments: files, warnings: ['archive.zip : pièce non importée. Consultez Outlook.'] } } }], page: 1, totalItems: 1, totalPages: 1 } }))
  await page.setViewportSize({ width: 1600, height: 1000 }); await page.reload(); await expect(feed.getByText('a répondu par e-mail', { exact: true })).toBeVisible(); await expect(feed.getByText('Camille Client', { exact: true })).toBeVisible(); await expect(feed.getByText(/Merci, accord pour la proposition/)).toBeVisible(); await expect(feed.locator('img[src="x"]')).toHaveCount(0); await expect(feed.getByText(/archive.zip/)).toBeVisible(); await expect(pdf).toBeVisible(); await page.waitForTimeout(600); await feed.screenshot({ path: '/private/tmp/horizon-mail-reply-dark.png' })
  await page.getByRole('button', { name: 'Passer en mode clair', exact: true }).click(); expect(await cardWidthRatio()).toBeLessThanOrEqual(0.651); await feed.screenshot({ path: '/private/tmp/horizon-mail-reply-light.png' }); await page.setViewportSize({ width: 390, height: 844 }); expect(await cardWidthRatio()).toBeGreaterThan(0.99); await feed.screenshot({ path: '/private/tmp/horizon-mail-reply-mobile.png' }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  // Existing note/document attachments use the same thumbnail component.
  await page.route('**/api/horizon/activity/events?**', (route) => route.fulfill({ json: { items: [{ id: eventId, collectionId: 'core_activity_events', type: 'note', author: auth.record.id, body: 'Document du fil', created: '2026-10-16 12:00:00.000Z', attachments: [files[1]], metadata: { author: { name: 'Utilisateur test', initials: 'UT' } } }], page: 1, totalItems: 1, totalPages: 1 } }))
  await page.route('**/api/files/core_activity_events/**', async (route) => route.fulfill({ contentType: 'image/webp', body: await readFile('src/app/assets/login-landscape.webp') }))
  await page.reload(); await expect(feed.getByRole('button', { name: 'Aperçu Paysage.webp', exact: true })).toBeVisible()
})
