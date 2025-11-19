import { SettingsContext } from "@/components/providers/settingsProvider";
import { Slider } from "@/components/ui/slider";
import { SkipReview } from "@/constants/settings";
import { useContext } from "react";

export default function SkipReviewOn() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <>
      <h1>Skip Review On</h1>
      <select
        className="bg-primary rounded-sm p-1 text-black"
        value={settings.skipReviewOn}
        onChange={(e) => {
          updateSettings("skipReviewOn", e.target.value as SkipReview);
        }}
      >
        <option value={SkipReview.Correct}>{SkipReview.Correct}</option>
        <option value={SkipReview.Both}>{SkipReview.Both}</option>
        <option value={SkipReview.None}>{SkipReview.None}</option>
      </select>
    </>
  );
}
