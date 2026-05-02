"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { navItems } from "@/lib/mock-data";
import type { CustodyActivityItem, ScreenKey, WalletState } from "@/lib/types";
import { BrandMark, MiniSidebarCard, MobileBottomNav, MobileDrawer, MobileTopBar, navIcons, screenMeta, TopBar, TxTicker } from "@/components/tradelock-ui";
import { Network, Wallet } from "lucide-react";

export function DesktopLayout({
  activeScreen,
  setActiveScreen,
  walletState,
  isWalletBusy,
  onConnectWallet,
  onDisconnectWallet,
  onSwitchWalletNetwork,
  children,
  onOpenSearch,
  tickerItems,
  onOpenCreateDeal,
}: {
  activeScreen: ScreenKey;
  setActiveScreen: (screen: ScreenKey) => void;
  walletState: WalletState;
  isWalletBusy: boolean;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onSwitchWalletNetwork: () => void;
  children: ReactNode;
  onOpenSearch?: () => void;
  tickerItems?: CustodyActivityItem[];
  onOpenCreateDeal?: () => void;
}) {
  const isDashboard = activeScreen === "dashboard";

  return (
    <section className="hidden xl:block">
      <div className="w-full px-[3px] py-[3px]">
        <div className="glass-panel soft-glow relative overflow-hidden rounded-[22px] border border-white/[0.1]">
          <div className="grid min-h-[820px] grid-cols-[238px_minmax(0,1fr)]">
            <aside className="flex flex-col border-r border-white/[0.07] bg-[linear-gradient(160deg,rgba(6,18,44,0.88)_0%,rgba(4,12,30,0.95)_100%)] backdrop-blur-2xl px-4 py-4">
              <BrandMark />
              <nav className="mt-6 space-y-1.5">
              {navItems.map((item) => {
                const Icon = navIcons[item.key];
                const active = activeScreen === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveScreen(item.key)}
                    className={`flex w-full items-center gap-3 rounded-[10px] px-3.5 py-3 text-sm transition ${
                      active
                        ? "bg-[linear-gradient(135deg,rgba(30,86,221,0.92),rgba(16,60,172,0.82))] text-white shadow-[0_8px_24px_rgba(20,86,221,0.38),inset_0_1px_0_rgba(255,255,255,0.1)] border border-blue-500/25"
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              </nav>

              <div className="mt-auto space-y-2.5 pt-6">
                <MiniSidebarCard
                  title="Network"
                  value={walletState.chainName}
                  icon={Network}
                  dotColor={walletState.isCorrectNetwork ? "bg-emerald-400" : "bg-amber-400"}
                  subtitle={walletState.isCorrectNetwork ? "Ready for settlement" : "Switch wallet network"}
                  useArbitrumLogo={walletState.isCorrectNetwork}
                />
                <MiniSidebarCard
                  title="Account"
                  value={walletState.shortAddress}
                  icon={Wallet}
                  dotColor={walletState.isConnected ? "bg-blue-400" : "bg-slate-500"}
                  subtitle={walletState.isConnected ? `${walletState.nativeBalance} ETH` : walletState.connectionLabel}
                />
              </div>
            </aside>

            <div className="relative min-w-0 bg-[linear-gradient(160deg,rgba(5,14,38,0.38)_0%,rgba(3,9,24,0.48)_100%)]">
              <div className="pointer-events-none absolute -top-24 right-8 h-80 w-80 rounded-full bg-blue-600/[0.04] blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-600/[0.028] blur-3xl" />
              <TopBar
                onOpenSearch={onOpenSearch}
                onOpenCreateDeal={onOpenCreateDeal}
                walletState={walletState}
                isWalletBusy={isWalletBusy}
                onConnectWallet={onConnectWallet}
                onDisconnectWallet={onDisconnectWallet}
                onSwitchWalletNetwork={onSwitchWalletNetwork}
              />
              <TxTicker items={tickerItems} />
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScreen}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="space-y-4 px-5 pb-5 pt-3"
                >
                  <div>
                    <h1
                      className={`display-font font-semibold ${
                        isDashboard
                          ? "gradient-text text-[39px] leading-[1.08] tracking-[-0.04em]"
                          : "text-white text-[31px] leading-[1.1] tracking-[-0.03em]"
                      }`}
                    >
                      {screenMeta[activeScreen].title}
                    </h1>
                    <p className={`mt-1 ${isDashboard ? "text-[14px]" : "text-[13px]"} text-slate-400/90`}>
                      {screenMeta[activeScreen].description}
                    </p>
                  </div>
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function MobileLayout({
  activeScreen,
  setActiveScreen,
  navOpen,
  setNavOpen,
  walletState,
  isWalletBusy,
  onConnectWallet,
  onDisconnectWallet,
  onSwitchWalletNetwork,
  children,
  tickerItems,
  onOpenCreateDeal,
}: {
  activeScreen: ScreenKey;
  setActiveScreen: (screen: ScreenKey) => void;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  walletState: WalletState;
  isWalletBusy: boolean;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onSwitchWalletNetwork: () => void;
  children: ReactNode;
  tickerItems?: CustodyActivityItem[];
  onOpenCreateDeal?: () => void;
}) {
  return (
    <section className="xl:hidden">
      <div className="relative min-h-screen bg-[#020b1a]">
        {navOpen && (
          <MobileDrawer
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
            navItems={navItems}
            walletState={walletState}
            isWalletBusy={isWalletBusy}
            onConnectWallet={onConnectWallet}
            onDisconnectWallet={onDisconnectWallet}
            onSwitchWalletNetwork={onSwitchWalletNetwork}
            onClose={() => setNavOpen(false)}
          />
        )}
        <div className="relative z-10 pb-24">
          <MobileTopBar
            walletState={walletState}
            isWalletBusy={isWalletBusy}
            onConnectWallet={onConnectWallet}
            onSwitchWalletNetwork={onSwitchWalletNetwork}
            onOpenCreateDeal={onOpenCreateDeal}
          />
          <TxTicker items={tickerItems} />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              className="space-y-5 px-4 py-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
        <MobileBottomNav
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
        />
      </div>
    </section>
  );
}
