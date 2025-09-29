"use client";

import { MIDINote } from "@react-midi/hooks/dist/types";
import { useContext, useEffect, useState } from "react";
import { midiToNote, Note } from "../../constants/notes";
import { useMIDINotes } from "@react-midi/hooks";
import { SettingsContext } from "../../provider/settingsProvider";
import { noteToNoteFile } from "../../lib/notes";
import { playCadence, playNote } from "../../lib/webAudio";
import { getNextQuestionNote } from "../../lib/questions";
import Piano from "@/app/components/learn/piano";
import PlayReplayButton from "@/app/components/learn/playReplayButton";
import { TIME_BEFORE_QUESTION_AFTER_CADENCE } from "@/app/constants/cadences";

export default function Notes() {
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [questionNote, setQuestionNote] = useState<Note | null>(null);
  const [questionsInARow, setQuestionsInARow] = useState(0);
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
      <PlayReplayButton
        onPlay={async () => {
          if (questionNote) {
            playNote(noteToNoteFile(questionNote));
          } else {
            if (settings.playCadence) playCadence(settings.questionKey);
            await new Promise((res) =>
              setTimeout(res, TIME_BEFORE_QUESTION_AFTER_CADENCE)
            );
            const nextQuestionNote = getNextQuestionNote(
              settings.questionNoteWeights,
              settings.questionRange
            );
            setQuestionNote(nextQuestionNote);
            playNote(noteToNoteFile(nextQuestionNote));
          }
        }}
      />
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
