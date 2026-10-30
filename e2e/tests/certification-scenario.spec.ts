import { test, expect } from '@playwright/test';

/**
 * The single certification-required scenario:
 * 1. Create Profile
 * 2. Login with Profile + PIN
 * 3. Create a new Wisdom entry
 * 4. Save it
 * 5. Open the Wisdom list
 * 6. Assert the created wisdom is visible in the list
 *
 * Each run uses a unique profile name / wisdom text so the test is
 * repeatable against a persistent SQLite database (no reset between runs).
 */
test('create profile, login, create wisdom, verify it appears in the list', async ({ page }) => {
  const uniqueSuffix = Date.now().toString();
  const profileName = `E2ECat_${uniqueSuffix}`;
  const pin = '1234';
  const wisdomText = `Test wisdom ${uniqueSuffix}: a cat always lands on its paws.`;

  // 1. Create Profile
  await page.goto('/login');
  await page.getByTestId('create-profile-tab').click();
  await page.getByTestId('create-profile-name').fill(profileName);
  await page.getByTestId('create-profile-pin').fill(pin);
  await page.locator('input[autocomplete="new-password"]').nth(1).fill(pin);
  await page.getByTestId('create-profile-submit').click();

  // Profile creation logs the user in automatically and redirects home.
  await expect(page).toHaveURL('/');

  // 2. Login with Profile + PIN (log out implicitly not exposed; instead
  // verify login works standalone by logging out via clearing storage and
  // logging back in, proving the created credentials are valid).
  await page.evaluate(() => localStorage.clear());
  await page.goto('/login');
  await page.getByTestId('login-profile-name').fill(profileName);
  await page.getByTestId('login-pin').fill(pin);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL('/');

  // 3. Create a new Wisdom entry
  await page.getByTestId('library-link').click();
  await expect(page).toHaveURL('/library');
  await page.getByRole('button', { name: '+ New wisdom' }).click();
  await expect(page).toHaveURL('/library/new');
  await page.getByTestId('wisdom-text-input').fill(wisdomText);

  // 4. Save it
  await page.getByTestId('wisdom-save-button').click();
  await expect(page).toHaveURL(/\/library\/[^/]+$/);

  // 5. Open the Wisdom list
  await page.getByTestId('library-link').click();
  await expect(page).toHaveURL('/library');

  // 6. Assert the created wisdom is visible in the list
  await expect(page.getByTestId('wisdom-list-item').filter({ hasText: wisdomText })).toBeVisible();
});
