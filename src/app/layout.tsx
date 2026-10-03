import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { InventoryProvider } from "@/lib/InventoryContext";
import Navbar from "@/app/components/Navbar";
import { CatalogProvider } from "@/lib/CatalogContext";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "BOB — Build Out of Broken",
  description: "Log the scrap parts collecting dust in your garage. BOB finds what you can actually build — no shopping required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased scroll-smooth">
      <body
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${spaceMono.variable} min-h-full flex flex-col bg-[#0d0d0d] text-[#f0ede6] selection:bg-[#e8c547]/30 font-grotesk`}
      >
        <InventoryProvider>
          <CatalogProvider>
            <Navbar />
            <div className="grow pt-15">
              {children}
            </div>
          </CatalogProvider>
        </InventoryProvider>
      </body>
    </html>
  );
}
