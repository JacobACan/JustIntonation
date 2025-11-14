import { SettingsContext } from "@/components/providers/settingsProvider";
import { useContext } from "react";
import { SettingDescriptionWrapper } from "../settingDescriptionWrapper";
import { settingDescriptions } from "@/constants/settingDescriptions";

export default function PianoSoundMuteSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);
  const description = settingDescriptions.PIANO_SOUND_MUTED;

  return (
    <SettingDescriptionWrapper
      title={description.title}
      description={description.description}
    >
      <div>
        <h2>Mute Piano Sound</h2>
        <button
          onClick={() => {
            updateSettings("pianoSoundMuted", !settings.pianoSoundMuted);
          }}
          className={`rounded-sm border-2 px-4 py-2 transition-colors ${
            settings.pianoSoundMuted
              ? "bg-chart-2/50 border-chart-2 text-chart-2"
              : "bg-primary/20 border-primary text-primary hover:bg-primary/30"
          }`}
        >
          {settings.pianoSoundMuted ? "Muted" : "Unmuted"}
        </button>
      </div>
    </SettingDescriptionWrapper>
  );
}
