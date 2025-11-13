import { audioContext, cadenceGainNode } from "@/lib/webAudio";
import { SettingsContext } from "@/components/providers/settingsProvider";
import { useContext } from "react";
import { Slider } from "@/components/ui/slider";

export default function PlayCadence() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <div>
      <h2>Cadence Volume</h2>
      <Slider
        min={0}
        max={1}
        defaultValue={[settings.cadenceVolume]}
        step={0.01}
        onValueChange={([val]) => {
          if (val == 0) {
            updateSettings("playCadence", false);
            updateSettings("cadenceVolume", val);
            cadenceGainNode.gain.setTargetAtTime(
              val,
              audioContext.currentTime,
              0.1,
            );
          } else {
            updateSettings("playCadence", true);
            updateSettings("cadenceVolume", val);
            cadenceGainNode.gain.setTargetAtTime(
              val,
              audioContext.currentTime,
              0.1,
            );
          }
        }}
      ></Slider>
    </div>
  );
}
