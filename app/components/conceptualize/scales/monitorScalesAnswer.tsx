"use client";

import { ScalesQuizMachineContext } from "@/components/providers/scalesQuizProvider";
import { noteToMidi } from "@/constants/midi";
import { midiToNote } from "@/constants/notes";
import { ScalesQuizMode } from "@/constants/scalesQuizSettings";
import { ScalesQuizEvent } from "@/machines/scalesQuizProcess";
import { useMIDINote } from "@react-midi/hooks";
import { useSelector } from "@xstate/react";
import { useContext, useEffect } from "react";

export default function MonitorScalesAnswer() {
  const note = useMIDINote();
  const scalesQuizActor = useContext(ScalesQuizMachineContext);
  if (!scalesQuizActor) return <></>;

  const { expectedAnswer, currentMelody, melodyProgress, quizMode } =
    useSelector(scalesQuizActor, (a) => ({
      expectedAnswer: a.context.questionContext.expectedAnswer,
      currentMelody: a.context.questionContext.currentMelody,
      melodyProgress: a.context.questionContext.melodyProgress,
      quizMode: a.context.settings.quizMode,
    }));

  useEffect(() => {
    if (!note || !note.on) return;

    if (quizMode === ScalesQuizMode.Melody && currentMelody) {
      // Melody mode: track note-by-note progress
      const expectedMelodyNote = currentMelody[melodyProgress];
      if (!expectedMelodyNote) return;

      if (note.note % 12 === expectedMelodyNote.note % 12) {
        // Correct note in sequence
        if (melodyProgress + 1 >= currentMelody.length) {
          // Completed the full melody
          scalesQuizActor.send({ type: ScalesQuizEvent.CORRECT_GUESS });
        } else {
          scalesQuizActor.send({
            type: ScalesQuizEvent.MELODY_NOTE_CORRECT,
          });
        }
      } else {
        // Wrong note
        scalesQuizActor.send({
          type: ScalesQuizEvent.INCORRECT_GUESS,
          wrongIndex: melodyProgress,
          wrongNote: midiToNote[note.note],
        });
      }
    } else if (expectedAnswer) {
      // Degree mode: single note pitch class match
      if (note.note % 12 === noteToMidi[expectedAnswer] % 12) {
        scalesQuizActor.send({ type: ScalesQuizEvent.CORRECT_GUESS });
      } else {
        scalesQuizActor.send({ type: ScalesQuizEvent.INCORRECT_GUESS });
      }
    }
  }, [note]);

  return <></>;
}
