import { test, expect } from "@playwright/test";
import { resetDb, login } from "./helpers";

test.beforeEach(async () => {
  await resetDb();
});

test("end-to-end: Eleni creates round, kid votes, Eleni closes & decides", async ({ browser }) => {
  // Eleni session
  const elContext = await browser.newContext();
  const elPage = await elContext.newPage();
  await login(elPage, "Eleni");

  // Open dinner round
  await elPage.getByRole("link", { name: /Add dinner options/i }).click();
  await elPage.getByLabel("Option 1 name").fill("Pastitsio");
  await elPage.getByText("+ Add another option").click();
  await elPage.getByLabel("Option 2 name").fill("Mousaka");
  await elPage.getByRole("button", { name: "Open round" }).click();
  await expect(elPage).toHaveURL(/\/round\//);

  // Polys session
  const poContext = await browser.newContext();
  const poPage = await poContext.newPage();
  await login(poPage, "Polys");
  await poPage.getByRole("link", { name: "Tap to vote" }).click();
  await poPage.getByRole("button", { name: /Pastitsio/ }).click();
  await expect(poPage.getByRole("button", { name: /Pastitsio/ })).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  // Eleni closes & decides
  await elPage.reload();
  await elPage.getByRole("button", { name: "Close & decide cooking" }).click();
  await elPage.getByRole("checkbox").first().check(); // top option (Pastitsio after sort)
  await elPage.getByRole("button", { name: /Confirm/ }).click();
  await expect(elPage.getByText(/Cooking:\s*Pastitsio/)).toBeVisible();

  await elContext.close();
  await poContext.close();
});
