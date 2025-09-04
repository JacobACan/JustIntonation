import type { Metadata } from "next";
import { Handlee } from "next/font/google";
import "./globals.css";

const handlee = Handlee({
  variable: "--font-reenie-beanie",
  subsets: ["latin"],
  weight: "400",
});

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
      <body className={`${handlee.variable} antialiased`}>{children}</body>
    </html>
  );
}
