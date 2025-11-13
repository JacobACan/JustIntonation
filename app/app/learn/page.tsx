"use client";
import { useContext } from "react";
import { MusicLearnerContext } from "@/components/providers/learningStateMachineProvider";
import { useSelector } from "@xstate/react";
import { MusicLearnerState } from "@/machines/musicLearningProcess";
import LearnQuestions from "./learn";
import LearningApproach from "@/components/learningApproachUI/learningApproach";

export default function Learn() {
  const musicLearnerActorRef = useContext(MusicLearnerContext);
  if (!musicLearnerActorRef) throw new Error("No Music Learning Context");

  const selectingLearningApproach = useSelector(musicLearnerActorRef, (s) =>
    s.matches(MusicLearnerState.SELECTING_LEARNING_APPROACH)
  );
  const learningMode = useSelector(
    musicLearnerActorRef,
    (s) => s.context.settings.learningMode
  );

  return (
    <>
      {selectingLearningApproach && <LearningApproach />}{" "}
      {!selectingLearningApproach && <LearnQuestions />}
    </>
  );
}
