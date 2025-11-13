import { Scale } from "@/constants/scale";
import { noteWeightsForScale } from "@/lib/key";
import { SettingsContext } from "@/components/providers/settingsProvider";
import { useContext } from "react";

export default function QuestionScaleSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);

  const handleAddScale = (scale: Scale) => {
    if (!settings.questionScales.includes(scale)) {
      const newScales = [...settings.questionScales, scale];
      updateSettings("questionScales", newScales);
      // Recalculate note weights using the first key and first scale
    }
  };

  const handleRemoveScale = (scale: Scale) => {
    const newScales = settings.questionScales.filter((s) => s !== scale);
    // Ensure at least one scale remains
    if (newScales.length === 0) return;
    updateSettings("questionScales", newScales);
  };

  return (
    <div>
      <h2>Scales</h2>
      <div style={{ marginBottom: "10px" }}>
        <strong>Selected Scales:</strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {settings.questionScales.map((scale) => (
            <span
              key={scale}
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
              {scale}
              <button
                onClick={() => handleRemoveScale(scale)}
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
            handleAddScale(e.target.value as Scale);
            e.target.value = "";
          }
        }}
        value=""
      >
        <option value="">Add a scale...</option>
        {Object.values(Scale).map((scale) => (
          <option
            key={scale}
            value={scale}
            disabled={settings.questionScales.includes(scale)}
          >
            {scale}
          </option>
        ))}
      </select>
    </div>
  );
}
