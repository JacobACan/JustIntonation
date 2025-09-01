

import React, { useEffect } from "react";
import { useMIDIInputs, useMIDINotes, MIDIProvider } from "@react-midi/hooks";

import type { MIDINote, Input } from "@react-midi/hooks/dist/types";

interface MidiSelectorProps {
	onDeviceChange?: (device: Input | undefined) => void;
	onNotesChange?: (notes: MIDINote[]) => void;
}

export const MidiSelector: React.FC<MidiSelectorProps> = ({ onDeviceChange, onNotesChange }) => {
	const { input, inputs, selectInput, selectedInputId } = useMIDIInputs();
	const notes = useMIDINotes(); // Optionally: useMIDINotes({ channel: 1 })

	useEffect(() => {
		if (onDeviceChange) onDeviceChange(input);
	}, [input, onDeviceChange]);

	useEffect(() => {
		if (onNotesChange) onNotesChange(notes);
	}, [notes]);

	return (
		<div style={{
			color: "var(--foreground2)",
			borderRadius: "1em",
			padding: "1em",
			fontFamily: "var(--font-sans, 'Patrick Hand', cursive)",
			maxWidth: 400,
			margin: "1em auto",
		}}>
			{/* label should be smaller and right above select dropdown */}
			<label htmlFor="midi-device" className=" block text-sm font-medium text-gray-900 dark:text-white">
				MIDI Device:
			</label>
			<select
				id="midi-device"
				value={selectedInputId || ""}
				onChange={e => selectInput(e.target.value)}
				style={{
					width: "100%",
					padding: "0.5em",
					borderRadius: "0.5em",
					border: "1.5px solid var(--middleground1)",
					fontFamily: "inherit",
					background: "var(--background2)",
					color: "var(--foreground2)",
					marginBottom: 16,
				}}
			>
				<option value="">Select a device...</option>
				{inputs.map((input) => (
					<option key={input.id} value={input.id}>{input.name}</option>
				))}
			</select>
		</div>
	);
};
