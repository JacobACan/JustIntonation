import type { Metadata } from "next";
import { Reenie_Beanie } from "next/font/google";
import "./globals.css";

const reenieBeanie = Reenie_Beanie({
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
      <body
        className={`${reenieBeanie.variable} antialiased`}
      >
          {children}
      </body>
    </html>
  );
}
