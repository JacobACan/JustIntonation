import { SettingsContext } from "@/components/providers/settingsProvider";
import { Slider } from "@/components/ui/slider";
import { useContext } from "react";

export default function ChordSizeSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <div className="grid">
      <h2>Chord Size : {settings.chordSize}</h2>
      <Slider
        onValueChange={([val]) => {
          updateSettings("chordSize", val);
        }}
        min={2}
        max={5}
        defaultValue={[settings.chordSize]}
      />
    </div>
  );
}
