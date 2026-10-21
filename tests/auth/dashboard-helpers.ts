import { expect, type Page } from '@playwright/test'

export async function manageDashboards(page: Page) {
  const dialog = page.getByRole('menu', { name: 'Mes dashboards', exact: true })
  if (!await dialog.isVisible()) await page.getByRole('button', { name: 'Gérer les dashboards', exact: true }).click()
  await expect(dialog).toBeVisible()
  return dialog
}
export async function closeDashboardManagement(page: Page) {
  const dialog = page.getByRole('menu', { name: 'Mes dashboards', exact: true })
  if (await dialog.isVisible()) await page.keyboard.press('Escape')
}

export async function dashboardChoices(page: Page) {
  await manageDashboards(page)
  await page.getByRole('menuitem', { name: 'Changer de dashboard', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Rechercher un dashboard', exact: true })).toBeVisible()
}
