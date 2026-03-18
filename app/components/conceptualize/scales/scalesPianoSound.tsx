"use client";

import { midiToNote } from "@/constants/notes";
import { noteToNoteFile } from "@/lib/notes";
import { playNote } from "@/lib/webAudio";
import { useMIDINote } from "@react-midi/hooks";
import { useContext, useEffect } from "react";
import { ScalesQuizSettingsContext } from "@/components/providers/scalesQuizSettingsProvider";

export default function ScalesPianoSound() {
  const note = useMIDINote();
  const { settings } = useContext(ScalesQuizSettingsContext);

  useEffect(() => {
    if (settings.pianoSoundEnabled && note && note.on) {
      playNote(noteToNoteFile(midiToNote[note.note]));
    }
  }, [note, settings.pianoSoundEnabled]);

  return <></>;
}
