This document explains how to add a chord-mode setting (applies only when LearningMode.Chords).

Where chord settings live

- Folder: `app/components/learningApproachUI/chordSettings/`
- Rendered by: the `renderModeSettings()` branch in `app/components/learningApproachUI/learningApproach.tsx` when `settings.learningMode === LearningMode.Chords`.

Steps

1. If needed, add the setting type & default to `app/constants/settings.tsx`.
2. **Add a description** to `app/constants/settingDescriptions.tsx` with a key, title, and description.
3. Create a component in this folder, e.g. `ChordSizeSelector.tsx`.
   - Use `const { settings, updateSettings } = useContext(SettingsContext)`.
   - **Wrap the component with `SettingDescriptionWrapper`** to display the description and info icon.
   - Call `updateSettings("chordSize", newValue)` to update.
4. The mode renderer in `learningApproach.tsx` already imports and renders `ChordSizeSelector` — if you add a new file, import it at the top of `learningApproach.tsx` and include it in the Chords branch inside `renderModeSettings()`.

Example pattern

```tsx
import { useContext } from "react";
import { SettingsContext } from "@/components/providers/settingsProvider";
import { SettingDescriptionWrapper } from "@/components/learningApproachUI/settingDescriptionWrapper";
import { getSettingDescription } from "@/constants/settingDescriptions";

export default function MyChordSetting() {
  const { settings, updateSettings } = useContext(SettingsContext);

  return (
    <SettingDescriptionWrapper
      settingKey="CHORD_SIZE_SELECTOR"
      description={getSettingDescription("CHORD_SIZE_SELECTOR")}
    >
      <div>
        <h2>Chord Size</h2>
        <input
          type="number"
          min={1}
          value={settings.chordSize}
          onChange={(e) =>
            updateSettings("chordSize", Number(e.target.value) || 1)
          }
        />
      </div>
    </SettingDescriptionWrapper>
  );
}
```

Notes

- Mode-specific settings should not be added to the general settings panel — they are only relevant when the mode is active.
- Keep component naming PascalCase and consistent with existing files.
- For styling, use CSS variables from `app/globals.css` for consistency:
  - `backgroundColor: "var(--primary)"` with `color: "var(--primary-foreground)"` for high-contrast elements
  - `backgroundColor: "var(--background2)"` for secondary backgrounds
  - `color: "var(--foreground)"` for text
  - These variables adapt to the app's color scheme automatically
