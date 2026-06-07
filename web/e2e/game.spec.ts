import { test, expect } from '@playwright/test'

test('E2E-1: App launches and shows Main Menu', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#btn-new-game')).toBeVisible()
  await expect(page.locator('#btn-statistics')).toBeVisible()
  await expect(page.locator('#btn-preferences')).toBeVisible()
})

test('E2E-2: New game starts and shows game board with HUD', async ({ page }) => {
  await page.goto('/')
  await page.click('#btn-new-game')
  await expect(page.locator('.hud-stat').first()).toBeVisible()
  await expect(page.locator('#btn-surrender')).toBeVisible()
  await expect(page.locator('#zone-stock')).toBeVisible()
})

test('E2E-3: Draw from stock moves a card to waste', async ({ page }) => {
  await page.goto('/')
  await page.click('#btn-new-game')
  await page.click('#zone-stock')
  await expect(page.locator('#waste-slot .playing-card')).toBeVisible()
})

test('E2E-4: Statistics screen shows stats', async ({ page }) => {
  await page.goto('/')
  await page.click('#btn-statistics')
  await expect(page.locator('#btn-reset-stats')).toBeVisible()
  await expect(page.locator('.stat-value').first()).toBeVisible()
  await page.click('#btn-back-stats')
  await expect(page.locator('#btn-new-game')).toBeVisible()
})
