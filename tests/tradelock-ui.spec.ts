import { expect, test } from "@playwright/test";

test("shows disconnected wallet state when no injected wallet is present", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Global B2B Escrow Dashboard")).toBeVisible();
  await expect(page.getByRole("button", { name: "Install MetaMask" })).toBeVisible();
  await expect(page.getByText("Not connected").first()).toBeVisible();
});

test("connects a mocked injected wallet from the desktop top bar", async ({ page }) => {
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

  await page.goto("/");

  await expect(page.getByRole("button", { name: "Connect Wallet" })).toBeVisible();
  await page.waitForTimeout(2500);
  await page.getByRole("button", { name: "Connect Wallet" }).click({ force: true });

  await expect(page.getByText("0x1111...1111").first()).toBeVisible();
  await expect(page.getByText("Arbitrum Sepolia").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Disconnect" })).toBeVisible();
});
