"use client";

import TranscribeProvider from "@/components/providers/transcribeProvider";

export default function TranscribeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <TranscribeProvider>{children}</TranscribeProvider>;
}
