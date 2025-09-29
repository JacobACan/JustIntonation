import { createContext, useState } from "react";
import { Note } from "../constants/notes";
import { ValueOf } from "next/dist/shared/lib/constants";
import { Key, NoteWeight } from "../constants/keys";
import { Scale } from "../constants/scale";
import { noteWeightsForScale } from "../lib/key";

export enum LearningMode {
  Notes = "Notes",
  Chords = "Chords",
}

export interface Settings {
  questionRange: [Note, Note]; // The Range of notes that a musician is questioned on
  questionKey: Key; // The key that the questions are centered around
  questionScale: Scale; // The scale that the questions are centered around
  questionNoteWeights: NoteWeight[]; // The notes that the musician is questioned on.  If the weight is higher, the note is more likely to be chosen.
  questionsInARow: number; // The number of questions answered correctly in a row to move on
  learningMode: LearningMode;
  chordSize: number; // If in chord mode, the size of the chords to be played
  showQuestionNotes: boolean;
  playCadence: boolean;
}

interface settingsContext {
  settings: Settings;
  updateSettings: (key: keyof Settings, value: ValueOf<Settings>) => void;
}

const defaultSettings: Settings = {
  questionRange: [Note.C4, Note.C5],
  questionKey: Key.C,
  questionScale: Scale.major,
  questionNoteWeights: noteWeightsForScale(Key.C, Scale.major),
  questionsInARow: 30,
  learningMode: LearningMode.Notes,
  chordSize: 2,
  showQuestionNotes: true,
  playCadence: true,
};

export const SettingsContext = createContext({
  settings: defaultSettings,
  updateSettings: () => {},
} as settingsContext);

export default function SettingsProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, setSettings] = useState(defaultSettings as Settings);
  const updateSettings = (key: string, value: any) => {
    setSettings((prevSettings) => ({ ...prevSettings, [key]: value }));
  };
  const chooseRandomKeyAndScale = () => {
    const randomKey =
      Object.values(Key)[Math.floor(Math.random() * Object.values(Key).length)];
    const randomScale =
      Object.values(Scale)[
        Math.floor(Math.random() * Object.values(Scale).length)
      ];
    const newNoteWeights = noteWeightsForScale(randomKey, randomScale);
    console.log("New key: ", randomKey, " New scale: ", randomScale);
    updateSettings("questionKey", randomKey);
    updateSettings("questionScale", randomScale);
    updateSettings("questionNoteWeights", newNoteWeights);
  };
  const value = { settings, updateSettings };

  return <SettingsContext value={value}>{children}</SettingsContext>;
}
