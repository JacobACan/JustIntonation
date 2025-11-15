---
applyTo: 'app/components/learningApproachUI/mainSettings/'
---

This document explains how to add a main setting — settings that affect the overall learning flow (not mode-specific).

Where main settings live

- Folder: `app/components/learningApproachUI/mainSettings/`
- Rendered by: `renderMainSettings()` inside `app/components/learningApproachUI/learningApproach.tsx`.

Common examples

- `LearningModeSelector`, `MidiSelector`, `QuestionNoteRangeSelector` are main settings already in the project.

Steps

1. Add the type and default to `app/constants/settings.tsx` if the setting is new.
2. **Add a description** to `app/constants/settingDescriptions.tsx` with a key, title, and description. This description will appear as contextual help in the UI.
3. Create a component in `mainSettings/`. Use `SettingsContext` and `updateSettings(key, value)`.
4. **Wrap your component with `SettingDescriptionWrapper`** to add the info icon and description display.
5. Import your component into `learningApproach.tsx` and add it to the `renderMainSettings()` return so it appears in the main area.

Example

```tsx
import { useContext } from "react";
import { SettingsContext } from "@/components/providers/settingsProvider";
import { SettingDescriptionWrapper } from "@/components/learningApproachUI/settingDescriptionWrapper";
import { getSettingDescription } from "@/constants/settingDescriptions";

export default function MyMainSetting() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <SettingDescriptionWrapper
      settingKey="MY_NEW_SETTING"
      description={getSettingDescription("MY_NEW_SETTING")}
    >
      <div>
        <h2>My Main Setting</h2>
        <input
          value={settings.someMainSetting}
          onChange={(e) => updateSettings("someMainSetting", e.target.value)}
        />
      </div>
    </SettingDescriptionWrapper>
  );
}
```

Notes

- Keep main settings simple and avoid mode-specific controls here — they will confuse users if displayed while another mode is active.

Design & styling

- Make the main-settings UI look polished and consistent with the rest of the app. Use the global color palette and variables defined in `app/globals.css` so your controls match the app theme and remain easy to update.
- Prefer existing project primitives (shadcn components or the `ui/` components in `app/components/ui/`) rather than low-level styling when possible — they already follow spacing and accessibility patterns used across the app.
- Use Tailwind utility classes that reference your design tokens or CSS variables from `globals.css` (for example, classes for spacing and colors) so the look adapts when the global palette changes.
- For inline styles, use CSS variables:
  - `backgroundColor: "var(--primary)"` with `color: "var(--primary-foreground)"` for high-contrast badges/tags
  - `backgroundColor: "var(--background2)"` for secondary backgrounds
  - `color: "var(--foreground)"` for text
  - `borderColor: "var(--border)"` for borders
  - These variables automatically adapt to the app's color scheme
- Keep contrast and accessibility in mind: ensure text and controls meet contrast guidelines against the background color from `globals.css`.
- Layout tips: keep main settings responsive (use flex/grid + gap utilities), align labels and controls, and give controls adequate touch/keyboard targets.

Quick example (using a hypothetical shadcn input and theme variables):

```tsx
import { useContext } from "react";
import { SettingsContext } from "@/components/providers/settingsProvider";
import { Input } from "@/components/ui/input"; // example project primitive

export default function MyMainSetting() {
  const { settings, updateSettings } = useContext(SettingsContext);
  return (
    <div className="flex flex-col gap-2 p-2">
      <label className="text-primary">My Main Setting</label>
      <Input
        className="w-full max-w-sm"
        value={settings.someMainSetting}
        onChange={(e) => updateSettings("someMainSetting", e.target.value)}
      />
    </div>
  );
}
```

Where `text-primary` and other color utilities are mapped to variables in `app/globals.css` or your tailwind theme so the control colors follow the global palette.
