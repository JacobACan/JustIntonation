"use client";

import { MIDIProvider } from "@react-midi/hooks";
import Learn from "./learn/notes/notes";
import SettingsProvider from "./provider/settingsProvider";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-background1">
      <button
        className="hover:cursor-pointer"
        onClick={() => (window.location.href = "/learn")}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 48 48"
          fill="none"
          stroke="var(--middleground1)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon
            points="20,16 34,24 20,32"
            fill="var(--middleground1)"
            stroke="var(--middleground1)"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
