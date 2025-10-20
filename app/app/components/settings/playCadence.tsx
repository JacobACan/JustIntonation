import { audioContext, cadenceGainNode } from "@/app/lib/webAudio";
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
      <h2>Cadence Volume</h2>
      <input
        type="range"
        min={0}
        max={1}
        value={settings.cadenceVolume}
        step={0.01}
        onChange={(e) => {
          updateSettings("cadenceVolume", e.target.valueAsNumber);
          cadenceGainNode.gain.setTargetAtTime(
            e.target.valueAsNumber,
            audioContext.currentTime,
            0.1
          );
        }}
      ></input>
    </div>
  );
}
