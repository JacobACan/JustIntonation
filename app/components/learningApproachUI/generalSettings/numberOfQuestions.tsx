import { useContext } from "react";
import { SettingsContext } from "@/components/providers/settingsProvider";
import { SettingDescriptionWrapper } from "../settingDescriptionWrapper";
import { settingDescriptions } from "@/constants/settingDescriptions";

export default function NumberOfQuestions() {
  const { settings, updateSettings } = useContext(SettingsContext);

  const value = settings.numberOfQuestions ?? 5;
  // Note: numberOfQuestions doesn't have a description in settingDescriptions yet
  // Using a generic title and description for now
  const title = "Number of Questions";
  const description = "Set the number of questions per session";

  return (
    <SettingDescriptionWrapper title={title} description={description}>
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
    </SettingDescriptionWrapper>
  );
}
