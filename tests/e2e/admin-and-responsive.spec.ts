import { expect, test } from "@playwright/test";

test.describe("Admin RBAC, Product Gate, Inventory, Fulfilment & Multi-Viewport Audit", () => {
  test("denies unauthenticated and CUSTOMER access to /admin, then executes admin product edit, stock change & fulfilment", async ({
    page,
  }) => {
    // Unauthenticated -> redirected to /login
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);

    // Customer role -> denied /admin
    await page.getByTestId("demo-login-customer").click();
    await expect(page).toHaveURL(/\/account/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/account\?denied=admin/);
    await page.getByTestId("account-logout").click();
    await expect(page).toHaveURL("http://localhost:3140/");

    // Sign in as Super Admin
    await page.goto("/login");
    await page.getByTestId("demo-login-super-admin").click();
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByTestId("admin-command-center")).toBeVisible();

    // Admin Product Edit + Compliance Gate check
    await page.goto("/admin/products");
    await page
      .getByTestId("admin-edit-pocketcell-10k-22-5w-usb-c-power-bank")
      .click();
    await expect(page.getByTestId("admin-product-form")).toBeVisible();

    // Attempt prohibited claim "military-grade" while ACTIVE -> must be rejected by Compliance Gate
    const titleInput = page.getByTestId("admin-product-title");
    const originalTitle = await titleInput.inputValue();
    await titleInput.fill("Military-Grade PocketCell 10K");
    await page.getByTestId("admin-product-save").click();
    await expect(page.getByTestId("admin-compliance-error")).toContainText(
      "military-grade",
    );

    // Restore valid title and save cleanly
    await titleInput.fill(originalTitle);
    await page.getByTestId("admin-product-save").click();
    await expect(page.getByTestId("admin-product-saved")).toBeVisible();

    // Admin Inventory Stock Adjustment
    await page.goto("/admin/inventory");
    const row = page.getByTestId("inventory-row-PT-PWR-001-GRP");
    const beforeText = await row.innerText();
    const beforeMatch = beforeText.match(/(\d+)\s+units/i);
    const beforeUnits = Number(beforeMatch?.[1] ?? 0);

    await page.getByTestId("inv-delta-PT-PWR-001-GRP").fill("5");
    await page.getByTestId("inv-apply-PT-PWR-001-GRP").click();
    await expect(row).toContainText(new RegExp(`${beforeUnits + 5}\\s+units`, "i"));

    // Admin Order Fulfilment update
    await page.goto("/admin/orders");
    await page.getByTestId("admin-manage-order-PT-2026-10001").click();
    await page
      .getByTestId("admin-order-status-select")
      .selectOption("SHIPPED");
    await page
      .getByTestId("admin-order-tracking-input")
      .fill("PTE2E400028IN");
    await page.getByTestId("admin-order-save-btn").click();
    await expect(page.getByText("SHIPPED").first()).toBeVisible();
  });

  test("passes horizontal overflow, broken-asset, and mobile navigation checks at 360px, 390px, 768px, and 1440px", async ({
    page,
  }) => {
    const viewports = [
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ];
    const routes = [
      "/",
      "/shop",
      "/product/pocketcell-pro-20k-65w-laptop-power-bank",
      "/compare",
      "/guides",
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      for (const route of routes) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.locator("main")).toBeVisible();

        const overflowCheck = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          if (docWidth <= winWidth) {
            return { ok: true, docWidth, winWidth, offenders: [] as string[] };
          }
          const offenders: string[] = [];
          for (const el of Array.from(document.querySelectorAll("*"))) {
            const rect = el.getBoundingClientRect();
            if (rect.right > winWidth + 1) {
              offenders.push(
                `${el.tagName.toLowerCase()}.${el.className} (right=${Math.round(rect.right)})`,
              );
            }
          }
          return {
            ok: false,
            docWidth,
            winWidth,
            offenders: offenders.slice(0, 5),
          };
        });

        expect(
          overflowCheck,
          `Overflow on ${route} at ${vp.width}px`,
        ).toEqual({
          ok: true,
          docWidth: overflowCheck.docWidth,
          winWidth: overflowCheck.winWidth,
          offenders: [],
        });

        // Verify visible images loaded cleanly without broken URLs
        const brokenImages = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll("img"));
          return imgs
            .filter((img) => img.complete && img.naturalWidth === 0)
            .map((img) => img.getAttribute("src") ?? "unknown");
        });
        expect(brokenImages, `Broken images on ${route}`).toEqual([]);
      }
    }

    // Test mobile drawer navigation at 360px
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    await page.getByTestId("mobile-menu-open").click();
    await page
      .getByRole("dialog", { name: "Site navigation" })
      .getByRole("link", { name: "Buying Guides" })
      .click();
    await expect(page).toHaveURL(/\/guides/);
  });
});
