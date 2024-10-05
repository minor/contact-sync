import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Contact Quick Add",
  description:
    "Simple app that creates a file to add multiple contacts from manual entry, spreadsheet, or even a screenshot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Analytics />
      <Toaster duration={2000} position="bottom-center" />
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
