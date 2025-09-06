"use client";
import { useContext } from "react";
import Chords from "./chords/chords";
import Notes from "./notes/notes";
import { LearningMode, SettingsContext } from "../provider/settingsProvider";

export default function Learn() {
  const { settings } = useContext(SettingsContext);

  const renderComponent = () => {
    switch (settings.learningMode) {
      case LearningMode.Notes:
        return <Notes />;
      case LearningMode.Chords:
        return <Chords />;
      default:
        return <Notes />;
    }
  };

  return <>{renderComponent()}</>;
}
