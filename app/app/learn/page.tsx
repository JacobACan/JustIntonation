"use client";
import { useContext, useEffect } from "react";
import Chords from "./chords/chords";
import Notes from "./notes/notes";
import {
  LearningMode,
  SettingsContext,
} from "../../components/providers/settingsProvider";
import Melodies from "./melodies/melodies";
import { MusicLearnerContext } from "@/components/providers/learningStateMachineProvider";
import { useSelector } from "@xstate/react";
import Settings from "@/components/settings/settings";
import { MusicLearnerState } from "@/machines/musicLearningProcess";

export default function Learn() {
  const musicLearnerActorRef = useContext(MusicLearnerContext);
  if (!musicLearnerActorRef) throw new Error("No Music Learning Context");

  const selectingLearningApproach = useSelector(musicLearnerActorRef, (s) =>
    s.matches(MusicLearnerState.SELECTING_LEARNING_APPROACH)
  );
  const learningMode = useSelector(
    musicLearnerActorRef,
    (s) => s.context.learningMode
  );

  const LearningApproach = () => {
    switch (learningMode) {
      case LearningMode.Notes:
        return <Notes />;
      case LearningMode.Chords:
        return <Chords />;
      case LearningMode.Melodies:
        return <Melodies />;
    }
  };

  return (
    <>
      {selectingLearningApproach && <Settings />}{" "}
      {!selectingLearningApproach && LearningApproach()}
    </>
  );
}
