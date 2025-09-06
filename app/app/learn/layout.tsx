"use client";

import { MIDIProvider } from "@react-midi/hooks";
import SettingsProvider from "../provider/settingsProvider";
import { SettingsIcon } from "../components/settings/settingsIcon";
import Settings from "../components/settings/settings";
import { useState } from "react";

export default function LearnLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <MIDIProvider>
        <SettingsProvider>
          {/* Settings gear icon */}
          <button
            className="absolute top-4 right-4 z-50 bg-transparent border-none p-2 cursor-pointer hover:scale-110 transition-transform"
            aria-label="Open settings"
            onClick={() => setSettingsOpen(true)}
          >
            <SettingsIcon />
          </button>
          {/* Settings overlay */}
          <Settings
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
          />
          {children}
        </SettingsProvider>
      </MIDIProvider>
    </>
  );
}
