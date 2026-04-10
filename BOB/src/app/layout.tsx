import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BOB - DIY Tech Project Discovery",
  description: "Find amazing tech projects based on the hardware and components you already own.",
};

import { InventoryProvider } from "@/lib/InventoryContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased scroll-smooth suppressHydrationWarning">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30`}>
        <InventoryProvider>
          {children}
        </InventoryProvider>
      </body>
    </html>
  );
}


