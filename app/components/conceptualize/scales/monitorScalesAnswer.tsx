"use client";

import { ScalesQuizMachineContext } from "@/components/providers/scalesQuizProvider";
import { noteToMidi } from "@/constants/midi";
import { ScalesQuizEvent } from "@/machines/scalesQuizProcess";
import { useMIDINote } from "@react-midi/hooks";
import { useSelector } from "@xstate/react";
import { useContext, useEffect } from "react";

export default function MonitorScalesAnswer() {
  const note = useMIDINote();
  const scalesQuizActor = useContext(ScalesQuizMachineContext);
  if (!scalesQuizActor) return <></>;

  const { expectedAnswer } = useSelector(scalesQuizActor, (a) => ({
    expectedAnswer: a.context.questionContext.expectedAnswer,
  }));

  useEffect(() => {
    if (note && note.on && expectedAnswer) {
      if (note.note % 12 === noteToMidi[expectedAnswer] % 12) {
        scalesQuizActor.send({ type: ScalesQuizEvent.CORRECT_GUESS });
      } else {
        scalesQuizActor.send({ type: ScalesQuizEvent.INCORRECT_GUESS });
      }
    }
  }, [note]);

  return <></>;
}
