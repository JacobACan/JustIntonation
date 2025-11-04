import React, { useEffect } from "react";
import { useMIDIInputs } from "@react-midi/hooks";

import type { Input } from "@react-midi/hooks/dist/types";

interface MidiSelectorProps {
  onDeviceChange?: (device: Input | undefined) => void;
}

export const MidiSelector = ({ onDeviceChange }: MidiSelectorProps) => {
  const { input, inputs, selectInput, selectedInputId } = useMIDIInputs();

  useEffect(() => {
    if (onDeviceChange) onDeviceChange(input);
  }, [input, onDeviceChange]);

  return (
    <div className="flex flex-col">
      <label htmlFor="midi-device" className="">
        MIDI Device
      </label>
      <select
        id="midi-device"
        value={selectedInputId || ""}
        onChange={(e) => selectInput(e.target.value)}
        className=""
      >
        <option value="">Select a device...</option>
        {inputs.map((input) => (
          <option key={input.id} value={input.id}>
            {input.name}
          </option>
        ))}
      </select>
    </div>
  );
};
