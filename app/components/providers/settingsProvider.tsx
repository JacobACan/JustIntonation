import { createContext, useContext, useEffect, useState } from "react";
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
  const [settings, setSettings] = useState(defaultSettings);
  const musicLearner = useContext(MusicLearnerContext);
  if (!musicLearner) return;

  const getLocalSettings = (): Settings => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("musicLearnerSettings");
      if (savedSettings) {
        return { ...settings, ...JSON.parse(savedSettings) };
      }
    }
    return settings;
  };

  const updateSettings = <K extends keyof Settings = keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    const newSettings = getLocalSettings();
    const updatedSettings = { ...newSettings, [key]: value };

    musicLearner.send({
      type: MusicLearnerEvent.UPDATE_SETTING,
      settings: updatedSettings,
    });
    setSettings(updatedSettings);
    localStorage.setItem(
      "musicLearnerSettings",
      JSON.stringify(updatedSettings),
    );
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

  useEffect(() => {
    const initialSettings = getLocalSettings();
    setSettings(initialSettings);
  }, []);

  const value = { settings, updateSettings };

  return <SettingsContext value={value}>{children}</SettingsContext>;
}
