---
applyTo: 'app/components/learningApproachUI/'
---

This document explains how to add a mode-specific setting. Mode settings are settings that only apply when a particular learning mode is active (e.g., Chords, Melodies, or Notes). Each mode has its own folder with its own settings.

## Where mode settings live

- Folder: `app/components/learningApproachUI/[modeFolder]Settings/` (e.g., `chordSettings/`, `melodySettings/`, or `notesSettings/`)
- Rendered by: the `renderModeSettings()` branch in `app/components/learningApproachUI/learningApproach.tsx` when `settings.learningMode === LearningMode.[Mode]`.

## Steps

1. If needed, add the setting type & default to `app/constants/settings.tsx`.
2. **Add a description** to `app/constants/settingDescriptions.tsx` with a key, title, and description.
3. Create a component in the appropriate mode folder (e.g., `chordSettings/`, `melodySettings/`), e.g. `MyModeSetting.tsx`.
   - Use `const { settings, updateSettings } = useContext(SettingsContext)`.
   - **Wrap the component with `SettingDescriptionWrapper`** to display the description and info icon.
   - Call `updateSettings("settingKey", newValue)` to update the setting.
4. Import your component at the top of `learningApproach.tsx` and include it in the appropriate mode branch inside `renderModeSettings()`.

## Example pattern

```tsx
import { useContext } from "react";
import { SettingsContext } from "@/components/providers/settingsProvider";
import { SettingDescriptionWrapper } from "@/components/learningApproachUI/settingDescriptionWrapper";
import { getSettingDescription } from "@/constants/settingDescriptions";

export default function MyModeSetting() {
  const { settings, updateSettings } = useContext(SettingsContext);

  return (
    <SettingDescriptionWrapper
      settingKey="MY_MODE_SETTING"
      description={getSettingDescription("MY_MODE_SETTING")}
    >
      <div>
        <h2>My Mode Setting</h2>
        <input
          type="number"
          min={1}
          value={settings.myModeSetting}
          onChange={(e) =>
            updateSettings("myModeSetting", Number(e.target.value) || 1)
          }
        />
      </div>
    </SettingDescriptionWrapper>
  );
}
```

## Notes

- Mode-specific settings should not be added to the general settings panel — they are only relevant when the mode is active.
- Keep component naming PascalCase and consistent with existing files.
- For styling, use CSS variables from `app/globals.css` for consistency:
  - `backgroundColor: "var(--primary)"` with `color: "var(--primary-foreground)"` for high-contrast elements
  - `backgroundColor: "var(--background2)"` for secondary backgrounds
  - `color: "var(--foreground)"` for text
  - These variables adapt to the app's color scheme automatically
