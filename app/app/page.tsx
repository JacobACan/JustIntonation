"use client";

import { MIDIProvider } from "@react-midi/hooks";
import Learn from "./learn/page";
import SettingsProvider from "./provider/settingsProvider";

export default function Home() {
  return (
    <MIDIProvider>
      <SettingsProvider>
        <Learn />
      </SettingsProvider>
    </MIDIProvider>
  );
}
