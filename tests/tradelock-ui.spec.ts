import { expect, test, type Page } from "@playwright/test";

async function mockInjectedWallet(page: Page) {
  await page.addInitScript(() => {
    const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
    let chainId = "0x66eee";
    let accounts: string[] = [];
    const address = "0x1111111111111111111111111111111111111111";

    const emit = (event: string, payload: unknown) => {
      for (const listener of listeners[event] ?? []) {
        listener(payload);
      }
    };

    window.ethereum = {
      async request({ method, params }: { method: string; params?: unknown[] }) {
        if (method === "eth_chainId") {
          return chainId;
        }

        if (method === "eth_accounts") {
          return accounts;
        }

        if (method === "eth_requestAccounts") {
          accounts = [address];
          emit("accountsChanged", accounts);
          return accounts;
        }

        if (method === "wallet_switchEthereumChain") {
          const requested = (params?.[0] as { chainId?: string } | undefined)?.chainId;
          if (requested) {
            chainId = requested;
            emit("chainChanged", chainId);
          }
          return null;
        }

        if (method === "wallet_addEthereumChain") {
          const requested = (params?.[0] as { chainId?: string } | undefined)?.chainId;
          if (requested) {
            chainId = requested;
            emit("chainChanged", chainId);
          }
          return null;
        }

        throw new Error(`Unsupported method: ${method}`);
      },
      on(event: string, handler: (...args: unknown[]) => void) {
        listeners[event] = [...(listeners[event] ?? []), handler];
      },
      removeListener(event: string, handler: (...args: unknown[]) => void) {
        listeners[event] = (listeners[event] ?? []).filter((listener) => listener !== handler);
      },
    };
  });
}

test("shows disconnected wallet state when no injected wallet is present", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Global B2B Escrow Dashboard")).toBeVisible();
  await expect(page.getByRole("button", { name: "Install MetaMask" })).toBeVisible();
  await expect(page.getByText("Not connected").first()).toBeVisible();
});

test("connects a mocked injected wallet from the desktop top bar", async ({ page }) => {
  await mockInjectedWallet(page);

  await page.goto("/");

  await expect(page.getByRole("button", { name: "Connect Wallet" })).toBeVisible();
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: "Connect Wallet" }).click({ force: true });

  await expect(page.getByText("0x1111...1111").first()).toBeVisible();
  await expect(page.getByText("Arbitrum Sepolia").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Disconnect" })).toBeVisible();
});

test("desktop menus support live filters, search, and pagination", async ({ page }) => {
  test.setTimeout(60_000);
  await mockInjectedWallet(page);
  await page.goto("/");
  await page.waitForTimeout(1500);
  const desktopNav = page.locator("aside").first();

  await desktopNav.getByRole("button", { name: "Deals", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Deals" })).toBeVisible();
  const dealsSearch = page.getByPlaceholder("Search deals, counterparties, hashes...");
  await dealsSearch.fill("GlobalImport");
  await expect(page.locator("table").first().getByText("GlobalImport Ltd.", { exact: true }).first()).toBeVisible();
  await dealsSearch.fill("");
  await page.getByRole("button", { name: "Completed" }).click();
  await expect(page.getByText(/Showing .* deals/).first()).toBeVisible();
  await page.getByRole("button", { name: "All Deals" }).click();
  await page.getByRole("button", { name: "Next" }).first().click();
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ deals/).first()).toBeVisible();

  await desktopNav.getByRole("button", { name: "Audit" }).click();
  await expect(page.getByRole("heading", { name: "Audit Trail" })).toBeVisible();
  const auditSearch = page.getByPlaceholder("Search events, deals, hashes...");
  await auditSearch.fill("Funds Released");
  await expect(page.getByText(/Showing .* events/).first()).toBeVisible();
  await auditSearch.fill("");
  await page.getByRole("button", { name: "Funds Released" }).click();
  await page.getByRole("button", { name: "All Events" }).first().click();
  await page.getByRole("button", { name: "Next" }).first().click();
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ events/).first()).toBeVisible();

  await desktopNav.getByRole("button", { name: "Disputes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Disputes" })).toBeVisible();
  await page.getByPlaceholder("Search disputes, deals, parties...").fill("Under Review");
  await expect(page.getByText(/Showing .* disputes/).first()).toBeVisible();

  await desktopNav.getByRole("button", { name: "Counterparties", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Counterparties" })).toBeVisible();
  const counterpartiesSearch = page.getByPlaceholder("Search companies, handles, wallets...");
  await counterpartiesSearch.fill("London");
  await expect(page.locator("table").first().getByText("London Supply Partners", { exact: true }).first()).toBeVisible();
  await counterpartiesSearch.fill("");
  await page.getByRole("button", { name: "Next" }).first().click();
  await expect(page.getByText(/Showing \d+ to \d+ of \d+ counterparties/).first()).toBeVisible();

  await desktopNav.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Arun Mehta - Admin")).toHaveCount(0);
  await expect(page.getByText("12 active members")).toHaveCount(0);
});
