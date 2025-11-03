"use client";

import { useContext } from "react";
import { SettingsContext } from "../../components/providers/settingsProvider";
import CountdownProvider from "@/components/providers/countdownProvider";
import LearningUserEvent from "@/components/learn/learningUserEvent";
import PlayIcon from "@/components/icon/playIcon";
import {
  MusicLearnerEvent,
  MusicLearnerState,
} from "@/machines/musicLearningProcess";
import { MusicLearnerContext } from "@/components/providers/learningStateMachineProvider";
import { useSelector } from "@xstate/react";
import ReplayIcon from "@/components/icon/replayIcon";
import ContinueIcon from "@/components/icon/continueIcon";
import BackIcon from "@/components/icon/backIcon";
import MonitorNotes from "@/components/learn/midiInputUserEvents/notes";
import { LearningMode } from "@/constants/settings";
import MonitorChords from "@/components/learn/midiInputUserEvents/chords";
import MonitorMelodies from "@/components/learn/midiInputUserEvents/melodies";
import CountdownVisualization from "@/components/learn/visualizations/countdown";
import GuessingVisualization from "@/components/learn/visualizations/guessing/guessing";

export default function LearnQuestions() {
  const { settings } = useContext(SettingsContext);

  const musicLearner = useContext(MusicLearnerContext);
  if (!musicLearner) return;

  const {
    isIdle,
    isGuessing,
    isReviewing,
    isViewingResults,
    totalQuestions,
    questionContext,
  } = useSelector(musicLearner, (s) => {
    return {
      isIdle: s.matches(MusicLearnerState.IDLE),
      isGuessing: s.matches(MusicLearnerState.GUESSING),
      isReviewing: s.matches(MusicLearnerState.REVIEWING),
      isViewingResults: s.matches(MusicLearnerState.VIEWING_RESULTS),
      totalQuestions: s.context.settings.numberOfQuestions,
      questionContext: s.context.questionContext,
    };
  });

  const renderUserActions = () => {
    return (
      <section className="w-[50px] h-[50px]">
        {isIdle && (
          <LearningUserEvent eventType={MusicLearnerEvent.START}>
            <PlayIcon />
          </LearningUserEvent>
        )}
        {isGuessing && (
          <LearningUserEvent eventType={MusicLearnerEvent.REPLAY}>
            <ReplayIcon />
          </LearningUserEvent>
        )}
        {(isReviewing || isViewingResults) && (
          <LearningUserEvent eventType={MusicLearnerEvent.CONTINUE}>
            <ContinueIcon />
          </LearningUserEvent>
        )}
      </section>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 ">
      <LearningUserEvent
        className=" absolute left-5 top-5"
        eventType={MusicLearnerEvent.CHANGE_LEARNING_APPROACH}
      >
        <BackIcon height={40} width={40} />
      </LearningUserEvent>
      {renderUserActions()}
      <CountdownProvider>
        <CountdownVisualization />
      </CountdownProvider>
      <GuessingVisualization />
      <h2 className=" mt-8 font-bold text-[var(--middleground1)]">
        {questionContext.questionNumber} / {totalQuestions}
      </h2>
      {isGuessing &&
        ((settings.learningMode == LearningMode.Notes && <MonitorNotes />) ||
          (settings.learningMode == LearningMode.Chords && <MonitorChords />) ||
          (settings.learningMode == LearningMode.Melodies && (
            <MonitorMelodies />
          )))}
    </div>
  );
}
