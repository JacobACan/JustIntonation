import React from "react";
import { MidiSelector } from "./midi";

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

export default function Settings({ open, onClose }: SettingsProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-auto bg-[var(--background2)] rounded-md shadow-lg p-6 overflow-y-auto">
        <button
          className="absolute top-3 right-3 text-2xl text-[var(--middleground1)] hover:text-[var(--foreground2)] focus:outline-none"
          onClick={onClose}
          aria-label="Close settings"
        >
          &times;
        </button>
        <h2 className="text-2xl mb-4 font-bold text-[var(--middleground1)]">
          Settings
        </h2>
        {/* Settings content here */}
        <div className="mb-6">
          <MidiSelector />
        </div>
        {/* Add more settings here later */}
      </div>
    </div>
  );
}
