"use client";

import { MIDINote } from "@react-midi/hooks/dist/types";
import { use, useContext, useEffect, useState } from "react";
import {
  midiToNote,
  Note,
  NoteFile,
  noteToMidi,
  noteToNoteFile,
} from "../constants/notes";
import { useMIDINotes } from "@react-midi/hooks";
import { keyToCadence } from "../constants/cadences";
import Settings from "../components/settings/settings";
import Piano from "../components/piano";
import { SettingsContext } from "../provider/settingsProvider";

export default function Learn() {
  // Helper to play a note by filename
  const playNote = (noteFile: NoteFile) => {
    const audio = new Audio(`/notes/${noteFile}`);
    audio.play();
  };
  // Helper to play a note by filename
  const playCadence = () => {
    const cadenceFile = keyToCadence[settings.questionKey];
    const audio = new Audio(`/cadences/${cadenceFile}`);
    audio.play();
  };
  // Helper to convert Note[] to NoteFile[]
  const notesToNoteFiles = (n: Note[], nf: NoteFile[]): NoteFile[] => {
    return n.map((p) => noteToNoteFile(p));
  };

  //currentNote usestate var
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [questionNote, setQuestionNote] = useState<Note | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings } = useContext(SettingsContext);
  const [isLearning, setIsLearning] = useState(false);
  const notes = useMIDINotes();

  const getNextQuestionNote = () => {
    // Get all notes in the question range with weight > 0

    const questionNotes = settings.questionNoteWeights
      .filter(
        (nw) =>
          nw.weight > 0 &&
          noteToMidi[nw.note] >=
            noteToMidi[settings?.questionRange[0] ?? Note.C4] &&
          noteToMidi[nw.note] <=
            noteToMidi[settings?.questionRange[1] ?? Note.C5]
      )
      .map((nw) => nw.note);

    const randomNote =
      questionNotes[Math.floor(Math.random() * questionNotes.length)];
    const randomNoteFile = noteToNoteFile(randomNote);
    playNote(randomNoteFile);
    setQuestionNote(randomNote);
  };

  useEffect(() => {
    handleMidiNotes(notes);
  }, [notes]);

  useEffect(() => {
    setIsLearning(false);
  }, [settings]);

  // Handler for MIDI notes (moved from MidiSelector)
  const handleMidiNotes = (notes: MIDINote[]) => {
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
        <svg
          width="25"
          height="25"
          viewBox="0 0 50 50" // Add viewBox for scaling
          xmlns="http://www.w3.org/2000/svg"
        >
          <g>
            <title>Layer 1</title>
            <g stroke="null" id="svg_18">
              <rect
                stroke="var(--middleground1)"
                rx="15"
                id="svg_19"
                height="5.29247"
                width="26.15139"
                y="8.06302"
                x="3.33336"
                fill="var(--middleground1)"
              />
              <rect
                stroke="var(--middleground1)"
                rx="15"
                id="svg_20"
                height="5.29247"
                width="26.15139"
                y="16.63573"
                x="3.33336"
                fill="var(--middleground1)"
              />
              <rect
                stroke="var(--middleground1)"
                rx="15"
                id="svg_21"
                height="5.29247"
                width="26.15139"
                y="25.01289"
                x="3.33336"
                fill="var(--middleground1)"
              />
              <g stroke="null" id="svg_25">
                <rect
                  stroke="var(--middleground1)"
                  transform="matrix(0.192096 0.0334171 -0.0269974 0.237775 52.9981 20.9722)"
                  rx="11"
                  id="svg_22"
                  height="171.55256"
                  width="19.82768"
                  y="-65.13318"
                  x="-104.29039"
                  fill="var(--middleground1)"
                />
                <ellipse
                  stroke="var(--middleground1)"
                  ry="7.24479"
                  rx="8.94673"
                  id="svg_23"
                  cy="40.29746"
                  cx="25.25334"
                  fill="var(--middleground1)"
                />
                <path
                  stroke="var(--middleground1)"
                  id="svg_24"
                  d="m36.50033,2.46353l5.86108,2.0747l2.98434,2.08791l1.16779,1.9273l0.64877,2.81064l0.06488,2.81064l-0.51902,0.56213l-0.58389,0.0803l-0.77853,-0.48182l-0.25951,-1.36517l-0.45414,-1.847l-0.64877,-1.44547l-1.23266,-1.36517l-1.42729,-1.12426l-1.36242,-0.72273l-1.62192,-0.48183l-1.16778,-0.40152l-0.67093,-3.11865z"
                  opacity="NaN"
                  fill="var(--middleground1)"
                />
              </g>
            </g>
          </g>
        </svg>
      </button>
      {/* Settings overlay */}
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <button
        className="mb-6 flex items-center justify-center"
        aria-label={questionNote ? "Replay" : "Play"}
        onClick={async () => {
          setIsLearning(true);
          playCadence();
          await new Promise((res) => setTimeout(res, 1200));
          if (questionNote) {
            playNote(noteToNoteFile(questionNote));
          } else {
            getNextQuestionNote();
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
      <div className="hidden">
        <Settings open={true} onClose={() => {}} />
      </div>
    </div>
  );
}
