"use client";

import { MIDINote } from "@react-midi/hooks/dist/types";
import { useEffect, useState } from "react";
import {
  midiToNote,
  Note,
  noteFiles,
  noteFilesArray,
  noteFilesToNotes,
} from "../constants/notes";
import { useMIDINotes } from "@react-midi/hooks";
import { cadenceFiles } from "../constants/cadences";
import Settings from "../components/settings";
import Piano from "../components/piano";

export default function Learn() {
  // Helper to play a note by filename
  const playNote = (noteFile: noteFiles) => {
    const audio = new Audio(`/notes/${noteFile}`);
    audio.play();
  };
  // Helper to play a note by filename
  const playCadence = (cadenceFile: cadenceFiles) => {
    const audio = new Audio(`/cadences/${cadenceFile}`);
    audio.play();
  };

  //currentNote usestate var
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [questionNote, setQuestionNote] = useState<Note | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const notes = useMIDINotes();

  const getNextQuestionNote = () => {
    // play Random note from public/notes
    const random =
      noteFilesArray[Math.floor(Math.random() * noteFilesArray.length)];
    playNote(random);
    setQuestionNote(noteFilesToNotes[random] || null);
  };

  useEffect(() => {
    console.log("HELLO");
    handleMidiNotes(notes);
  }, [notes]);

  // Handler for MIDI notes (moved from MidiSelector)
  const handleMidiNotes = (notes: MIDINote[]) => {
    console.log(notes);
    if (notes.length > 0) {
      const note = notes[0];
      const notePlayed = midiToNote[note.note];
      if (notePlayed === questionNote) {
        getNextQuestionNote();
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
        {/* SVG gear icon, hand-drawn style */}
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          stroke="var(--middleground1)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="18" r="8" fill="var(--background2)" />
          <path d="M18 4 L18 0 M18 36 L18 32 M4 18 L0 18 M36 18 L32 18 M28.5 7.5 L31 5 M7.5 28.5 L5 31 M28.5 28.5 L31 31 M7.5 7.5 L5 5" />
          <circle cx="18" cy="18" r="4" fill="var(--middleground1)" />
        </svg>
      </button>
      {/* Settings overlay */}
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <button
        className="mb-4"
        onClick={() => {
          playCadence(cadenceFiles.C4);
        }}
      >
        Play Cadence
      </button>
      <button
        className="mb-4"
        onClick={() => {
          const random =
            noteFilesArray[Math.floor(Math.random() * noteFilesArray.length)];
          playNote(random);
          setQuestionNote(noteFilesToNotes[random] || null);
        }}
      >
        Play Random Note
      </button>
      <Piano
        displayRange={[Note.C4, Note.D5]}
        notesDown1={[...(currentNote ? [currentNote] : [])]}
        notesDown2={[...(questionNote ? [questionNote] : [])]}
        width={500}
      />
      {/* MidiSelector is now in Settings overlay, but we still need to listen for MIDI notes globally */}
      <div className="hidden">
        {/* Hidden MidiSelector for MIDI input handling */}
        {/* @ts-ignore */}
        <Settings open={true} onClose={() => {}} />
      </div>
    </div>
  );
}
