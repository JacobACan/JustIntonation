"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ValueOf } from "next/dist/shared/lib/constants";
import { ScalesQuizMachineContext } from "./scalesQuizProvider";
import { ScalesQuizEvent } from "@/machines/scalesQuizProcess";
import {
  defaultScalesQuizSettings,
  ScalesQuizSettings,
} from "@/constants/scalesQuizSettings";

interface ScalesQuizSettingsContextType {
  settings: ScalesQuizSettings;
  updateSettings: (
    key: keyof ScalesQuizSettings,
    value: ValueOf<ScalesQuizSettings>,
  ) => void;
}

export const ScalesQuizSettingsContext = createContext({
  settings: defaultScalesQuizSettings,
  updateSettings: () => {},
} as ScalesQuizSettingsContextType);

const STORAGE_KEY = "scalesQuizSettings";

export default function ScalesQuizSettingsProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, setSettings] = useState(defaultScalesQuizSettings);
  const scalesQuiz = useContext(ScalesQuizMachineContext);
  if (!scalesQuiz) return;

  const getLocalSettings = (): ScalesQuizSettings => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        return { ...settings, ...JSON.parse(savedSettings) };
      }
    }
    return settings;
  };

  const updateSettings = <
    K extends keyof ScalesQuizSettings = keyof ScalesQuizSettings,
  >(
    key: K,
    value: ScalesQuizSettings[K],
  ) => {
    const newSettings = getLocalSettings();
    const updatedSettings = { ...newSettings, [key]: value };

    scalesQuiz.send({
      type: ScalesQuizEvent.UPDATE_SETTING,
      settings: updatedSettings,
    });
    setSettings(updatedSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSettings));
  };

  useEffect(() => {
    const initialSettings = getLocalSettings();
    setSettings(initialSettings);
    scalesQuiz.send({
      type: ScalesQuizEvent.UPDATE_SETTING,
      settings: initialSettings,
    });
  }, []);

  const value = { settings, updateSettings };

  return (
    <ScalesQuizSettingsContext value={value}>{children}</ScalesQuizSettingsContext>
  );
}
