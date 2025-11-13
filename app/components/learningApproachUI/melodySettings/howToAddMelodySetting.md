This document explains how to add a melody-mode setting (applies only when LearningMode.Melodies).

Where melody settings live

- Folder: `app/components/learningApproachUI/melodySettings/`
- Rendered by: the `renderModeSettings()` branch in `app/components/learningApproachUI/learningApproach.tsx` when `settings.learningMode === LearningMode.Melodies`.

Steps

1. If needed, add the setting type & default to `app/constants/settings.tsx`.
2. Create a component in this folder, e.g. `MelodyLengthSelector.tsx`.
   - Use `const { settings, updateSettings } = useContext(SettingsContext)`.
   - Call `updateSettings("melodyLength", n)` to update.
3. The mode renderer in `learningApproach.tsx` already imports and renders `MelodyLengthSelector` — if you add a new file, import it at the top of `learningApproach.tsx` and include it in the Melodies branch inside `renderModeSettings()`.

Example pattern

```tsx
// inside your new Melody setting component
const { settings, updateSettings } = useContext(SettingsContext);

return (
  <div>
    <h2>Melody Length</h2>
    <input type="number" min={1} value={settings.melodyLength} onChange={(e)=>updateSettings("melodyLength", Number(e.target.value)||1)} />
  </div>
)
```

Notes

- Mode-specific settings should not be added to the general settings panel — they are only relevant when the mode is active.
- Keep component naming PascalCase and consistent with existing files.
