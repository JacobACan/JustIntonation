import React, { useContext, useState } from "react";
import QuestionNoteRangeSelector from "./questionRangeSelector";
import LearningModeSelector from "./learningModeSelector";
import { MidiSelector } from "./midiSelector";
import { SettingsContext } from "../providers/settingsProvider";
import { SettingsIcon } from "../icon/settingsIcon";
import clsx from "clsx";
import QuestionKeySelector from "./questionKeySelector";
import QuestionScaleSelector from "./questionScaleSelector";
import PlayCadence from "./playCadence";

export default function LearningApproach() {
  const { settings } = useContext(SettingsContext);
  const [showExtraSettings, setExtraSettings] = useState(false);

  const renderMainSettings = () => {
    return (
      <div className="h-lvh content-center justify-items-center text-center text-sm">
        <LearningModeSelector />
        <MidiSelector />
        <QuestionNoteRangeSelector />
      </div>
    );
  };

  const renderModeSettings = () => {
    return <>{settings.learningMode} Settings</>;
  };

  const renderGeneralSettings = () => {
    return (
      <>
        <h1>General Settings</h1>
        <section className="pointer-events-auto">
          <QuestionKeySelector />
          <QuestionScaleSelector />
          <PlayCadence />
        </section>
      </>
    );
  };

  return (
    <div className="overflow-hidden">
      <button
        className="absolute top-5 right-5 z-20"
        onClick={() => {
          showExtraSettings ? setExtraSettings(false) : setExtraSettings(true);
        }}
      >
        <SettingsIcon
          className={clsx(
            "hover:stroke-primary h-[35px] w-[35px] hover:cursor-pointer",
            {
              "stroke-primary fill-primary drop-shadow-primary drop-shadow-xs":
                showExtraSettings,
              "fill-primary": !showExtraSettings,
            },
          )}
        />
      </button>
      <section
        className={clsx(
          "pointer-events-none absolute left-0 h-[100vh] w-[30%] justify-items-center",
          { hidden: !showExtraSettings },
        )}
      >
        <div className="via-background to-background pointer-events-none absolute z-10 h-full w-full bg-gradient-to-l from-transparent via-10%"></div>
        <div className="absolute z-10 p-4">{renderGeneralSettings()}</div>
      </section>
      <section
        className={clsx(
          "pointer-events-none absolute right-0 h-[100vh] w-[30%] justify-items-center",
          { hidden: !showExtraSettings },
        )}
      >
        <div className="via-background to-background pointer-events-none absolute z-10 h-full w-full bg-gradient-to-r from-transparent via-10%"></div>
        <div className="absolute z-10 p-4">{renderModeSettings()}</div>
      </section>
      {renderMainSettings()}
    </div>
  );
}
