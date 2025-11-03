import { useContext } from "react";
import { SettingsContext } from "../providers/settingsProvider";

export default function MelodyLengthSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);

  return (
    <>
      Melody Length {settings.melodyLength}
      <input
        type="range"
        min={2}
        max={10}
        value={settings.melodyLength}
        onChange={(e) => updateSettings("melodyLength", e.target.valueAsNumber)}
      ></input>
    </>
  );
}
