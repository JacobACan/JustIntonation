import React, { useContext } from "react";
import { MidiSelector } from "./midiSelector";
import QuestionNoteRangeSelector from "./questionRangeSelector";
import QuestionKeySelector from "./questionKeySelector";
import QuestionScaleSelector from "./questionScaleSelector";
import LearningModeSelector from "./learningModeSelector";
import {
  LearningMode,
  SettingsContext,
} from "@/components/providers/settingsProvider";
import ChordSizeSelector from "./chordSizeSelector";
import PlayCadence from "./playCadence";
import ShowQuestionNotesSelector from "./showQuestionNotesSelector copy";

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

export default function Settings({ open, onClose }: SettingsProps) {
  if (!open) return null;
  const { settings } = useContext(SettingsContext);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-auto bg-[var(--background2)] rounded-md shadow-lg p-6 overflow-y-auto">
        <button
          className="absolute top-3 right-3 text-2xl hover:text-[var(--foreground2)] focus:outline-none"
          onClick={onClose}
          aria-label="Close settings"
        >
          &times;
        </button>
        <h2 className="text-2xl mb-4 font-bold">Settings</h2>
        {/* Settings content here */}
        <div className="flex flex-col gap-4">
          <MidiSelector />
          <LearningModeSelector />
          {settings.learningMode === LearningMode.Chords && (
            <ChordSizeSelector />
          )}
          <QuestionNoteRangeSelector />
          <QuestionKeySelector />
          <QuestionScaleSelector />
          <ShowQuestionNotesSelector />
          <PlayCadence />
        </div>
      </div>
    </div>
  );
}
