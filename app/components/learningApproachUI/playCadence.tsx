import { audioContext, cadenceGainNode } from "@/lib/webAudio";
import { SettingsContext } from "@/components/providers/settingsProvider";
import { useContext } from "react";

export default function PlayCadence() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <div>
      <h2>Cadence Volume</h2>
      <input
        type="range"
        min={0}
        max={1}
        value={settings.cadenceVolume}
        step={0.01}
        onChange={(e) => {
          if (e.target.valueAsNumber == 0) {
            updateSettings("playCadence", false);
            updateSettings("cadenceVolume", e.target.valueAsNumber);
            cadenceGainNode.gain.setTargetAtTime(
              e.target.valueAsNumber,
              audioContext.currentTime,
              0.1,
            );
          } else {
            updateSettings("playCadence", true);
            updateSettings("cadenceVolume", e.target.valueAsNumber);
            cadenceGainNode.gain.setTargetAtTime(
              e.target.valueAsNumber,
              audioContext.currentTime,
              0.1,
            );
          }
        }}
      ></input>
    </div>
  );
}
