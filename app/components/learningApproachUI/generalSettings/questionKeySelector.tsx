import { Key } from "@/constants/keys";
import { SettingsContext } from "@/components/providers/settingsProvider";
import { useContext } from "react";
import { SettingDescriptionWrapper } from "../settingDescriptionWrapper";
import { settingDescriptions } from "@/constants/settingDescriptions";

export default function QuestionKeySelector() {
  const { settings, updateSettings } = useContext(SettingsContext);
  const description = settingDescriptions.QUESTION_KEY_SELECTOR;

  const handleAddKey = (key: Key) => {
    if (!settings.questionKeys.includes(key)) {
      const newKeys = [...settings.questionKeys, key];
      updateSettings("questionKeys", newKeys);
      // Recalculate note weights using the first key and first scale
    }
  };

  const handleRemoveKey = (key: Key) => {
    const newKeys = settings.questionKeys.filter((k) => k !== key);
    // Ensure at least one key remains
    if (newKeys.length === 0) return;
    updateSettings("questionKeys", newKeys);
  };

  return (
    <SettingDescriptionWrapper
      title={description.title}
      description={description.description}
    >
      <div>
        <h2>Key Centers</h2>
        <div style={{ marginBottom: "10px" }}>
          <strong>Selected Key Centers:</strong>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {settings.questionKeys.map((key) => (
              <span
                key={key}
                style={{
                  padding: "5px 10px",
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {key.toString()}
                <button
                  onClick={() => handleRemoveKey(key)}
                  style={{ cursor: "pointer", padding: "0 5px" }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleAddKey(e.target.value as Key);
              e.target.value = "";
            }
          }}
          value=""
        >
          <option value="">Add a key...</option>
          {Object.values(Key).map((key) => (
            <option
              key={key}
              value={key}
              disabled={settings.questionKeys.includes(key)}
            >
              {key.toString()}
            </option>
          ))}
        </select>
      </div>
    </SettingDescriptionWrapper>
  );
}
