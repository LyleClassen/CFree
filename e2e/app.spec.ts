import { test, expect } from "@playwright/test"

test.describe("CFree Resume Builder", () => {
  test("loads the application", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=CFree")).toBeVisible()
    await expect(page.locator("text=Résumé Bench")).toBeVisible()
  })

  test("shows the document status with all sections", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("text=Document")).toBeVisible()
    await expect(page.locator("text=Header")).toBeVisible()
    await expect(page.locator("text=Summary")).toBeVisible()
    await expect(page.locator("text=Experience")).toBeVisible()
    await expect(page.locator("text=Education")).toBeVisible()
    await expect(page.locator("text=Skills")).toBeVisible()
  })

  test("shows all four template options", async ({ page }) => {
    await page.goto("/")
    const templates = page.locator("text=Template")
    await expect(templates).toBeVisible()
    await expect(page.locator("text=Professional")).toBeVisible()
    await expect(page.locator("text=Modern")).toBeVisible()
    await expect(page.locator("text=Minimal")).toBeVisible()
    await expect(page.locator("text=Executive")).toBeVisible()
  })

  test("can switch template", async ({ page }) => {
    await page.goto("/")
    await page.locator("button[aria-pressed]:has-text('Professional')")
    const modernBtn = page.locator("button", { hasText: "Modern" })
    await modernBtn.click()
    await expect(page.locator("button[aria-pressed]:has-text('Modern')")).toBeVisible()
  })
})
