import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "TradeLock",
  description: "Global B2B escrow powered by Arbitrum and tUSD on Arbitrum Sepolia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${manrope.variable} ${spaceGrotesk.variable} min-h-screen bg-[#020b1a] text-slate-100 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
