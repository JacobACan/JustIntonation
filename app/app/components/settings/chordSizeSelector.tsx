import { SettingsContext } from "@/app/provider/settingsProvider";
import { useContext } from "react";

export default function ChordSizeSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <div>
      <h2>Chord Size : {settings.chordSize}</h2>
      <input
        onChange={(e) => {
          updateSettings("chordSize", e.target.value as unknown as number);
        }}
        type="range"
        name="bottom note"
        min={2}
        max={5}
        value={settings.chordSize}
      />
    </div>
  );
}
