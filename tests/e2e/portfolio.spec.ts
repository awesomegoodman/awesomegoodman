import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({ reducedMotion: 'reduce' });

async function portfolioReady(
  page: import('@playwright/test').Page,
  path = '/',
) {
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute(
    'data-portfolio-ready',
    'true',
  );
}

test('original homepage, portfolio route and blog navigation keep distinct identities', async ({
  page,
  isMobile,
}) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => requests.push(request.url()));
  await portfolioReady(page);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'I am Awesome,',
  );
  await expect(page.locator('.folio-list__item-link')).toHaveCount(4);
  if (isMobile)
    await page.getByRole('button', { name: 'Open navigation' }).click();
  await page
    .getByRole('navigation', { name: 'Portfolio navigation' })
    .getByRole('link', { name: 'Portfolio', exact: true })
    .click();
  await expect(page).toHaveURL(/\/portfolio\/$/);
  await expect(page.locator('#intro')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'favorite projects',
  );
  if (isMobile)
    await page.getByRole('button', { name: 'Open navigation' }).click();
  await page
    .getByRole('navigation', { name: 'Portfolio navigation' })
    .getByRole('link', { name: 'Blog', exact: true })
    .click();
  await expect(page).toHaveURL(/\/blog\/$/);
  await expect(page.locator('html')).toHaveClass('fieldnotes-site');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Thinking in systems.',
  );
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).fontSize,
    ),
  ).toBe('16px');
  await expect(page.locator('.s-pagewrap')).toHaveCount(0);
  await page
    .getByRole('contentinfo')
    .getByRole('link', { name: 'Portfolio', exact: false })
    .click();
  await expect(page).toHaveURL(/\/portfolio\/$/);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).fontSize,
    ),
  ).toBe('10px');
  expect(errors).toEqual([]);
  expect(requests.filter((url) => !url.endsWith('favicon.ico'))).toEqual([]);
});

test('each project dialog supports keyboard dismissal, focus return and repeated opening', async ({
  page,
}) => {
  await portfolioReady(page, '/portfolio/');
  const links = page.locator('.folio-list__item-link');
  for (let index = 0; index < 4; index++) {
    const link = links.nth(index);
    await link.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveCount(1);
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: 'Close project' }),
    ).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(
      dialog.getByRole('link', { name: 'Project link' }),
    ).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(link).toBeFocused();
  }
  await links.first().click();
  await expect(page.getByRole('button', { name: 'Close project' })).toHaveCount(
    1,
  );
  await page.getByRole('button', { name: 'Close project' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('mobile navigation closes on selection and Escape; scroll links reach their sections', async ({
  page,
  isMobile,
}) => {
  await portfolioReady(page);
  if (isMobile) {
    const button = page.locator('.mobile-menu-toggle');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
  }
  await page
    .getByRole('navigation', { name: 'Portfolio navigation' })
    .getByRole('link', { name: 'About', exact: true })
    .click();
  await expect
    .poll(() =>
      page
        .locator('#about')
        .evaluate((el) => Math.abs(el.getBoundingClientRect().top)),
    )
    .toBeLessThan(2);
  if (isMobile)
    await expect(
      page.getByRole('button', { name: 'Open navigation' }),
    ).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('link', { name: 'Back to top', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('testimonials retain mobile pagination and touch/keyboard controls', async ({
  page,
  isMobile,
}) => {
  await portfolioReady(page, '/portfolio/');
  const slider = page.locator('.testimonial-slider');
  await slider.scrollIntoViewIfNeeded();
  await expect(slider).toHaveClass(/swiper-initialized/);
  if (isMobile) {
    const bullets = slider.locator('.swiper-pagination-bullet');
    await expect(bullets).toHaveCount(2);
    await bullets.nth(1).click();
    await expect(bullets.nth(1)).toHaveClass(/swiper-pagination-bullet-active/);
    await page.keyboard.press('ArrowLeft');
    await expect(bullets.first()).toHaveClass(
      /swiper-pagination-bullet-active/,
    );
  } else await expect(slider.locator('.swiper-slide')).toHaveCount(2);
});

test('email controls retain the desktop chooser and native mobile mail link', async ({
  page,
  isMobile,
}) => {
  await portfolioReady(page);
  if (isMobile) {
    await expect(page.locator('.contact-btn')).toHaveAttribute(
      'href',
      'mailto:goodman.awesome@gmail.com',
    );
    return;
  }
  await page.locator('.contact-btn').click();
  await expect(page.locator('#mailtoui-modal')).toBeVisible();
  await expect(page.locator('#mailtoui-modal')).toContainText(
    'goodman.awesome@gmail.com',
  );
  await expect(
    page.locator('#mailtoui-modal a[href*="mail.google.com"]'),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mailtoui-modal')).toBeHidden();
});

for (const path of ['/', '/portfolio/']) {
  test(`portfolio accessibility, responsive widths and local asset loading: ${path}`, async ({
    page,
  }) => {
    const failures: string[] = [];
    page.on('response', (response) => {
      if (
        response.status() >= 400 &&
        response.url().startsWith('http://127.0.0.1')
      )
        failures.push(response.url());
    });
    await portfolioReady(page, path);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(result.violations).toEqual([]);
    for (const width of [320, 390, 600, 768, 820, 900, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${path} at ${width}px`,
      ).toBe(true);
      if (width > 800)
        expect(
          await page
            .locator('.main-nav')
            .evaluate((el) => el.getBoundingClientRect().height),
          `Desktop navigation at ${width}px`,
        ).toBeLessThanOrEqual(66);
    }
    await page.locator('.folio-list__item-link').first().click();
    const modalResult = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(modalResult.violations).toEqual([]);
    expect(failures).toEqual([]);
  });
}

test('portfolio remains readable and navigable without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('#preloader')).toBeHidden();
  await page.locator('.folio-list__item-link').first().click();
  await expect(page.locator('#modal-01')).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Portfolio navigation' })
    .getByRole('link', { name: 'Blog', exact: true })
    .click();
  await expect(page).toHaveURL(/\/blog\/$/);
  await context.close();
});

test('legacy article routes reach their new blog destinations', async ({
  page,
}) => {
  await page.goto('/writing/chess-search/');
  await expect(page).toHaveURL(/\/blog\/writing\/chess-search\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'A chess engine',
  );
});

test.describe('original motion', () => {
  test.use({ reducedMotion: 'no-preference' });
  test('preloader finishes and the original intro and scroll reveals become visible', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute(
      'data-portfolio-ready',
      'true',
      { timeout: 15000 },
    );
    await expect(page.locator('#preloader')).toBeHidden();
    await expect(page.locator('h1')).toHaveCSS('opacity', '1');
    await page.locator('.about-info').scrollIntoViewIfNeeded();
    await expect(page.locator('.about-info')).toHaveClass(/ss-animated/);
    await expect(page.locator('.about-info__pic')).toHaveCSS('opacity', '1');
  });
});
