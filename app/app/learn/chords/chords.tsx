import Piano from "@/app/components/learn/piano";
import PlayReplayButton from "@/app/components/learn/playReplayButton";
import { TIME_BEFORE_QUESTION_AFTER_CADENCE } from "@/app/constants/cadences";
import { midiToNote, Note } from "@/app/constants/notes";
import { getNextQuestionChord } from "@/app/lib/questions";
import { playCadence, playChord } from "@/app/lib/webAudio";
import { SettingsContext } from "@/app/provider/settingsProvider";
import { useMIDINotes } from "@react-midi/hooks";
import { MIDINote } from "@react-midi/hooks/dist/types";
import { useContext, useEffect, useState } from "react";

export default function Chords() {
  //currentNote usestate var
  const [currentChord, setCurrentChord] = useState<Note[] | null>(null);
  const [questionChord, setQuestionChord] = useState<Note[] | null>(null);
  const [questionsInARow, setQuestionsInARow] = useState(0);
  const { settings } = useContext(SettingsContext);
  const notes = useMIDINotes();

  useEffect(() => {
    handleIncomingMidiNotes(notes);
  }, [notes]);

  useEffect(() => {
    setQuestionChord(null);
  }, [settings]);

  const handleIncomingMidiNotes = (notes: MIDINote[]) => {
    if (notes.length == settings.chordSize) {
      const chordPlayed = notes.map((note) => midiToNote[note.note]);
      if (
        chordPlayed.length === questionChord?.length &&
        chordPlayed.every((note) => questionChord.includes(note))
      ) {
        const nextQuestionChord = getNextQuestionChord(
          settings.questionNoteWeights,
          settings.questionRange,
          settings.chordSize
        );
        setQuestionChord(nextQuestionChord);
        playChord(nextQuestionChord);
        setQuestionsInARow(questionsInARow + 1);
        setCurrentChord(chordPlayed);
      } else {
        setQuestionsInARow(0);
        setCurrentChord(chordPlayed);
      }
    }
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 ">
      <PlayReplayButton
        onPlay={async () => {
          playCadence(settings.questionKey);
          await new Promise((res) =>
            setTimeout(res, TIME_BEFORE_QUESTION_AFTER_CADENCE)
          );
          if (questionChord) {
            playChord(questionChord);
          } else {
            const nextQuestionChord = getNextQuestionChord(
              settings.questionNoteWeights,
              settings.questionRange,
              settings.chordSize
            );
            setQuestionChord(nextQuestionChord);
            playChord(nextQuestionChord);
          }
        }}
      />
      <Piano
        displayRange={settings.questionRange}
        notesDown1={currentChord ? currentChord : []}
        notesDown2={
          settings.showQuestionNotes ? (questionChord ? questionChord : []) : []
        }
      />
      <h2 className=" mt-8 font-bold text-[var(--middleground1)]">
        {questionsInARow}
      </h2>
    </div>
  );
}
