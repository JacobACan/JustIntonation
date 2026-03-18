"use client";

import { MIDIProvider } from "@react-midi/hooks";
import ScalesQuizProvider from "@/components/providers/scalesQuizProvider";
import ScalesQuizSettingsProvider from "@/components/providers/scalesQuizSettingsProvider";
import ScalesPianoSound from "@/components/conceptualize/scales/scalesPianoSound";

export default function ScalesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MIDIProvider>
      <ScalesQuizProvider>
        <ScalesQuizSettingsProvider>
          <ScalesPianoSound />
          {children}
        </ScalesQuizSettingsProvider>
      </ScalesQuizProvider>
    </MIDIProvider>
  );
}
