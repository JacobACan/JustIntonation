import { SettingsContext } from "@/app/provider/settingsProvider";
import { useContext } from "react";

export default function ShowQuestionNotesSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <div>
      <h2>Show Question Notes : {settings.showQuestionNotes}</h2>
      <input
        onChange={(e) => {
          updateSettings("showQuestionNotes", e.target.checked);
        }}
        type="checkbox"
        checked={settings.showQuestionNotes}
      />
    </div>
  );
}
