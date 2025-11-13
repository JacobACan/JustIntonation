import { SettingsContext } from "@/components/providers/settingsProvider";
import { Slider } from "@/components/ui/slider";
import { useContext } from "react";

export default function MelodyLengthSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);

  return (
    <>
      Melody Length {settings.melodyLength}
      <Slider
        min={2}
        max={10}
        defaultValue={[settings.melodyLength]}
        onValueChange={([val]) => updateSettings("melodyLength", val)}
      />
    </>
  );
}
