"use client";

import { useContext } from "react";
import Piano from "@/components/learn/piano";
import { ScalesQuizSettingsContext } from "@/components/providers/scalesQuizSettingsProvider";
import { noteWeightsForScale } from "@/lib/key";
import { Scale } from "@/constants/scale";
import { Key } from "@/constants/keys";
import { Note, midiToNote } from "@/constants/notes";
import { noteToMidi } from "@/constants/midi";

// For each key, compute a 1.5 octave display range starting from the root in octave 4
const getShapeRange = (key: Key): [Note, Note] => {
  // Map key to its root note in octave 4
  const keyRoots: { [k in Key]: Note } = {
    [Key.C]: Note.C4,
    [Key.Db]: Note.Db4,
    [Key.D]: Note.D4,
    [Key.Eb]: Note.Eb4,
    [Key.E]: Note.E4,
    [Key.F]: Note.F4,
    [Key.Gb]: Note.Gb4,
    [Key.G]: Note.G4,
    [Key.Ab]: Note.Ab4,
    [Key.A]: Note.A4,
    [Key.Bb]: Note.Bb4,
    [Key.B]: Note.B4,
  };

  const rootMidi = noteToMidi[keyRoots[key]];
  // 1.5 octaves = 18 semitones
  const endMidi = rootMidi + 18;
  return [midiToNote[rootMidi], midiToNote[endMidi]];
};

const ALL_KEYS: Key[] = [
  Key.C, Key.Db, Key.D, Key.Eb, Key.E, Key.F,
  Key.Gb, Key.G, Key.Ab, Key.A, Key.Bb, Key.B,
];

function ShapePiano({ keyName, selected, onToggle }: {
  keyName: Key;
  selected: boolean;
  onToggle: () => void;
}) {
  const range = getShapeRange(keyName);
  const allWeights = noteWeightsForScale(keyName, Scale.major);
  const scaleNotes = new Set(
    allWeights.filter((nw) => nw.weight > 0).map((nw) => nw.note),
  );

  const isBlackKey = (note: Note): boolean => {
    const midi = noteToMidi[note];
    return [1, 3, 6, 8, 10].includes(midi % 12);
  };

  const getFill = (note: Note): string => {
    const black = isBlackKey(note);
    if (scaleNotes.has(note)) {
      return black ? "#6366f1" : "#818cf8";
    }
    return black ? "var(--piano-black)" : "var(--piano-white)";
  };

  return (
    <button
      onClick={onToggle}
      className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-all ${
        selected
          ? "ring-2 ring-[#818cf8] bg-[rgba(129,140,248,0.15)]"
          : "opacity-50 hover:opacity-75"
      }`}
      style={{ cursor: "pointer", background: selected ? "rgba(129,140,248,0.15)" : "transparent", border: "none" }}
    >
      <Piano
        displayRange={range}
        getFill={(note) => getFill(note)}
        width={120}
      />
      <span className="text-xs font-bold">{keyName} Major</span>
    </button>
  );
}

export default function ShapeSelector() {
  const { settings, updateSettings } = useContext(ScalesQuizSettingsContext);

  const toggleKey = (key: Key) => {
    const current = settings.questionKeys;
    if (current.includes(key)) {
      if (current.length <= 1) return;
      updateSettings("questionKeys", current.filter((k) => k !== key));
    } else {
      updateSettings("questionKeys", [...current, key]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-sm font-bold">Selected Shapes</h3>
      <div className="grid grid-cols-4 gap-2">
        {ALL_KEYS.map((key) => (
          <ShapePiano
            key={key}
            keyName={key}
            selected={settings.questionKeys.includes(key)}
            onToggle={() => toggleKey(key)}
          />
        ))}
      </div>
    </div>
  );
}
