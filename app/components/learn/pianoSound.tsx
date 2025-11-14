import { midiToNote } from "@/constants/notes";
import { noteToNoteFile } from "@/lib/notes";
import { playNote } from "@/lib/webAudio";
import { useMIDINote } from "@react-midi/hooks";
import { useContext, useEffect } from "react";
import { SettingsContext } from "@/components/providers/settingsProvider";

export default function PianoSound() {
  const note = useMIDINote();
  const { settings } = useContext(SettingsContext);

  useEffect(() => {
    if (!settings.pianoSoundMuted && note && note.on) {
      playNote(noteToNoteFile(midiToNote[note.note]));
    }
  }, [note, settings.pianoSoundMuted]);

  return <></>;
}
