import Piano from "@/components/learn/piano";
import PlayReplayButton from "@/components/learn/learningUserEvent";
import { TIME_BEFORE_QUESTION_AFTER_CADENCE } from "@/constants/cadences";
import { midiToNote, Note } from "@/constants/notes";
import { getNextQuestionChord } from "@/lib/questions";
import { playCadence, playChord } from "@/lib/webAudio";
import { SettingsContext } from "@/components/providers/settingsProvider";
import { useMIDINotes } from "@react-midi/hooks";
import { MIDINote } from "@react-midi/hooks/dist/types";
import { useContext, useEffect, useState } from "react";
import { CountdownContext } from "@/components/providers/countdownProvider";
import { Progress } from "@/components/ui/progress";

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
    setCurrentChord([]);
    setQuestionChord(null);
  }, [settings]);

  const { startCountdownTimer, countdownTimer } = useContext(CountdownContext);

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
        if (!settings.showQuestionNotes) setCurrentChord(chordPlayed);
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
          if (questionChord) {
            playChord(questionChord);
          } else {
            if (settings.playCadence) playCadence(settings.questionKey);
            await new Promise((res) =>
              setTimeout(res, TIME_BEFORE_QUESTION_AFTER_CADENCE)
            );
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
      <Progress
        value={countdownTimer.timeLeft}
        max={countdownTimer.totalTime}
        className="w-[375px] m-2"
      ></Progress>
      <Piano
        displayRange={settings.questionRange}
        notesDown2={currentChord ? currentChord : []}
        notesDown1={
          settings.showQuestionNotes ? (questionChord ? questionChord : []) : []
        }
      />
      <h2 className=" mt-8 font-bold text-[var(--middleground1)]">
        {questionsInARow}
      </h2>
    </div>
  );
}
