This top-level guide explains how settings are organized inside `app/components/learningApproachUI` and where to add a new setting depending on its scope.

Quick overview

- General settings (UI shown in the left settings panel) live under `generalSettings/` and should be added to `renderGeneralSettings()` in `learningApproach.tsx`.
- Main settings (overall controls such as MIDI selector, learning mode, and question range) are in `mainSettings/` and are rendered by `renderMainSettings()` in `learningApproach.tsx`.
- Mode-specific settings (for a particular LearningMode) are in `chordSettings/` and `melodySettings/` and are rendered inside `renderModeSettings()` in `learningApproach.tsx` — these should be added to the mode-specific folders and not to the general panel.

Where to make changes (concrete files)

- Types & defaults: `app/constants/settings.tsx`
- Provider / Context: `app/components/providers/settingsProvider.tsx`
- Top-level renderer: `app/components/learningApproachUI/learningApproach.tsx`
- General settings folder: `app/components/learningApproachUI/generalSettings/`
- Main settings folder: `app/components/learningApproachUI/mainSettings/`
- Chord settings folder: `app/components/learningApproachUI/chordSettings/`
- Melody settings folder: `app/components/learningApproachUI/melodySettings/`

Decision guide — where to put your new setting

- If the setting affects the whole learning experience (key, scale, number of questions, cadence playback, etc.), add it to `generalSettings/` and import it into the `renderGeneralSettings()` list.
- If the setting changes which questions are generated (range, MIDI input selection, learning mode), add it to `mainSettings/` and render it with `renderMainSettings()`.
- If the setting only applies when a particular LearningMode is active (for example, chord size only applies when LearningMode.Chords), add it to the corresponding mode folder and follow the `renderModeSettings()` pattern — the mode renderer will conditionally render your control.

Checklist before you code

1. Add type + default in `app/constants/settings.tsx`.
2. Create the component in the appropriate folder and use `SettingsContext`.
3. Add import & render where the folder expects it (main, general, or mode settings).
4. Test in dev server and verify other consumers pick up the change.

Examples and links are present in each folder's how-to file.
