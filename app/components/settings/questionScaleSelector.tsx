import { Scale } from "@/constants/scale";
import { noteWeightsForScale } from "@/lib/key";
import { SettingsContext } from "@/components/providers/settingsProvider";
import { useContext } from "react";

export default function QuestionScaleSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);

  return (
    <div>
      <h2>Scale</h2>
      <select
        value={settings.questionScale}
        onChange={(e) => {
          updateSettings("questionScale", e.target.value as Scale);
          updateSettings(
            "questionNoteWeights",
            noteWeightsForScale(settings.questionKey, e.target.value as Scale)
          );
        }}
      >
        {Object.values(Scale).map((scale) => (
          <option key={scale} value={scale}>
            {scale}
          </option>
        ))}
      </select>
    </div>
  );
}
