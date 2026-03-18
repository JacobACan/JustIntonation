"use client";

import { useContext } from "react";
import Piano from "@/components/learn/piano";
import { ScalesQuizMachineContext } from "@/components/providers/scalesQuizProvider";
import { ScalesQuizSettingsContext } from "@/components/providers/scalesQuizSettingsProvider";
import { ScalesQuizEvent, ScalesQuizState } from "@/machines/scalesQuizProcess";
import { useSelector } from "@xstate/react";
import { noteWeightsForScale, getScaleDisplayRange } from "@/lib/key";
import { Scale } from "@/constants/scale";
import { ScalesQuizMode } from "@/constants/scalesQuizSettings";
import { Note, midiToNote } from "@/constants/notes";
import { noteToMidi } from "@/constants/midi";

export default function ScaleVisualization() {
  const { settings } = useContext(ScalesQuizSettingsContext);
  const scalesQuizActor = useContext(ScalesQuizMachineContext);
  if (!scalesQuizActor) return <></>;

  const {
    currentKey,
    expectedAnswer,
    isGuessing,
    isReviewing,
    currentMelody,
    melodyProgress,
    melodyWrongIndex,
    melodyWrongNote,
    quizMode,
  } = useSelector(scalesQuizActor, (s) => ({
    currentKey: s.context.questionContext.currentKey,
    expectedAnswer: s.context.questionContext.expectedAnswer,
    isGuessing: s.matches(ScalesQuizState.GUESSING),
    isReviewing: s.matches(ScalesQuizState.REVIEWING),
    currentMelody: s.context.questionContext.currentMelody,
    melodyProgress: s.context.questionContext.melodyProgress,
    melodyWrongIndex: s.context.questionContext.melodyWrongIndex,
    melodyWrongNote: s.context.questionContext.melodyWrongNote,
    quizMode: s.context.settings.quizMode,
  }));

  const displayRange = getScaleDisplayRange(
    currentKey,
    Scale.major,
    settings.startingDegree,
    settings.octaves,
  );

  const allScaleWeights = noteWeightsForScale(currentKey, Scale.major);
  const scaleNotes = new Set(
    allScaleWeights.filter((nw) => nw.weight > 0).map((nw) => nw.note),
  );

  const isBlackKey = (note: Note): boolean => {
    const midi = noteToMidi[note];
    const noteInOctave = midi % 12;
    return [1, 3, 6, 8, 10].includes(noteInOctave);
  };

  const getFill = (
    note: Note,
    isDown1: boolean,
    isDown2: boolean,
  ): string => {
    if (isDown1 && isDown2) return "#4ade80"; // correct — green
    if (isDown1) return "#f87171"; // incorrect — red
    if (isDown2) return "#60a5fa"; // answer highlight — blue

    const black = isBlackKey(note);

    if (scaleNotes.has(note)) {
      return black ? "#6366f1" : "#818cf8"; // scale note — indigo
    }

    return black ? "var(--piano-black)" : "var(--piano-white)";
  };

  const handleKeyClick = (note: Note) => {
    if (!isGuessing) return;

    if (quizMode === ScalesQuizMode.Melody && currentMelody) {
      const expectedMelodyNote = currentMelody[melodyProgress];
      if (!expectedMelodyNote) return;

      if (noteToMidi[note] % 12 === expectedMelodyNote.note % 12) {
        if (melodyProgress + 1 >= currentMelody.length) {
          scalesQuizActor.send({ type: ScalesQuizEvent.CORRECT_GUESS });
        } else {
          scalesQuizActor.send({ type: ScalesQuizEvent.MELODY_NOTE_CORRECT });
        }
      } else {
        scalesQuizActor.send({
          type: ScalesQuizEvent.INCORRECT_GUESS,
          wrongIndex: melodyProgress,
          wrongNote: note,
        });
      }
    } else if (expectedAnswer) {
      if (noteToMidi[note] % 12 === noteToMidi[expectedAnswer] % 12) {
        scalesQuizActor.send({ type: ScalesQuizEvent.CORRECT_GUESS });
      } else {
        scalesQuizActor.send({ type: ScalesQuizEvent.INCORRECT_GUESS });
      }
    }
  };

  // In review, show the correct note and the wrong note on the piano
  const getReviewNotes = (): Note[] | undefined => {
    if (!isReviewing) return undefined;

    if (quizMode === ScalesQuizMode.Melody && currentMelody && melodyWrongIndex !== undefined) {
      // Show the correct note at the wrong index
      const correctNote = midiToNote[currentMelody[melodyWrongIndex].note];
      return correctNote ? [correctNote] : undefined;
    }

    return expectedAnswer ? [expectedAnswer] : undefined;
  };

  const getReviewWrongNotes = (): Note[] | undefined => {
    if (!isReviewing) return undefined;
    if (melodyWrongNote) return [melodyWrongNote];
    return undefined;
  };

  return (
    <Piano
      displayRange={displayRange}
      getFill={getFill}
      onKeyClick={isGuessing ? handleKeyClick : undefined}
      notesDown1={getReviewWrongNotes()}
      notesDown2={getReviewNotes()}
    />
  );
}
