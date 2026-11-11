import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Storefront, Accessibility, Security Headers & Full Demo Checkout Journey", () => {
  test("verifies /api/health, security headers, robots, sitemap, keyboard skip-link, theme toggle, and WCAG AA axe checks", async ({
    page,
    request,
  }) => {
    const healthRes = await request.get("/api/health");
    expect(healthRes.status()).toBe(200);
    const healthJson = await healthRes.json();
    expect(healthJson.status).toBe("ok");
    expect(healthJson.activeSkus).toBe(40);

    const homeRes = await page.goto("/");
    expect(homeRes).not.toBeNull();
    const headers = homeRes!.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toContain("default-src 'self'");

    const robotsRes = await request.get("/robots.txt");
    expect(robotsRes.status()).toBe(200);
    const robotsTxt = await robotsRes.text();
    expect(robotsTxt).toContain("Disallow: /admin");

    const sitemapRes = await request.get("/sitemap.xml");
    expect(sitemapRes.status()).toBe(200);
    const sitemapXml = await sitemapRes.text();
    expect(sitemapXml).toContain("/product/pocketcell-10k-22-5w-usb-c-power-bank");

    // Keyboard Tab focuses skip-to-content link first
    await page.keyboard.press("Tab");
    const skipLink = page.locator("a.skip-link");
    await expect(skipLink).toBeFocused();

    // Theme toggle switches light -> dark and persists
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "light");
    await page.getByTestId("theme-toggle").click();
    await expect(html).toHaveAttribute("data-theme", "dark");
    await page.getByTestId("theme-toggle").click();
    await expect(html).toHaveAttribute("data-theme", "light");

    // Axe WCAG 2.2 AA check on Home
    const homeAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    const seriousHome = homeAxe.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(seriousHome).toEqual([]);
  });

  test("completes home -> search -> filter -> PDP PIN check -> compare -> cart -> coupon -> demo checkout -> account order & return", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    // Sign in as Demo Customer first so order binds to account history
    await page.goto("/login");
    await page.getByTestId("demo-login-customer").click();
    await expect(page).toHaveURL(/\/account/);

    // Home -> Search
    await page.goto("/");
    await expect(page.getByTestId("home-hero")).toBeVisible();
    const searchInput = page.getByTestId("header-search-input");
    await searchInput.fill("Cable");
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/\/shop\?q=Cable/);

    // Filter Under INR 999 on /shop
    await page.goto("/shop?under999=1");
    await expect(page.getByTestId("shop-result-count")).toContainText(
      "matching SKUs",
    );

    // Add two items to compare tray and inspect /compare
    await page
      .locator(
        '[data-testid="product-card-flexcord-100w-braided-usb-c-cable-2m"] button[aria-label*="Compare"]',
      )
      .click();
    await page
      .locator(
        '[data-testid="product-card-armorcord-240w-e-marked-usb-c-cable"] button[aria-label*="Compare"]',
      )
      .click();
    await expect(page.getByTestId("compare-tray")).toBeVisible();
    await page.getByTestId("compare-tray-open").click();
    await expect(page).toHaveURL(/\/compare\?skus=/);
    await expect(page.getByTestId("compare-matrix-table")).toBeVisible();

    // Axe check on /compare
    const compareAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      compareAxe.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      ),
    ).toEqual([]);

    // Navigate to PDP, test Indian 6-digit PIN delivery check, and add to cart
    await page.goto("/product/voltcore-65w-dual-port-gan-wall-charger");
    await expect(page.getByTestId("pdp-statutory-panel")).toBeVisible();

    await page.getByTestId("pdp-pin-input").fill("560001");
    await page.getByRole("button", { name: "Check PIN" }).click();
    await expect(page.getByTestId("pdp-pin-result")).toContainText("Karnataka");

    // Axe check on PDP
    const pdpAxe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      pdpAxe.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      ),
    ).toEqual([]);

    await page.getByTestId("pdp-add-to-cart").click();
    await expect(page.getByTestId("storefront-toast")).toContainText(
      "Added to cart",
    );

    // Go to Cart, apply WELCOME10 promo, proceed to multi-step Checkout
    await page.goto("/cart");
    await expect(page.getByTestId("cart-line-list")).toBeVisible();
    await page.getByRole("button", { name: "WELCOME10" }).click();
    await expect(page.getByText(/WELCOME10 applied/)).toBeVisible();

    await page.getByTestId("proceed-to-checkout").click();
    await expect(page).toHaveURL(/\/checkout/);

    // Step 1 (pre-populated from Aarav's saved Mumbai address) -> Step 2 -> Step 3
    await page.getByTestId("checkout-continue-step-2").click();
    await expect(page.getByTestId("checkout-step-2")).toBeVisible();

    await page.getByTestId("checkout-reserve-and-pay").click();
    await expect(page.getByTestId("checkout-step-3")).toBeVisible();
    await expect(
      page.getByText(/Non-Charging Demo Payment Flow Active/i),
    ).toBeVisible();

    await page.getByTestId("demo-payment-authorize").click();
    await expect(page).toHaveURL(/\/order-confirmation\/PT-2026-/);
    await expect(page.getByTestId("order-confirmation-card")).toContainText(
      "DEMO_AUTHORIZED",
    );

    // Inspect order in /account/orders and submit a return request
    await page.getByRole("link", { name: "View in My Account" }).click();
    await expect(page).toHaveURL(/\/account\/orders\/ord-/);
    await page.getByTestId("order-open-return-btn").click();
    await page
      .getByTestId("return-details-input")
      .fill("Unopened box return verification from Playwright E2E.");
    await page.getByRole("button", { name: "Submit Return Request" }).click();
    await expect(page.getByText("REQUESTED")).toBeVisible();

    await page.goto("/account/returns");
    await expect(page.getByTestId("account-returns-list")).toContainText(
      "Unopened box return verification",
    );

    expect(errors).toEqual([]);
  });
});
