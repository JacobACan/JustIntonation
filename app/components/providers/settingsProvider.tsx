import { createContext, useContext, useState } from "react";
import { ValueOf } from "next/dist/shared/lib/constants";
import { Key } from "../../constants/keys";
import { Scale } from "../../constants/scale";
import { noteWeightsForScale } from "../../lib/key";
import { MusicLearnerContext } from "./learningStateMachineProvider";
import { MusicLearnerEvent } from "@/machines/musicLearningProcess";
import { defaultSettings, Settings } from "@/constants/settings";

interface settingsContext {
  settings: Settings;
  updateSettings: (key: keyof Settings, value: ValueOf<Settings>) => void;
}

export const SettingsContext = createContext({
  settings: defaultSettings,
  updateSettings: () => {},
} as settingsContext);

export default function SettingsProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, setSettings] = useState(defaultSettings as Settings);
  const musicLearner = useContext(MusicLearnerContext);
  if (!musicLearner) return;

  const updateSettings = <K extends keyof Settings = keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    musicLearner.send({
      type: MusicLearnerEvent.UPDATE_SETTING,
      key: key,
      value: value,
    });
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
    updateSettings("questionKeys", [randomKey]);
    updateSettings("questionScales", [randomScale]);
  };
  const value = { settings, updateSettings };

  return <SettingsContext value={value}>{children}</SettingsContext>;
}
