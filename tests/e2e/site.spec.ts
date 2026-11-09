import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('navigation, persisted theme, and responsive layout work', async ({
  page,
}) => {
  await page.goto('/blog/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Thinking in systems.',
  );
  await expect(
    page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Home', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  const theme = await page.locator('html').getAttribute('data-theme');
  await page.getByRole('button', { name: /Switch to/ }).click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    theme === 'dark' ? 'light' : 'dark',
  );
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    theme === 'dark' ? 'light' : 'dark',
  );
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Writing', exact: true })
    .click();
  await expect(page).toHaveURL(/\/writing\/$/);
  await page
    .getByRole('navigation', { name: 'Browse writing by topic' })
    .getByRole('link', { name: 'Algorithms', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Algorithms.',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('technical article renders diagrams and code without client errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/blog/writing/chess-search/');
  await expect(page.locator('.mermaid-diagram svg')).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'A minimal chess engine pipeline' }),
  ).toBeVisible();
  await expect(page.locator('.katex').first()).toBeVisible();
  await expect(page.locator('.astro-code').first()).toBeVisible();
  await page.getByText('View diagram source', { exact: true }).click();
  await expect(page.locator('code.language-mermaid')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('MDX demonstration responds to keyboard input', async ({ page }) => {
  await page.goto('/blog/writing/exploration-vs-exploitation/');
  const slider = page.getByRole('slider', { name: 'Exploration rate, ε' });
  await slider.focus();
  await slider.press('ArrowRight');
  await expect(page.locator('.demo-output strong')).toHaveText('21% explore');
  await expect(page.locator('.demo-output span')).toHaveText('79% exploit');
  await slider.press('End');
  await expect(page.locator('.demo-output strong')).toHaveText('100% explore');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('keyboard skip link reaches the main content', async ({ page }) => {
  await page.goto('/blog/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

for (const path of [
  '/blog/',
  '/blog/writing/',
  '/blog/projects/',
  '/blog/about/',
  '/blog/writing/chess-search/',
  '/blog/writing/exploration-vs-exploitation/',
  '/blog/projects/gridworld/',
  '/blog/404/',
]) {
  test(`accessibility: ${path}`, async ({ page }) => {
    await page.goto(path);
    if (path.includes('chess-search'))
      await expect(page.locator('.mermaid-diagram svg')).toBeVisible();
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(result.violations).toEqual([]);
    }
  });
}

test('content and navigation remain available without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/blog/writing/chess-search/');
  await expect(page.locator('code.language-mermaid')).toBeVisible();
  await expect(page.locator('.katex').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Switch to/ })).toBeHidden();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Home', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Thinking in systems.',
  );
  await page.goto(
    'http://127.0.0.1:4322/blog/writing/exploration-vs-exploitation/',
  );
  await expect(page.getByRole('slider')).toBeDisabled();
  await expect(
    page.getByText('This is a static 20% illustration.', { exact: false }),
  ).toBeVisible();
  await context.close();
});
