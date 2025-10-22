import { useContext } from "react";
import { SettingsContext } from "../providers/settingsProvider";
import { midiToNote, Note } from "../../constants/notes";
import { noteToMidi } from "@/constants/midi";

export default function QuestionNoteRangeSelector() {
  const { settings, updateSettings } = useContext(SettingsContext);

  return (
    <div className="flex flex-col">
      From {settings.questionRange[0]} - {settings.questionRange[1]}
      <input
        onChange={(e) => {
          updateSettings("questionRange", [
            midiToNote[e.target.valueAsNumber],
            settings.questionRange[1],
          ]);
        }}
        type="range"
        name="bottom note"
        min={noteToMidi[Note.A0]}
        max={noteToMidi[Note.C4]}
        value={noteToMidi[settings.questionRange[0]]}
      />
      <input
        onChange={(e) => {
          updateSettings("questionRange", [
            settings.questionRange[0],
            midiToNote[e.target.valueAsNumber],
          ]);
        }}
        type="range"
        name="top note"
        min={noteToMidi[Note.C4]}
        max={noteToMidi[Note.C8]}
        value={noteToMidi[settings.questionRange[1]]}
      />
    </div>
  );
}
