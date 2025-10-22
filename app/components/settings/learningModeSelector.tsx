import {
  LearningMode,
  SettingsContext,
} from "@/components/providers/settingsProvider";
import { useContext } from "react";

export default function LearningModeSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <div>
      <h2>Learning Mode</h2>
      <select
        onChange={(e) => {
          console.log(e.target.value);
          updateSettings("learningMode", e.target.value as LearningMode);
        }}
        value={settings.learningMode}
      >
        {Object.keys(LearningMode).map((mode) => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </select>
    </div>
  );
}
