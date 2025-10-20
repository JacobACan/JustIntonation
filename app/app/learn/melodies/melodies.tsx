"use client";

import { MIDINote } from "@react-midi/hooks/dist/types";
import { useContext, useEffect, useState } from "react";
import { Duration, midiToNote, Note } from "../../constants/notes";
import { useMIDINotes } from "@react-midi/hooks";
import { SettingsContext } from "../../provider/settingsProvider";
import { noteToNoteFile } from "../../lib/notes";
import { playCadence, playMelody, playNote } from "../../lib/webAudio";
import { getNextQuestionNote } from "../../lib/questions";
import Piano from "@/app/components/learn/piano";
import PlayReplayButton from "@/app/components/learn/playReplayButton";
import { TIME_BEFORE_QUESTION_AFTER_CADENCE } from "@/app/constants/cadences";

export default function Melodies() {
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [questionNote, setQuestionNote] = useState<Note | null>(null);
  const [questionsInARow, setQuestionsInARow] = useState(0);
  const { settings } = useContext(SettingsContext);
  const notes = useMIDINotes();

  useEffect(() => {
    handleIncomingMidiNotes(notes);
  }, [notes]);

  const handleIncomingMidiNotes = (notes: MIDINote[]) => {};

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 ">
      <PlayReplayButton
        onPlay={async () => {
          playMelody([
            { note: Note.G3, duration: Duration.EigthNote },
            { note: Note.A3, duration: Duration.EigthNote },
            { note: Note.C4, duration: Duration.QuarterNote },
            { note: Note.D4, duration: Duration.WholeNote },
          ]);
        }}
      />
      <h2 className=" mt-8 font-bold text-[var(--middleground1)]">
        {questionsInARow}
      </h2>
    </div>
  );
}
