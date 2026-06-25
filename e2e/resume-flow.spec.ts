import { test, expect } from "@playwright/test"

test.describe("Resume editing flow", () => {
  test("fills in the header form", async ({ page }) => {
    await page.goto("/")

    // Header form should be visible in the first section
    const headerSection = page.locator("section").filter({ hasText: "01Header" })
    await expect(headerSection).toBeVisible()

    // Fill in full name
    const nameInput = headerSection.locator('input[placeholder="Jane Doe"]')
    await nameInput.fill("Jane Doe")

    // Fill in email
    const emailInput = page.locator('input[placeholder="jane@example.com"]')
    await emailInput.fill("jane@example.com")

    // Fill in phone
    const phoneInput = page.locator('input[placeholder="(555) 123-4567"]')
    await phoneInput.fill("(555) 123-4567")

    // Verify the "ready" indicator appears for the header section
    await expect(headerSection.locator("text=ready")).toBeVisible()
  })

  test("fills in the summary", async ({ page }) => {
    await page.goto("/")

    const summarySection = page.locator("section").filter({ hasText: "02Summary" })
    await summarySection.scrollIntoViewIfNeeded()

    const summaryInput = page.locator("textarea")
    await summaryInput.fill("Senior engineer with 6 years experience in fintech.")
    await expect(summarySection.locator("text=ready")).toBeVisible()
  })

  test("adds an experience entry and fills it", async ({ page }) => {
    await page.goto("/")

    const expSection = page.locator("section").filter({ hasText: "03Experience" })
    await expSection.scrollIntoViewIfNeeded()

    // Click "Add experience"
    await page.locator("button", { hasText: "Add experience" }).click()

    // Fill in the role
    const roleInput = expSection.locator('input[placeholder="Senior Engineer"]')
    await roleInput.fill("Senior Engineer")

    // Fill in company
    const companyInput = expSection.locator('input[placeholder="Acme Inc."]')
    await companyInput.fill("Acme Inc.")

    // Fill in dates
    const startInput = expSection.locator('input[placeholder="Jan 2022"]')
    await startInput.fill("Jan 2022")

    const endInput = expSection.locator('input[placeholder="Present"]')
    await endInput.fill("Present")
  })

  test("adds an education entry", async ({ page }) => {
    await page.goto("/")

    const eduSection = page.locator("section").filter({ hasText: "04Education" })
    await eduSection.scrollIntoViewIfNeeded()

    await page.locator("button", { hasText: "Add education" }).click()

    const instInput = eduSection.locator('input[placeholder="State University"]')
    await instInput.fill("MIT")
  })

  test("adds a skill category and skills", async ({ page }) => {
    await page.goto("/")

    const skillsSection = page.locator("section").filter({ hasText: "05Skills" })
    await skillsSection.scrollIntoViewIfNeeded()

    // Add a category
    await page.locator("button", { hasText: "Add category" }).click()

    // Fill category name
    const catInput = skillsSection.locator('input[placeholder="Category (e.g. Front-End)"]')
    await catInput.fill("Front-End")

    // Add a skill
    const skillInput = skillsSection.locator('input[placeholder="Add a skill, press Enter"]')
    await skillInput.fill("React")
    await page.locator("button", { hasText: "Add" }).click()
  })

  test("creates a full resume with header, summary, experience, education, and skills", async ({ page }) => {
    await page.goto("/")

    // Header
    await page.locator('input[placeholder="Jane Doe"]').fill("John Smith")
    await page.locator('input[placeholder="jane@example.com"]').fill("john@example.com")

    // Summary
    const summarySection = page.locator("section").filter({ hasText: "02Summary" })
    await summarySection.scrollIntoViewIfNeeded()
    await page.locator("textarea").fill("Engineer with 10 years of experience building scalable systems.")

    // Experience
    const expSection = page.locator("section").filter({ hasText: "03Experience" })
    await expSection.scrollIntoViewIfNeeded()
    await page.locator("button", { hasText: "Add experience" }).click()
    await expSection.locator('input[placeholder="Senior Engineer"]').fill("Senior Engineer")
    await expSection.locator('input[placeholder="Acme Inc."]').fill("Acme Inc.")
    await expSection.locator('input[placeholder="Jan 2022"]').fill("Jan 2022")

    // Education
    const eduSection = page.locator("section").filter({ hasText: "04Education" })
    await eduSection.scrollIntoViewIfNeeded()
    await page.locator("button", { hasText: "Add education" }).click()
    await eduSection.locator('input[placeholder="State University"]').fill("MIT")
    await eduSection.locator('input[placeholder="B.S."]').fill("B.S.")
    await eduSection.locator('input[placeholder="Computer Science"]').fill("CS")

    // Skills
    const skillsSection = page.locator("section").filter({ hasText: "05Skills" })
    await skillsSection.scrollIntoViewIfNeeded()
    await page.locator("button", { hasText: "Add category" }).click()
    await skillsSection.locator('input[placeholder="Category (e.g. Front-End)"]').fill("Front-End")
    await skillsSection.locator('input[placeholder="Add a skill, press Enter"]').fill("React")
    await page.locator("button", { hasText: "Add" }).click()
    await skillsSection.locator('input[placeholder="Add a skill, press Enter"]').fill("TypeScript")
    await page.locator("button", { hasText: "Add" }).click()
  })
})
