import { SettingsContext } from "@/components/providers/settingsProvider";
import { Slider } from "@/components/ui/slider";
import { useContext } from "react";
import { SettingDescriptionWrapper } from "../settingDescriptionWrapper";
import { settingDescriptions } from "@/constants/settingDescriptions";

export default function MelodyLengthSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);
  const description = settingDescriptions.MELODY_LENGTH_SELECTOR;

  return (
    <SettingDescriptionWrapper
      title={description.title}
      description={description.description}
    >
      <>
        Melody Length {settings.melodyLength}
        <Slider
          min={2}
          max={10}
          defaultValue={[settings.melodyLength]}
          onValueChange={([val]) => updateSettings("melodyLength", val)}
        />
      </>
    </SettingDescriptionWrapper>
  );
}
