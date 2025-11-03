"use client";

import { MIDIProvider } from "@react-midi/hooks";
import SettingsProvider from "../../components/providers/settingsProvider";
import CountdownProvider from "@/components/providers/countdownProvider";
import MusicLearnerProvider from "@/components/providers/learningStateMachineProvider";

export default function LearnLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <MIDIProvider>
        <MusicLearnerProvider>
          <SettingsProvider>{children}</SettingsProvider>
        </MusicLearnerProvider>
      </MIDIProvider>
    </>
  );
}
