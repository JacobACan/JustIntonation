"use client";

import { useContext } from "react";
import { ScalesQuizMachineContext } from "@/components/providers/scalesQuizProvider";
import { useSelector } from "@xstate/react";
import { ScalesQuizState } from "@/machines/scalesQuizProcess";
import ScalesQuiz from "@/components/conceptualize/scales/scalesQuiz";
import ScalesQuizSettings from "@/components/conceptualize/scales/scalesQuizSettings";

export default function ScalesPage() {
  const scalesQuizActor = useContext(ScalesQuizMachineContext);
  if (!scalesQuizActor) throw new Error("No Scales Quiz Context");

  const isConfiguring = useSelector(scalesQuizActor, (s) =>
    s.matches(ScalesQuizState.CONFIGURING),
  );

  return (
    <>
      {isConfiguring && <ScalesQuizSettings />}
      {!isConfiguring && <ScalesQuiz />}
    </>
  );
}
