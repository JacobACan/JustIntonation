"use client";

import { MIDIProvider } from "@react-midi/hooks";
import Learn from "./learn/page";

export default function Home() {
  return (
    <MIDIProvider>
      <Learn />
    </MIDIProvider>
  );
}
