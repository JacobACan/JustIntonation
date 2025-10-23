"use client";

import { MIDINote } from "@react-midi/hooks/dist/types";
import { useContext, useEffect, useState } from "react";
import { Duration, midiToNote, Note } from "../../../constants/notes";
import { useMIDINote, useMIDINotes } from "@react-midi/hooks";
import { SettingsContext } from "../../../components/providers/settingsProvider";
import { noteToNoteFile } from "../../../lib/notes";
import { playCadence, playMelody, playNote } from "../../../lib/webAudio";
import { getNextQuestionNote } from "../../../lib/questions";
import Piano from "@/components/learn/piano";
import PlayReplayButton from "@/components/learn/learningUserEvent";
import { TIME_BEFORE_QUESTION_AFTER_CADENCE } from "@/constants/cadences";
import {
  checkGuessRealTime,
  melodyQuestion,
  pushGuess,
  resetGlobalGuessObject,
} from "@/lib/melodicGuesses";

const timeSinceLastGuess = 5;
const guessTime = 10;

export default function Melodies() {
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [questionNote, setQuestionNote] = useState<Note | null>(null);
  const [questionsInARow, setQuestionsInARow] = useState(0);
  const { settings } = useContext(SettingsContext);
  const note = useMIDINote();

  useEffect(() => {
    handleIncomingMidiNote(note);
  }, [note]);

  const handleIncomingMidiNote = (note: MIDINote | undefined) => {
    if (note && note.on == true) {
      pushGuess(midiToNote[note.note]);
      const status = checkGuessRealTime();
    }

    // Put this in some sort of callback thing
    if (timeSinceLastGuess > guessTime) {
      resetGlobalGuessObject();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 ">
      <PlayReplayButton
        onPlay={async () => {
          playMelody(melodyQuestion);
        }}
      />
      <h2 className=" mt-8 font-bold text-[var(--middleground1)]">
        {questionsInARow}
      </h2>
    </div>
  );
}
