"use client";

import { MIDINote } from "@react-midi/hooks/dist/types";
import { useContext, useEffect, useState } from "react";
import { midiToNote, Note } from "../../../constants/notes";
import { useMIDINotes } from "@react-midi/hooks";
import { SettingsContext } from "../../../components/providers/settingsProvider";
import { noteToNoteFile } from "../../../lib/notes";
import { playCadence, playNote } from "../../../lib/webAudio";
import { getNextQuestionNote } from "../../../lib/questions";
import Piano from "@/components/learn/piano";
import PlayReplayButton from "@/components/learn/learningUserEvent";
import { Progress } from "@/components/ui/progress";
import { CountdownContext } from "@/components/providers/countdownProvider";

export default function Notes() {
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [questionNote, setQuestionNote] = useState<Note | null>(null);
  const [questionsInARow, setQuestionsInARow] = useState(0);
  const { startCountdownTimer, countdownTimer } = useContext(CountdownContext);
  const { settings } = useContext(SettingsContext);
  const notes = useMIDINotes();

  useEffect(() => {
    handleIncomingMidiNotes(notes);
  }, [notes]);

  const handleIncomingMidiNotes = (notes: MIDINote[]) => {
    if (notes.length > 0) {
      const note = notes[0];
      const notePlayed = midiToNote[note.note];
      if (notePlayed === questionNote) {
        const nextQuestionNote = getNextQuestionNote(
          settings.questionNoteWeights,
          settings.questionRange
        );
        setQuestionNote(nextQuestionNote);
        playNote(noteToNoteFile(nextQuestionNote));
        setQuestionsInARow(questionsInARow + 1);
      } else {
        setQuestionsInARow(0);
      }
      setCurrentNote(notePlayed);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 ">
      <PlayButton />
      <Progress
        value={(countdownTimer.timeLeft / countdownTimer.totalTime) * 100}
        className="w-[375px] m-2"
      ></Progress>
      <Piano
        displayRange={settings.questionRange}
        notesDown2={[...(currentNote ? [currentNote] : [])]}
        notesDown1={[
          ...(settings.showQuestionNotes
            ? questionNote
              ? [questionNote]
              : []
            : []),
        ]}
      />
      <h2 className=" mt-8 font-bold text-[var(--middleground1)]">
        {questionsInARow}
      </h2>
    </div>
  );
}
