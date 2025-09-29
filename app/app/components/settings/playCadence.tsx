import { SettingsContext } from "@/app/provider/settingsProvider";
import { useContext } from "react";

export default function PlayCadence() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <div>
      <h2>Play Cadence : {settings.playCadence}</h2>
      <input
        onChange={(e) => {
          console.log(settings.playCadence);
          updateSettings("playCadence", e.target.checked);
        }}
        type="checkbox"
        checked={settings.playCadence}
      />
    </div>
  );
}
