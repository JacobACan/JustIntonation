"use client";

import { MIDINote } from "@react-midi/hooks/dist/types";
import { useContext, useEffect, useState } from "react";
import { midiToNote, Note } from "../constants/notes";
import { useMIDINotes } from "@react-midi/hooks";
import Settings from "../components/settings/settings";
import Piano from "../components/piano";
import { SettingsContext } from "../provider/settingsProvider";
import { noteToNoteFile } from "../lib/notes";
import { playCadence, playNote } from "../lib/webAudio";
import { SettingsIcon } from "../components/settings/settingsIcon";
import { getNextQuestionNote } from "../lib/questions";

const TIME_BEFORE_QUESTION_AFTER_CADENCE = 1400; // Time in ms

export default function Learn() {
  //currentNote usestate var
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [questionNote, setQuestionNote] = useState<Note | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [questionsInARow, setQuestionsInARow] = useState(0);
  const { settings, updateSettings } = useContext(SettingsContext);
  const notes = useMIDINotes();

  useEffect(() => {
    handleIncomingMidiNotes(notes);
  }, [notes]);

  useEffect(() => {
    setIsLearning(false);
  }, [settings]);

  const handleIncomingMidiNotes = (notes: MIDINote[]) => {
    if (notes.length > 0) {
      const note = notes[0];
      const notePlayed = midiToNote[note.note];
      if (notePlayed === questionNote) {
        console.log(questionsInARow, settings.questionsInARow);
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
    <div className="flex flex-col items-center justify-center min-h-screen py-2 font-sans relative">
      {/* Settings gear icon */}
      <button
        className="absolute top-4 right-4 z-50 bg-transparent border-none p-2 cursor-pointer hover:scale-110 transition-transform"
        aria-label="Open settings"
        onClick={() => setSettingsOpen(true)}
      >
        <SettingsIcon />
      </button>
      {/* Settings overlay */}
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <button
        className="mb-6 flex items-center justify-center"
        aria-label={questionNote ? "Replay" : "Play"}
        onClick={async () => {
          setIsLearning(true);
          playCadence(settings.questionKey);
          await new Promise((res) =>
            setTimeout(res, TIME_BEFORE_QUESTION_AFTER_CADENCE)
          );
          if (questionNote) {
            playNote(noteToNoteFile(questionNote));
          } else {
            const nextQuestionNote = getNextQuestionNote(
              settings.questionNoteWeights,
              settings.questionRange
            );
            setQuestionNote(nextQuestionNote);
            playNote(noteToNoteFile(nextQuestionNote));
          }
        }}
        style={{
          background: "none",
          border: "none",
          outline: "none",
          cursor: "pointer",
        }}
      >
        {isLearning ? (
          // Replay SVG (circular arrow)
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            stroke="var(--middleground1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M24 8
                 A16 16 0 1 1 8 24
                 A16 16 0 0 1"
            />
            <polyline points="3,24 14,23 9,18 3,24" />
          </svg>
        ) : (
          // Play SVG (hand-drawn triangle)
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            stroke="var(--middleground1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon
              points="20,16 34,24 20,32"
              fill="var(--middleground1)"
              stroke="var(--middleground1)"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <Piano
        displayRange={settings.questionRange}
        notesDown1={[...(currentNote ? [currentNote] : [])]}
        notesDown2={[...(questionNote ? [questionNote] : [])]}
      />
      <h2 className=" mt-8 font-bold text-[var(--middleground1)]">
        {questionsInARow}
      </h2>
    </div>
  );
}
