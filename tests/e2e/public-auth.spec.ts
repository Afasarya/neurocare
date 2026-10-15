import { expect, test } from "@playwright/test";

test("landing sends a new user to registration", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /Pantau lebih awal/i }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Mulai dengan akun" }).click();

  await expect(page).toHaveURL(/\/register$/);
  await expect(
    page.getByRole("heading", { name: "Buat akun NeuroCare" }),
  ).toBeVisible();
});

test("registration gives understandable validation feedback", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Email").fill("bukan-email");
  await page.getByLabel("Kata sandi", { exact: true }).fill("pendek");
  await page.getByLabel("Ulangi kata sandi").fill("berbeda");
  await page.getByRole("button", { name: "Buat akun" }).click();

  await expect(page.getByText("Masukkan alamat email yang valid.")).toBeVisible();
  await expect(page.getByText("Kata sandi minimal 8 karakter.").first()).toBeVisible();
});

test("private route redirects to login and preserves the intended path", async ({ page }) => {
  await page.goto("/app/timeline?filter=prevent");

  await expect(page).toHaveURL(
    /\/login\?next=%2Fapp%2Ftimeline%3Ffilter%3Dprevent$/,
  );
  await expect(
    page.getByRole("heading", { name: "Selamat datang kembali" }),
  ).toBeVisible();
});

test("auth mutation rejects a foreign origin", async ({ request }) => {
  const response = await request.post("/api/auth/login", {
    headers: { origin: "https://attacker.example" },
    data: {},
  });

  expect(response.status()).toBe(403);
});
