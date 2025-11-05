import type { Metadata } from "next";
import { Gloria_Hallelujah } from "next/font/google";
import "./globals.css";

const handlee = Gloria_Hallelujah({ weight: "400" });

export const metadata: Metadata = {
  title: "JustIntonation",
  description: "Play what you hear.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${handlee.className} antialiased`}>{children}</body>
    </html>
  );
}
