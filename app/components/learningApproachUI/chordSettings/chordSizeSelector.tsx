import { SettingsContext } from "@/components/providers/settingsProvider";
import { Slider } from "@/components/ui/slider";
import { useContext } from "react";
import { SettingDescriptionWrapper } from "../settingDescriptionWrapper";
import { settingDescriptions } from "@/constants/settingDescriptions";

export default function ChordSizeSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);
  const description = settingDescriptions.CHORD_SIZE_SELECTOR;

  return (
    <SettingDescriptionWrapper
      title={description.title}
      description={description.description}
    >
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
    </SettingDescriptionWrapper>
  );
}
