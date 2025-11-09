import React, { useContext } from "react";
import QuestionNoteRangeSelector from "./questionRangeSelector";
import LearningModeSelector from "./learningModeSelector";
import { MidiSelector } from "./midiSelector";
import { SettingsContext } from "../providers/settingsProvider";

export default function LearningApproach() {
  const { settings } = useContext(SettingsContext);

  const renderMainSettings = () => {
    return (
      <div className="h-lvh content-center justify-items-center text-center">
        <LearningModeSelector />
        <MidiSelector />
        <QuestionNoteRangeSelector />
      </div>
    );
  };

  return (
    <div className="overflow-hidden">
      <section className="pointer-events-none absolute left-0 h-[100vh] w-[30%] justify-items-center">
        <div className="via-background to-background pointer-events-none absolute z-10 h-full w-full bg-gradient-to-l from-transparent via-10%"></div>
        <div className="absolute z-10 p-4">General Settings</div>
      </section>
      <section className="pointer-events-none absolute right-0 h-[100vh] w-[30%] justify-items-center">
        <div className="via-background to-background pointer-events-none absolute z-10 h-full w-full bg-gradient-to-r from-transparent via-10%"></div>
        <div className="absolute z-10 p-4">
          {settings.learningMode} Settings
        </div>
      </section>
      {renderMainSettings()}
    </div>
  );
}
