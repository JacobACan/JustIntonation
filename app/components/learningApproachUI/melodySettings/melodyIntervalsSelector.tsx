import { SettingsContext } from "@/components/providers/settingsProvider";
import { Interval } from "@/constants/intervals";
import { useContext } from "react";
import { SettingDescriptionWrapper } from "../settingDescriptionWrapper";
import { Slider } from "@/components/ui/slider";

export default function MelodyIntervalsSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <>
      <SettingDescriptionWrapper
        title="Maximum Interval"
        description="Set the maximum interval for the generated melodies."
      >
        <h1>Maximum Interval</h1>
        <Slider
          defaultValue={[settings.melodyIntervalMax]}
          min={settings.melodyIntervalMin}
          max={Interval.OCTAVE}
          onValueChange={([val]) => {
            updateSettings("melodyIntervalMax", val);
          }}
        />
      </SettingDescriptionWrapper>
      <SettingDescriptionWrapper
        title="Minimum Interval"
        description="Set the minimum interval for the generated melodies."
      >
        <h1>Minimum Interval</h1>
        <Slider
          defaultValue={[settings.melodyIntervalMin]}
          min={Interval.UNISON}
          max={settings.melodyIntervalMax}
          onValueChange={([val]) => {
            updateSettings("melodyIntervalMin", val);
          }}
        />
      </SettingDescriptionWrapper>
    </>
  );
}
