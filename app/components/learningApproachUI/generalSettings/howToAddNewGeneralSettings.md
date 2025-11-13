This document explains how to add a new "General" setting to the Learning Approach UI.

Overview — quick steps

1. Add the new setting key and type to `app/constants/settings.tsx` (if it doesn't already exist) and add a sensible default to `defaultSettings`.
2. Create a small UI component in `app/components/learningApproachUI/generalSettings/` that reads from `SettingsContext` and calls `updateSettings(key, value)` when the value changes.
3. Import and add your component to `renderGeneralSettings()` inside `app/components/learningApproachUI/learningApproach.tsx` so it appears in the General Settings panel.
4. Test in the app; other parts of the app that read from `settings` (machines, pages) will automatically get the updated value.

Key locations

- Settings types & defaults: `app/constants/settings.tsx` — this file declares the `Settings` interface and `defaultSettings` object. If you add a new setting, add its type to `Settings` and a default in `defaultSettings`.
- Settings provider/context: `app/components/providers/settingsProvider.tsx` — exposes `SettingsContext` with shape { settings, updateSettings } where `updateSettings` is called as `updateSettings(key, value)`.
- Where to render: `app/components/learningApproachUI/learningApproach.tsx` — `renderGeneralSettings()` contains the `Settings` wrapper where general setting components should be placed.

Component contract (2–3 bullets)

- Input: reads the current value from `settings` via `const { settings, updateSettings } = useContext(SettingsContext)`.
- Output: calls `updateSettings(key, newValue)` to mutate the settings in the provider (and notify the state machine).
- Error modes: validate input before calling update (e.g., enforce numbers >= 1) and avoid calling with undefined.

Example (pattern)

1. Ensure the setting exists in `app/constants/settings.tsx`:

```ts
// add to Settings interface
	myNewSetting: number; // example

// in defaultSettings
	myNewSetting: 10,
```

2. Create `app/components/learningApproachUI/generalSettings/MyNewSetting.tsx` (simple numeric example):

```tsx
import { useContext } from "react";
import { SettingsContext } from "@/components/providers/settingsProvider";

export default function MyNewSetting() {
  const { settings, updateSettings } = useContext(SettingsContext);
  const value = settings.myNewSetting;

  return (
    <div>
      <h2>My New Setting</h2>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) =>
          updateSettings(
            "myNewSetting",
            Math.max(1, Number(e.target.value) || 1),
          )
        }
      />
    </div>
  );
}
```

3. Import and add it to the general settings panel (`learningApproach.tsx`):

```tsx
import MyNewSetting from "./generalSettings/MyNewSetting";

// inside renderGeneralSettings()
<Settings>
  <QuestionKeySelector />
  <QuestionScaleSelector />
  <PlayCadence />
  <MyNewSetting />
</Settings>;
```

Notes and gotchas

- The `SettingsContext.updateSettings` function takes a single key (as `keyof Settings`) and the new value. Do not pass an object; call it like `updateSettings("numberOfQuestions", 7)`.
- File naming: most components in this repo use PascalCase component names, but the existing file you add may follow the repository convention. If you prefer consistent casing, use `MyNewSetting.tsx` and `MyNewSetting` as the component name.
- Styling: the repo uses shadcn components in some places — the native input above is fine as a starting point; replace it with the shadcn input when you want to match UI styles. For consistent styling with the app theme, use CSS variables from `app/globals.css`:
  - Use `backgroundColor: "var(--primary)"` with `color: "var(--primary-foreground)"` for high-contrast badges/tags
  - Use `backgroundColor: "var(--background2)"` for secondary backgrounds
  - Use `color: "var(--foreground)"` for text
  - These variables automatically adapt to the app's color scheme (`#deb887` primary, `#000000` background, etc.)
- Mode-specific settings: some settings are rendered in the mode panel (see `renderModeSettings()` in `learningApproach.tsx`). If your setting applies only when a LearningMode is active (e.g., chord size or melody length), add it to the appropriate mode-specific folder and follow the chord/melody docs instead of this general guide.

Testing

- Run the dev server (`pnpm dev`) and open the app. Click the settings icon (top-right) to open the side panel and confirm the new setting is visible and updates the value.
- Search the codebase for the setting key to ensure other consumers (machines/pages) use the same name.

If you'd like, I can:

- Rename your component to PascalCase for consistency.
- Convert the example to use your project's shadcn controls.
- Add a small test that verifies `updateSettings` is called when the input changes.
