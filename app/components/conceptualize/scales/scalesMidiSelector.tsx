"use client";

import { useEffect, useState } from "react";
import { useMIDIInputs, useMIDINotes } from "@react-midi/hooks";
import Piano from "@/components/learn/piano";
import { midiToNote } from "@/constants/notes";

const STORAGE_KEY = "scalesQuizMidiDevice";

export default function ScalesMidiSelector() {
  const { inputs, selectInput, input } = useMIDIInputs();
  const notes = useMIDINotes();
  const [verified, setVerified] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // On mount, restore previously saved device
  useEffect(() => {
    if (initialized || inputs.length === 0) return;

    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) {
      const savedDevice = inputs.find((i) => i.id === savedId);
      if (savedDevice) {
        selectInput(savedDevice.id);
        setVerified(true);
      }
    }
    setInitialized(true);
  }, [inputs]);

  // When notes are played, mark device as verified and save it
  useEffect(() => {
    if (notes.length > 0 && input) {
      setVerified(true);
      localStorage.setItem(STORAGE_KEY, input.id);
    }
  }, [notes]);

  const handleSelectDevice = (deviceId: string) => {
    selectInput(deviceId);
    setVerified(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <h3 className="text-sm font-bold">MIDI Device</h3>
      {inputs.length === 0 ? (
        <p className="text-xs text-[var(--middleground1)]">
          No MIDI devices detected
        </p>
      ) : (
        <>
          <select
            value={input?.id || ""}
            onChange={(e) => handleSelectDevice(e.target.value)}
            className="text-xs"
          >
            <option value="">Select a device...</option>
            {inputs.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </select>
          {input && !verified && (
            <p className="text-xs text-[#f87171]">
              Play a note to verify
            </p>
          )}
          {input && verified && (
            <p className="text-xs text-[#4ade80]">Connected</p>
          )}
          {notes.length > 0 && (
            <Piano
              notesDown1={notes.map((n) => midiToNote[n.note])}
              width={200}
            />
          )}
        </>
      )}
    </div>
  );
}
