import { useContext } from "react";
import { SettingsContext } from "@/components/providers/settingsProvider";

export default function NumberOfQuestions() {
  const { settings, updateSettings } = useContext(SettingsContext);

  const value = settings.numberOfQuestions ?? 5;

  return (
    <div className="w-full">
      <h2>Number of Questions / Session</h2>
      <input
        className="border-primary rounded-sm border-2 p-1"
        name="Number of Questions Per Session"
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
