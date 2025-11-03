import React, { useContext } from "react";
import { MidiSelector } from "./midiSelector";
import QuestionNoteRangeSelector from "./questionRangeSelector";
import QuestionKeySelector from "./questionKeySelector";
import QuestionScaleSelector from "./questionScaleSelector";
import LearningModeSelector from "./learningModeSelector";
import { SettingsContext } from "@/components/providers/settingsProvider";
import ChordSizeSelector from "./chordSizeSelector";
import PlayCadence from "./playCadence";
import ShowQuestionNotesSelector from "./showQuestionNotesSelector copy";
import LearningUserEvent from "../learn/learningUserEvent";
import { MusicLearnerEvent } from "@/machines/musicLearningProcess";
import PlayIcon from "../icon/playIcon";
import { LearningMode } from "@/constants/settings";
import MelodyLengthSelector from "./melodyLengthSelector";

export default function Settings() {
  const { settings } = useContext(SettingsContext);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ">
      <div className="relative w-full max-w-md mx-auto bg-[var(--background2)] rounded-md  p-6 overflow-y-auto">
        <h2 className="text-2xl mb-4 font-bold">Learning Approach</h2>
        {/* Settings content here */}
        <div className="flex flex-col gap-4">
          <LearningUserEvent eventType={MusicLearnerEvent.START}>
            <PlayIcon />
          </LearningUserEvent>
          <MidiSelector />
          <LearningModeSelector />
          {settings.learningMode === LearningMode.Chords && (
            <ChordSizeSelector />
          )}
          {settings.learningMode === LearningMode.Melodies && (
            <MelodyLengthSelector />
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
