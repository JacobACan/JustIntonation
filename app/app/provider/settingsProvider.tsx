import { createContext, useState } from "react";
import { Note } from "../constants/notes";
import { ValueOf } from "next/dist/shared/lib/constants";
import { Key, NoteWeight, noteWeightsForScale, Scale } from "../constants/keys";

interface settings {
  questionRange: [Note, Note]; // The Range of notes that a musician is questioned on
  questionKey: Key; // The key that the questions are centered around
  questionScale: Scale; // The scale that the questions are centered around
  questionNoteWeights: NoteWeight[]; // The notes that the musician is questioned on.  If the weight is higher, the note is more likely to be chosen.
}

interface settingsContext {
  settings: settings;
  updateSettings: (key: keyof settings, value: ValueOf<settings>) => void;
}

export const SettingsContext = createContext({} as settingsContext);

export default function SettingsProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, setSettings] = useState({
    questionRange: [Note.C4, Note.C5],
    questionKey: Key.C,
    questionScale: Scale.major,
    questionNoteWeights: noteWeightsForScale(Key.C, Scale.major),
  } as settings);
  const updateSettings = (key: string, value: any) => {
    setSettings((prevSettings) => ({ ...prevSettings, [key]: value }));
  };
  const value = { settings, updateSettings };

  return <SettingsContext value={value}>{children}</SettingsContext>;
}
