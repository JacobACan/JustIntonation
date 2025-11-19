import { SettingsContext } from "@/components/providers/settingsProvider";
import { Slider } from "@/components/ui/slider";
import { useContext } from "react";

export default function TimeToAnswerQuestions() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <>
      <h1>
        Time To Answer Questions : {settings.timeToAnswerQuestion / 1000}s
      </h1>
      <Slider
        value={[settings.timeToAnswerQuestion]}
        min={500}
        max={10000}
        onValueChange={([val]) => {
          updateSettings("timeToAnswerQuestion", val);
        }}
      />
    </>
  );
}
