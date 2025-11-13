import { useContext } from "react";
import { SettingsContext } from "@/components/providers/settingsProvider";

export default function NumberOfQuestions() {
  const { settings, updateSettings } = useContext(SettingsContext);

  const value = settings.numberOfQuestions ?? 5;

  return (
    <div>
      <h2>Number of Questions</h2>
      <input
        type="number"
        min={1}
        step={1}
        value={value}
        onChange={(e) => {
          const v = Math.max(1, Number(e.target.value) || 1);
          updateSettings("numberOfQuestions", v);
        }}
        style={{ width: 80 }}
      />
    </div>
  );
}
