import { Key, noteWeightsForScale, Scale } from "@/app/constants/keys";
import { Note } from "@/app/constants/notes";
import { SettingsContext } from "@/app/provider/settingsProvider";
import { useContext } from "react";

export default function QuestionKeySelector() {
  const { settings, updateSettings } = useContext(SettingsContext);

  return (
    <div>
      <h2>Key</h2>
      <select
        onChange={(e) => {
          updateSettings("questionKey", e.target.value as Key);
          updateSettings(
            "questionNoteWeights",
            noteWeightsForScale(e.target.value as Key, settings.questionScale)
          );
        }}
        value={settings.questionKey}
      >
        {Object.values(Key).map((key) => (
          <option key={key} value={key}>
            {key.toString()}
          </option>
        ))}
      </select>
    </div>
  );
}
